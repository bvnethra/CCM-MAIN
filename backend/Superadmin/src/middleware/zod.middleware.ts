import { Context, Next } from 'hono';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

export function validateBody<T>(schema: ZodSchema<T>) {
    return async (c: Context, next: Next) => {
        try {
            const body = await c.req.json();
            const parsed = schema.parse(body);
            c.set('validatedBody', parsed);
            await next();
        } catch (err: any) {
            if (err instanceof ZodError) {
                return sendError(
                    c,
                    'VALIDATION_ERROR',
                    'Invalid request body format',
                    400,
                    err.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
                );
            }
            return sendError(c, 'VALIDATION_ERROR', err.message || 'Malformed JSON input', 400);
        }
    };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
    return async (c: Context, next: Next) => {
        try {
            const queryObj = c.req.query();
            const parsed = schema.parse(queryObj);
            c.set('validatedQuery', parsed);
            await next();
        } catch (err: any) {
            if (err instanceof ZodError) {
                return sendError(
                    c,
                    'VALIDATION_ERROR',
                    'Invalid query parameters',
                    400,
                    err.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
                );
            }
            return sendError(c, 'VALIDATION_ERROR', err.message || 'Invalid query parameters', 400);
        }
    };
}

export function validateParams<T>(schema: ZodSchema<T>) {
    return async (c: Context, next: Next) => {
        try {
            const paramsObj = c.req.param();
            const parsed = schema.parse(paramsObj);
            c.set('validatedParams', parsed);
            await next();
        } catch (err: any) {
            if (err instanceof ZodError) {
                return sendError(
                    c,
                    'VALIDATION_ERROR',
                    'Invalid path parameters',
                    400,
                    err.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
                );
            }
            return sendError(c, 'VALIDATION_ERROR', err.message || 'Invalid path parameters', 400);
        }
    };
}
