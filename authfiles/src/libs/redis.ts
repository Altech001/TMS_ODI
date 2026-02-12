import Redis from 'ioredis';
import config from '../config/index.js';
import logger from './logger.js';

class RedisClient {
    private static instance: Redis | null = null;
    private static subscriber: Redis | null = null;
    private static publisher: Redis | null = null;

    static getInstance(): Redis {
        if (!this.instance) {
            this.instance = new Redis(config.redis.url, {
                maxRetriesPerRequest: 3,
                retryStrategy(times) {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                reconnectOnError(err) {
                    logger.error('Redis connection error', { error: err.message });
                    return true;
                },
            });

            this.instance.on('connect', () => {
                logger.info('Redis connected');
            });

            this.instance.on('error', (err) => {
                logger.error('Redis error', { error: err.message });
            });
        }
        return this.instance;
    }

    static getSubscriber(): Redis {
        if (!this.subscriber) {
            this.subscriber = new Redis(config.redis.url);
            this.subscriber.on('connect', () => {
                logger.info('Redis subscriber connected');
            });
        }
        return this.subscriber;
    }

    static getPublisher(): Redis {
        if (!this.publisher) {
            this.publisher = new Redis(config.redis.url);
            this.publisher.on('connect', () => {
                logger.info('Redis publisher connected');
            });
        }
        return this.publisher;
    }

    static async disconnect(): Promise<void> {
        const promises: Promise<void>[] = [];

        if (this.instance) {
            promises.push(this.instance.quit().then(() => { this.instance = null; }));
        }
        if (this.subscriber) {
            promises.push(this.subscriber.quit().then(() => { this.subscriber = null; }));
        }
        if (this.publisher) {
            promises.push(this.publisher.quit().then(() => { this.publisher = null; }));
        }

        await Promise.all(promises);
        logger.info('Redis connections closed');
    }
}

export const redis = RedisClient.getInstance();
export const redisSub = RedisClient.getSubscriber();
export const redisPub = RedisClient.getPublisher();
export const redisClient = RedisClient;
export default RedisClient;
