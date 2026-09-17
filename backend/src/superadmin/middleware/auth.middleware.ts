import { Context, Next } from 'hono';
import { verifyJwtToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { UserSecurityContext } from '../types/context';
import { query } from '../db/client';

export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendError(c, 'AUTH_REQUIRED', 'Missing or invalid Authorization header', 401);
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
        return sendError(c, 'AUTH_REQUIRED', 'Bearer token is missing', 401);
    }

    try {
        const envSecret = c.env?.JWT_SECRET;
        const securityContext = await verifyJwtToken(token, envSecret);

        if (!securityContext.userId || !securityContext.tenantId || !securityContext.organizationId) {
            return sendError(c, 'AUTH_INVALID_TOKEN', 'Token payload is missing essential user context', 401);
        }

        // Fetch user permissions from database if missing from JWT
        if (!securityContext.permissions || securityContext.permissions.length === 0) {
            const permRows = await query<{ permission_code: string }>(
                `SELECT DISTINCT p.code as permission_code
                 FROM user_roles ur
                 JOIN role_permissions rp ON ur.role_id = rp.role_id
                 JOIN permissions p ON rp.permission_id = p.id
                 WHERE ur.user_id = $1`,
                [securityContext.userId]
            );
            securityContext.permissions = permRows.map(r => r.permission_code);
        }

        // Set context variable for downstream handlers
        c.set('userContext', securityContext);
        await next();
    } catch (err: any) {
        return sendError(c, 'AUTH_INVALID_TOKEN', err.message || 'Invalid or expired token', 401);
    }
}

export function getUserContext(c: Context): UserSecurityContext {
    const ctx = c.get('userContext');
    if (!ctx) {
        throw new Error('User context not found in request');
    }
    return ctx as UserSecurityContext;
}
