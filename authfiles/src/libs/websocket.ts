import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import logger from './logger.js';
import { redisSub, redisPub } from './redis.js';

interface AuthenticatedWebSocket extends WebSocket {
    userId?: string;
    organizationId?: string;
    isAlive?: boolean;
}

interface WebSocketMessage {
    type: string;
    payload: unknown;
}

class WebSocketManager {
    private wss: WebSocketServer | null = null;
    private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map(); // orgId -> clients
    private userConnections: Map<string, AuthenticatedWebSocket> = new Map(); // `orgId:userId` -> client
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    initialize(server: Server): void {
        this.wss = new WebSocketServer({ server, path: '/ws' });

        this.wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
            this.handleConnection(ws, req);
        });

        this.setupHeartbeat();
        this.setupRedisSubscriber();

        logger.info('WebSocket server initialized');
    }

    private handleConnection(ws: AuthenticatedWebSocket, req: { url?: string }): void {
        // Extract token from query string
        const url = new URL(req.url || '', `http://localhost`);
        const token = url.searchParams.get('token');
        const organizationId = url.searchParams.get('orgId');

        if (!token || !organizationId) {
            ws.close(4001, 'Missing authentication');
            return;
        }

        try {
            const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
            ws.userId = decoded.userId;
            ws.organizationId = organizationId;
            ws.isAlive = true;

            // Add to organization clients
            if (!this.clients.has(organizationId)) {
                this.clients.set(organizationId, new Set());
            }
            this.clients.get(organizationId)!.add(ws);

            // Track user connection
            const userKey = `${organizationId}:${decoded.userId}`;
            this.userConnections.set(userKey, ws);

            logger.info('WebSocket client connected', {
                userId: decoded.userId,
                organizationId
            });

            ws.on('pong', () => {
                ws.isAlive = true;
            });

            ws.on('message', (data) => {
                this.handleMessage(ws, data.toString());
            });

            ws.on('close', () => {
                this.handleDisconnect(ws);
            });

            ws.on('error', (error) => {
                logger.error('WebSocket error', { error: error.message });
                this.handleDisconnect(ws);
            });

            // Send connection success
            ws.send(JSON.stringify({ type: 'connected', payload: { userId: decoded.userId } }));

        } catch (error) {
            logger.error('WebSocket authentication failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            ws.close(4002, 'Invalid token');
        }
    }

    private handleMessage(ws: AuthenticatedWebSocket, data: string): void {
        try {
            const message: WebSocketMessage = JSON.parse(data);

            switch (message.type) {
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
                default:
                    logger.debug('Unknown WebSocket message type', { type: message.type });
            }
        } catch (error) {
            logger.error('Failed to parse WebSocket message', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private handleDisconnect(ws: AuthenticatedWebSocket): void {
        if (ws.organizationId && ws.userId) {
            const orgClients = this.clients.get(ws.organizationId);
            if (orgClients) {
                orgClients.delete(ws);
                if (orgClients.size === 0) {
                    this.clients.delete(ws.organizationId);
                }
            }

            const userKey = `${ws.organizationId}:${ws.userId}`;
            this.userConnections.delete(userKey);

            logger.info('WebSocket client disconnected', {
                userId: ws.userId,
                organizationId: ws.organizationId
            });
        }
    }

    private setupHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.wss?.clients.forEach((ws) => {
                const client = ws as AuthenticatedWebSocket;
                if (client.isAlive === false) {
                    client.terminate();
                    return;
                }
                client.isAlive = false;
                client.ping();
            });
        }, 30000);
    }

    private setupRedisSubscriber(): void {
        redisSub.subscribe('ws:broadcast', (err) => {
            if (err) {
                logger.error('Failed to subscribe to Redis channel', { error: err.message });
                return;
            }
            logger.info('Subscribed to ws:broadcast channel');
        });

        redisSub.on('message', (channel, message) => {
            if (channel === 'ws:broadcast') {
                try {
                    const { organizationId, type, payload } = JSON.parse(message);
                    this.broadcastToOrganization(organizationId, type, payload);
                } catch (error) {
                    logger.error('Failed to process Redis message', {
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
        });
    }

    broadcastToOrganization(organizationId: string, type: string, payload: unknown): void {
        const orgClients = this.clients.get(organizationId);
        if (!orgClients) return;

        const message = JSON.stringify({ type, payload });
        orgClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    sendToUser(organizationId: string, userId: string, type: string, payload: unknown): void {
        const userKey = `${organizationId}:${userId}`;
        const client = this.userConnections.get(userKey);

        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type, payload }));
        }
    }

    // Broadcast to all connections of a specific user (across all orgs)
    broadcastToUser(userId: string, message: { type: string; payload: unknown }): void {
        this.userConnections.forEach((client, key) => {
            if (key.endsWith(`:${userId}`) && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }

    // Use Redis pub/sub for multi-instance support
    async publishToOrganization(organizationId: string, type: string, payload: unknown): Promise<void> {
        await redisPub.publish('ws:broadcast', JSON.stringify({ organizationId, type, payload }));
    }

    shutdown(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.wss?.clients.forEach((ws) => {
            ws.close(1001, 'Server shutting down');
        });

        this.wss?.close();
        logger.info('WebSocket server closed');
    }

    getConnectionCount(organizationId?: string): number {
        if (organizationId) {
            return this.clients.get(organizationId)?.size || 0;
        }
        return this.wss?.clients.size || 0;
    }
}

export const wsManager = new WebSocketManager();

export function initializeWebSocketServer(server: Server): void {
    wsManager.initialize(server);
}

export default wsManager;
