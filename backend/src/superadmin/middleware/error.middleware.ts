import { Context } from 'hono';
import { sendError } from '../utils/response';

export function globalErrorHandler(err: Error, c: Context) {
    console.error('Unhandled Application Error:', err);

    if (err.message.startsWith('AUTH_REQUIRED') || err.message.startsWith('AUTH_INVALID_TOKEN') || err.message.startsWith('AUTHENTICATION_FAILED')) {
        return sendError(c, 'AUTH_REQUIRED', err.message, 401);
    }
    if (err.message.startsWith('PERMISSION_DENIED')) {
        return sendError(c, 'PERMISSION_DENIED', err.message, 403);
    }
    if (err.message.startsWith('TENANT_ACCESS_DENIED') || err.message.startsWith('ORGANIZATION_ACCESS_DENIED')) {
        return sendError(c, 'ACCESS_DENIED', err.message, 403);
    }
    if (err.message.startsWith('RESOURCE_NOT_FOUND')) {
        return sendError(c, 'RESOURCE_NOT_FOUND', err.message, 404);
    }
    if (
        err.message.startsWith('BUSINESS_RULE_FAILED') ||
        err.message.startsWith('INVALID_STATE') ||
        err.message.startsWith('BUSINESS_VALIDATION_ERROR') ||
        (err as any).code === 'P0001' ||
        err.message.includes('Cannot complete request') ||
        err.message.includes('prerequisite') ||
        err.message.includes('completion rules') ||
        err.message.includes('violates foreign key constraint')
    ) {
        return sendError(c, 'BUSINESS_RULE_FAILED', err.message, 400);
    }

    return sendError(
        c,
        'INTERNAL_SERVER_ERROR',
        c.env?.ENVIRONMENT === 'development' ? err.message : 'An unexpected error occurred',
        500
    );
}
