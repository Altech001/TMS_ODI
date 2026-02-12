import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

type RequestPart = 'body' | 'query' | 'params';

export function validate<T>(
    schema: ZodSchema<T>,
    part: RequestPart = 'body'
): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const data = schema.parse(req[part]);
            req[part] = data as typeof req[typeof part];
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors: Record<string, string[]> = {};
                error.errors.forEach((e) => {
                    const path = e.path.join('.');
                    if (!errors[path]) errors[path] = [];
                    errors[path].push(e.message);
                });
                console.error('Validation errors:', JSON.stringify(errors, null, 2));
                next(new ValidationError('Validation failed', errors));
                return;
            }
            next(error);
        }
    };
}

export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
    return validate(schema, 'body');
}

export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
    return validate(schema, 'query');
}

export function validateParams<T>(schema: ZodSchema<T>): RequestHandler {
    return validate(schema, 'params');
}
