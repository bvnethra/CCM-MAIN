import { Hono } from 'hono';
import { IdentityController } from '../controllers/identity.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const identityWorker = new Hono();

identityWorker.use('*', authMiddleware, tenantMiddleware);

identityWorker.get('/auth/me', IdentityController.getMe);
identityWorker.get('/users', requirePermission('USER_VIEW'), IdentityController.getUsers);
identityWorker.get('/roles', requirePermission('USER_VIEW'), IdentityController.getRoles);
identityWorker.get('/permissions', requirePermission('USER_VIEW'), IdentityController.getPermissions);

export { identityWorker };
