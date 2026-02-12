import type { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, InternalServerError } from '../utils/errors.js';
import logger from '../libs/logger.js';
import config from '../config/index.js';

export interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code?: string;
        errors?: Record<string, string[]>;
        stack?: string;
    };
    correlationId?: string;
}

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    const correlationId = req.headers['x-correlation-id'] as string;

    // Log the error
    logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        correlationId,
    });

    // Handle malformed JSON
    if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
        res.status(400).json({
            success: false,
            error: {
                message: 'Invalid JSON format',
                code: 'INVALID_JSON',
            },
            correlationId,
        });
        return;
    }

    // Handle known app errors
    if (err instanceof AppError) {
        const response: ErrorResponse = {
            success: false,
            error: {
                message: err.message,
                code: err.code,
            },
            correlationId,
        };

        if (err instanceof ValidationError) {
            response.error.errors = err.errors;
        }

        if (config.isDevelopment && !err.isOperational) {
            response.error.stack = err.stack;
        }

        res.status(err.statusCode).json(response);
        return;
    }

    // Handle Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as unknown as { code: string; meta?: { target?: string[] } };
        let message = 'Database error';
        let statusCode = 500;

        switch (prismaError.code) {
            case 'P2002':
                message = `Unique constraint violation on ${prismaError.meta?.target?.join(', ') || 'field'}`;
                statusCode = 409;
                break;
            case 'P2025':
                message = 'Record not found';
                statusCode = 404;
                break;
            case 'P2003':
                message = 'Foreign key constraint violation';
                statusCode = 400;
                break;
        }

        res.status(statusCode).json({
            success: false,
            error: { message, code: prismaError.code },
            correlationId,
        });
        return;
    }

    // Handle Zod validation errors
    if (err.name === 'ZodError') {
        const zodError = err as unknown as { errors: { path: (string | number)[]; message: string }[] };
        const errors: Record<string, string[]> = {};

        zodError.errors.forEach((e) => {
            const path = e.path.join('.');
            if (!errors[path]) errors[path] = [];
            errors[path].push(e.message);
        });

        res.status(422).json({
            success: false,
            error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors,
            },
            correlationId,
        });
        return;
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            error: {
                message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
                code: 'AUTH_ERROR',
            },
            correlationId,
        });
        return;
    }

    // Fallback for unknown errors
    const internalError = new InternalServerError(
        config.isProduction ? 'An unexpected error occurred' : err.message
    );

    res.status(internalError.statusCode).json({
        success: false,
        error: {
            message: internalError.message,
            code: internalError.code,
            stack: config.isDevelopment ? err.stack : undefined,
        },
        correlationId,
    });
}

export function notFoundHandler(req: Request, res: Response): void {
    const correlationId = req.headers['x-correlation-id'] as string;

    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.path} not found`,
            code: 'NOT_FOUND',
        },
        correlationId,
    });
}
