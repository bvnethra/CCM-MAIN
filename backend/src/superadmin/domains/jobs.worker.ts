import { Hono } from 'hono';
import { JobController } from '../controllers/job.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateParams } from '../middleware/zod.middleware';
import { uuidParamSchema } from '../schemas/common.schema';

const jobsWorker = new Hono();

jobsWorker.get('/', authMiddleware, tenantMiddleware, requirePermission('ASYNC_JOB_VIEW'), JobController.getJobs);
jobsWorker.get('/:id', authMiddleware, tenantMiddleware, requirePermission('ASYNC_JOB_VIEW'), validateParams(uuidParamSchema), JobController.getJobById);
jobsWorker.post('/:id/cancel', authMiddleware, tenantMiddleware, requirePermission('ASYNC_JOB_CANCEL'), validateParams(uuidParamSchema), JobController.cancelJob);
jobsWorker.post('/:id/retry', authMiddleware, tenantMiddleware, requirePermission('ASYNC_JOB_RETRY'), validateParams(uuidParamSchema), JobController.retryJob);

export { jobsWorker };
