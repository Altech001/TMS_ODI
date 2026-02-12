import type { Request, Response, NextFunction } from 'express';
import { redis } from '../libs/redis.js';
import { TooManyRequestsError } from '../utils/errors.js';
import config from '../config/index.js';

interface RateLimitOptions {
    windowMs?: number;
    maxRequests?: number;
    keyPrefix?: string;
    keyGenerator?: (req: Request) => string;
}

export function rateLimiter(options: RateLimitOptions = {}) {
    const {
        windowMs = config.rateLimit.windowMs,
        maxRequests = config.rateLimit.maxRequests,
        keyPrefix = 'rl',
        keyGenerator = (req: Request) => {
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            return `${keyPrefix}:${ip}`;
        },
    } = options;

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const key = keyGenerator(req);
            const windowSeconds = Math.ceil(windowMs / 1000);

            const multi = redis.multi();
            multi.incr(key);
            multi.ttl(key);

            const results = await multi.exec();

            if (!results) {
                next();
                return;
            }

            const [[, count], [, ttl]] = results as [[null, number], [null, number]];

            // Set expiry if this is a new key
            if (ttl === -1) {
                await redis.expire(key, windowSeconds);
            }

            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - Number(count)));
            res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + (ttl > 0 ? ttl : windowSeconds));

            if (Number(count) > maxRequests) {
                const retryAfter = ttl > 0 ? ttl : windowSeconds;
                res.setHeader('Retry-After', retryAfter);
                throw new TooManyRequestsError('Rate limit exceeded', retryAfter);
            }

            next();
        } catch (error) {
            if (error instanceof TooManyRequestsError) {
                next(error);
                return;
            }
            // If Redis fails, allow the request
            next();
        }
    };
}

// Stricter rate limiter for auth endpoints
export function authRateLimiter() {
    return rateLimiter({
        windowMs: 60000, // 1 minute
        maxRequests: 10, // 10 requests per minute
        keyPrefix: 'rl:auth',
        keyGenerator: (req: Request) => {
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            const email = (req.body as { email?: string })?.email || '';
            return `rl:auth:${ip}:${email}`;
        },
    });
}

// Rate limiter for sensitive operations
export function sensitiveOpRateLimiter() {
    return rateLimiter({
        windowMs: 3600000, // 1 hour
        maxRequests: 20, // 20 requests per hour
        keyPrefix: 'rl:sensitive',
    });
}
