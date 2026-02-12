import type { PresenceStatus as PrismaPresenceStatus } from '@prisma/client';
import { presenceRepository } from './presence.repository.js';
import { redis } from '../../libs/redis.js';
import { wsManager } from '../../libs/websocket.js';
import type { PresenceStatus, UpdatePresenceInput } from './presence.dto.js';

const PRESENCE_KEY_PREFIX = 'presence';
const PRESENCE_TTL = 3600; // 1 hour

export class PresenceService {
    private getKey(organizationId: string, userId: string): string {
        return `${PRESENCE_KEY_PREFIX}:${organizationId}:${userId}`;
    }

    private getOrgKey(organizationId: string): string {
        return `${PRESENCE_KEY_PREFIX}:org:${organizationId}`;
    }

    async updatePresence(
        organizationId: string,
        userId: string,
        input: UpdatePresenceInput
    ) {
        const key = this.getKey(organizationId, userId);
        const orgKey = this.getOrgKey(organizationId);
        const now = Date.now();

        const presenceData = {
            status: input.status,
            updatedAt: now,
        };

        // Store in Redis
        await redis.setex(key, PRESENCE_TTL, JSON.stringify(presenceData));

        // Add to org set
        await redis.zadd(orgKey, now, userId);
        await redis.expire(orgKey, PRESENCE_TTL);

        // Store history in PostgreSQL
        await presenceRepository.createHistory({
            userId,
            organizationId,
            status: input.status as PrismaPresenceStatus,
        });

        // Broadcast to org members via WebSocket
        await wsManager.publishToOrganization(organizationId, 'presence:updated', {
            userId,
            status: input.status,
            updatedAt: now,
        });

        return { status: input.status, updatedAt: new Date(now) };
    }

    async getPresence(
        organizationId: string,
        userId: string
    ): Promise<{ status: PresenceStatus; updatedAt: Date } | null> {
        const key = this.getKey(organizationId, userId);
        const data = await redis.get(key);

        if (!data) {
            // Check PostgreSQL for historical status
            const history = await presenceRepository.getCurrentStatus(userId, organizationId);
            if (history) {
                return { status: history.status as PresenceStatus, updatedAt: history.startedAt };
            }
            return null;
        }

        const parsed = JSON.parse(data);
        return { status: parsed.status, updatedAt: new Date(parsed.updatedAt) };
    }

    async getOrgPresence(organizationId: string): Promise<Array<{
        userId: string;
        status: PresenceStatus;
        updatedAt: Date;
    }>> {
        const orgKey = this.getOrgKey(organizationId);

        // Get all user IDs with recent presence
        const userIds = await redis.zrange(orgKey, 0, -1);

        if (userIds.length === 0) {
            return [];
        }

        // Get presence for each user
        const presencePromises = userIds.map(async (userId) => {
            const presence = await this.getPresence(organizationId, userId);
            if (presence) {
                return { userId, ...presence };
            }
            return null;
        });

        const results = await Promise.all(presencePromises);
        return results.filter((r): r is NonNullable<typeof r> => r !== null);
    }

    async setOffline(organizationId: string, userId: string) {
        const key = this.getKey(organizationId, userId);
        const orgKey = this.getOrgKey(organizationId);

        // Remove from Redis
        await redis.del(key);
        await redis.zrem(orgKey, userId);

        // Update PostgreSQL history
        await presenceRepository.createHistory({
            userId,
            organizationId,
            status: 'OFFLINE',
        });

        // Broadcast
        await wsManager.publishToOrganization(organizationId, 'presence:updated', {
            userId,
            status: 'OFFLINE',
            updatedAt: Date.now(),
        });

        return { success: true };
    }

    async getPresenceHistory(
        organizationId: string,
        userId: string,
        options?: { skip?: number; take?: number }
    ) {
        return presenceRepository.getHistory(userId, organizationId, options);
    }
}

export const presenceService = new PresenceService();
export default presenceService;
