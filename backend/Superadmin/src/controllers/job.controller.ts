import { Context } from 'hono';
import { getUserContext } from '../middleware/auth.middleware';
import { JobService } from '../services/job.service';

export class JobController {
    static async getJobById(c: Context) {
        const securityCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const data = await JobService.getJobById(securityCtx, id);
        return c.json({
            success: true,
            data
        });
    }

    static async getJobs(c: Context) {
        const securityCtx = getUserContext(c);
        const query = c.req.query();
        const result = await JobService.getJobs(securityCtx, query);
        return c.json({
            success: true,
            data: result.items,
            pagination: result.pagination
        });
    }

    static async cancelJob(c: Context) {
        const securityCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const data = await JobService.cancelJob(securityCtx, c, id);
        return c.json({
            success: true,
            data
        });
    }

    static async retryJob(c: Context) {
        const securityCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const data = await JobService.retryJob(securityCtx, c, id);
        return c.json({
            success: true,
            data
        });
    }
}
