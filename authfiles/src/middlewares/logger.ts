import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../libs/logger.js';

// Extend Express Request type to include correlationId
declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
        }
    }
}

export const correlationMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    req.correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    next();
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            correlationId: req.correlationId,
            userAgent: req.headers['user-agent'],
        };

        if (res.statusCode >= 500) {
            logger.error('Request failed', logData);
        } else if (res.statusCode >= 400) {
            logger.warn('Request error', logData);
        } else {
            logger.info('Request completed', logData);
        }
    });

    next();
};
