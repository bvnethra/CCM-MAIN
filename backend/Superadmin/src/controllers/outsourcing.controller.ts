import { Context } from 'hono';
import { OutsourcingService } from '../services/outsourcing.service';
import { getUserContext } from '../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../utils/response';
import { parsePaginationParams } from '../utils/pagination';

export class OutsourcingController {
    static async getOutsourcingList(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const list = await OutsourcingService.getOutsourcingList(userCtx, pagination.limit, pagination.offset);
        return sendSuccess(c, list, 'Vendor outsourcing records retrieved successfully');
    }

    static async getOutsourcingById(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const vo = await OutsourcingService.getOutsourcingById(userCtx, id);
        return sendSuccess(c, vo);
    }

    static async createOutsourcing(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const vo = await OutsourcingService.createOutsourcing(userCtx, body);
        return sendCreated(c, vo, 'Vendor outsourcing initiated successfully');
    }

    static async returnOutsourcing(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = c.get('validatedBody');
        const updated = await OutsourcingService.returnOutsourcing(userCtx, id, body);
        return sendSuccess(c, updated, 'Vendor outsourcing return recorded successfully');
    }
}
