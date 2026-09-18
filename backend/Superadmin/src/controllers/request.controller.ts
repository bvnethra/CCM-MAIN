import { Context } from 'hono';
import { RequestService } from '../services/request.service';
import { getUserContext } from '../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../utils/response';
import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';

export class RequestController {
    static async getRequests(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const status = c.req.query('status');
        const clientId = c.req.query('clientId');
        const { data, total } = await RequestService.getRequests(userCtx, pagination.limit, pagination.offset, status, clientId);
        return sendSuccess(c, data, 'Calibration requests retrieved successfully', buildPaginationMeta(pagination.page, pagination.limit, total));
    }

    static async getRequestById(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const req = await RequestService.getRequestById(userCtx, id);
        return sendSuccess(c, req);
    }

    static async createRequest(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const newReq = await RequestService.createRequest(userCtx, body);
        return sendCreated(c, newReq, 'Calibration request created successfully');
    }

    static async submitRequest(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const submitted = await RequestService.submitRequest(userCtx, id);
        return sendSuccess(c, submitted, 'Calibration request submitted successfully');
    }

    static async cancelRequest(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = await c.req.json().catch(() => ({}));
        const cancelled = await RequestService.cancelRequest(userCtx, id, body.reason);
        return sendSuccess(c, cancelled, 'Calibration request cancelled successfully');
    }

    static async updateRequest(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = c.get('validatedBody');
        const updated = await RequestService.updateRequest(userCtx, id, body);
        return sendSuccess(c, updated, 'Calibration request updated successfully');
    }
}
