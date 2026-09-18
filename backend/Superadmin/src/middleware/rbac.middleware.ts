import { Context, Next } from 'hono';
import { getUserContext } from './auth.middleware';
import { sendError } from '../utils/response';

export function requirePermission(permissionCode: string) {
    return async (c: Context, next: Next) => {
        const userCtx = getUserContext(c);

        // ADMIN role bypasses individual permission checks
        if (userCtx.roles.includes('ADMIN')) {
            await next();
            return;
        }

        if (!userCtx.permissions.includes(permissionCode)) {
            return sendError(
                c,
                'PERMISSION_DENIED',
                `Insufficient permission: Required '${permissionCode}'`,
                403
            );
        }

        await next();
    };
}

export function requireRole(roleCode: string) {
    return async (c: Context, next: Next) => {
        const userCtx = getUserContext(c);

        if (!userCtx.roles.includes(roleCode) && !userCtx.roles.includes('ADMIN')) {
            return sendError(
                c,
                'ROLE_REQUIRED',
                `Insufficient role: Required '${roleCode}'`,
                403
            );
        }

        await next();
    };
}
