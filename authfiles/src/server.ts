import { createServer } from 'http';
import app from './app.js';
import config from './config/index.js';
import logger from './libs/logger.js';
import { initializeWebSocketServer, wsManager } from './libs/websocket.js';
import { redis, redisClient } from './libs/redis.js';
import prisma from './libs/prisma.js';
import { closeQueues } from './queues/index.js';
import { startWorkers, stopWorkers } from './jobs/index.js';

const server = createServer(app);

// Initialize WebSocket
initializeWebSocketServer(server);

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
        logger.info('HTTP server closed');

        try {
            // Close WebSocket connections
            wsManager.shutdown();
            logger.info('WebSocket server closed');

            // Stop workers
            await stopWorkers();

            // Close queues
            await closeQueues();
            logger.info('Job queues closed');

            // Close Redis connections
            await redis.quit();
            await redisClient.disconnect();
            logger.info('Redis connections closed');

            // Close database connection
            await prisma.$disconnect();
            logger.info('Database connection closed');

            logger.info('Graceful shutdown complete');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
        }
    });

    // Force shutdown after timeout
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Start server
async function startServer() {
    try {
        // Verify database connection
        await prisma.$connect();
        logger.info('Database connected');

        // Verify Redis connection
        await redis.ping();
        logger.info('Redis connected');

        // Start background workers
        await startWorkers();

        // Start HTTP server
        server.listen(config.port, () => {
            logger.info(`Server running on port ${config.port} in ${config.env} mode`);
            logger.info(`API Documentation: ${config.appUrl}/api`);
            logger.info(`WebSocket: ws://localhost:${config.port}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default server;
