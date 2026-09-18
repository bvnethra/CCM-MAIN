import { Context } from 'hono';
import { VerificationService } from '../services/verification.service';
import { getUserContext } from '../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../utils/response';

export class VerificationController {
    static async getLabQueue(c: Context) {
        const userCtx = getUserContext(c);
        const queue = await VerificationService.getLabQueue(userCtx);
        return sendSuccess(c, queue, 'Lab queue retrieved successfully');
    }

    static async getLabQueueItem(c: Context) {
        const userCtx = getUserContext(c);
        const itemId = c.req.param('requestItemId') as string;
        const item = await VerificationService.getLabQueueItem(userCtx, itemId);
        return sendSuccess(c, item);
    }

    static async verifyItem(c: Context) {
        const userCtx = getUserContext(c);
        const requestId = c.req.param('id') as string;
        const itemId = c.req.param('itemId') as string;
        const body = c.get('validatedBody');
        const ver = await VerificationService.verifyItem(userCtx, requestId, itemId, body);
        return sendCreated(c, ver, 'Item verification recorded successfully');
    }

    static async getVerification(c: Context) {
        const userCtx = getUserContext(c);
        const itemId = c.req.param('itemId') as string;
        const ver = await VerificationService.getVerification(userCtx, itemId);
        return sendSuccess(c, ver);
    }
}
