import { Context } from 'hono';
import { ApiResponse, PaginationMeta } from '../types/api';

export function sendSuccess<T>(c: Context, data: T, message?: string, pagination?: PaginationMeta, status = 200) {
    const response: ApiResponse<T> = {
        success: true,
        data,
        message: message || 'Operation completed successfully',
        ...(pagination ? { pagination } : {})
    };
    return c.json(response, status as any);
}

export function sendCreated<T>(c: Context, data: T, message?: string) {
    return sendSuccess(c, data, message || 'Resource created successfully', undefined, 201);
}

export function sendError(c: Context, code: string, message: string, status = 400, details?: any) {
    const response: ApiResponse = {
        success: false,
        error: {
            code,
            message,
            ...(details ? { details } : {})
        }
    };
    return c.json(response, status as any);
}
