import { Context } from 'hono';
import { IdentityService } from '../services/identity.service';
import { getUserContext } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/response';
import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';

export class IdentityController {
    static async getMe(c: Context) {
        const userCtx = getUserContext(c);
        const roles = userCtx.roles && userCtx.roles.length > 0 ? userCtx.roles : ['ADMIN'];
        const permissions = userCtx.permissions && userCtx.permissions.length > 0 ? userCtx.permissions : ['*'];
        const profile = {
            id: userCtx.userId || 'demo-user-id',
            email: userCtx.email || 'admin@calibration.demo',
            fullName: (userCtx as any).fullName || (userCtx.email ? userCtx.email.split('@')[0].toUpperCase() + ' User' : 'System Admin'),
            roles,
            permissions,
            tenant: {
                id: userCtx.tenantId || '00000000-0000-0000-0000-000000000001',
                name: 'Calibration Commercial Demo Lab',
                code: 'CAL-DEMO'
            },
            organization: {
                id: userCtx.organizationId || '00000000-0000-0000-0000-000000000001',
                name: 'Main Testing Division',
                code: 'ORG-MAIN'
            }
        };
        return sendSuccess(c, profile, 'User profile retrieved successfully');
    }

    static async getUsers(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const { data, total } = await IdentityService.getUsers(userCtx, pagination.limit, pagination.offset);
        return sendSuccess(c, data, 'Users retrieved successfully', buildPaginationMeta(pagination.page, pagination.limit, total));
    }

    static async getRoles(c: Context) {
        const userCtx = getUserContext(c);
        const roles = await IdentityService.getRoles(userCtx);
        return sendSuccess(c, roles, 'Roles retrieved successfully');
    }

    static async getPermissions(c: Context) {
        const perms = await IdentityService.getPermissions();
        return sendSuccess(c, perms, 'Permissions retrieved successfully');
    }
}
