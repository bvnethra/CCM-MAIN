import { Context, Next } from 'hono';
import { getUserContext } from './auth.middleware';
import { sendError } from '../utils/response';

export async function tenantMiddleware(c: Context, next: Next) {
    const userCtx = getUserContext(c);

    // Validate tenant_id in query or body if explicitly sent
    const reqTenantId = c.req.query('tenant_id') || c.req.header('x-tenant-id');
    if (reqTenantId && reqTenantId !== userCtx.tenantId) {
        return sendError(c, 'TENANT_ACCESS_DENIED', 'Access denied for specified tenant', 403);
    }

    const reqOrgId = c.req.query('organization_id') || c.req.header('x-organization-id');
    if (reqOrgId && reqOrgId !== userCtx.organizationId) {
        return sendError(c, 'ORGANIZATION_ACCESS_DENIED', 'Access denied for specified organization', 403);
    }

    await next();
}
