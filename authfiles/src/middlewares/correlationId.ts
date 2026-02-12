import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../libs/logger.js';

export function correlationIdMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    // Add correlation ID to logger context
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('Request completed', {
            correlationId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
        });
    });

    next();
}
