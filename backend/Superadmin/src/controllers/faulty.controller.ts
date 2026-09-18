import { Context } from 'hono';
import { FaultyService } from '../services/faulty.service';
import { getUserContext } from '../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../utils/response';
import { parsePaginationParams } from '../utils/pagination';

export class FaultyController {
    static async getFaultyServices(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const services = await FaultyService.getFaultyServices(userCtx, pagination.limit, pagination.offset);
        return sendSuccess(c, services, 'Faulty item services retrieved successfully');
    }

    static async getFaultyServiceById(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const fs = await FaultyService.getFaultyServiceById(userCtx, id);
        return sendSuccess(c, fs);
    }

    static async createFaultyService(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const fs = await FaultyService.createFaultyService(userCtx, body);
        return sendCreated(c, fs, 'Faulty item service initiated successfully');
    }

    static async completeFaultyService(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = c.get('validatedBody');
        const updated = await FaultyService.completeFaultyService(userCtx, id, body);
        return sendSuccess(c, updated, 'Faulty item service status updated successfully');
    }
}
