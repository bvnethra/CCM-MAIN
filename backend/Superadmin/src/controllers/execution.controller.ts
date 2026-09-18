import { Context } from 'hono';
import { ExecutionService } from '../services/execution.service';
import { getUserContext } from '../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../utils/response';
import { parsePaginationParams } from '../utils/pagination';

export class ExecutionController {
    // SIGNATURES
    static async getSignaturesByRequestId(c: Context) {
        const userCtx = getUserContext(c);
        const requestId = c.req.param('requestId') as string;
        const sigs = await ExecutionService.getSignaturesByRequestId(userCtx, requestId);
        return sendSuccess(c, sigs, 'Signatures retrieved successfully');
    }

    static async createSignature(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const sig = await ExecutionService.createSignature(userCtx, body);
        return sendCreated(c, sig, 'Digital signature recorded successfully');
    }

    static async updateSignatureStatus(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = c.get('validatedBody');
        const updated = await ExecutionService.updateSignatureStatus(userCtx, id, body.signatureStatus, body.remarks);
        return sendSuccess(c, updated, 'Signature status updated successfully');
    }

    // DISPATCHES
    static async getDispatches(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const dsps = await ExecutionService.getDispatches(userCtx, pagination.limit, pagination.offset);
        return sendSuccess(c, dsps, 'Dispatch notes retrieved successfully');
    }

    static async getDispatchById(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const dsp = await ExecutionService.getDispatchById(userCtx, id);
        return sendSuccess(c, dsp);
    }

    static async createDispatch(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const dsp = await ExecutionService.createDispatch(userCtx, body);
        return sendCreated(c, dsp, 'Dispatch note created successfully');
    }

    static async executeDispatch(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const updated = await ExecutionService.executeDispatch(userCtx, id);
        return sendSuccess(c, updated, 'Items dispatched successfully');
    }

    // DELIVERIES
    static async getDeliveries(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const dels = await ExecutionService.getDeliveries(userCtx, pagination.limit, pagination.offset);
        return sendSuccess(c, dels, 'Deliveries retrieved successfully');
    }

    static async getDeliveryById(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const del = await ExecutionService.getDeliveryById(userCtx, id);
        return sendSuccess(c, del);
    }

    static async createDelivery(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const del = await ExecutionService.createDelivery(userCtx, body);
        return sendCreated(c, del, 'Delivery record created successfully');
    }

    static async receiveDelivery(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = c.get('validatedBody');
        const updated = await ExecutionService.receiveDelivery(userCtx, id, body);
        return sendSuccess(c, updated, 'Delivery marked as received by client');
    }

    static async signDelivery(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = c.get('validatedBody');
        const updated = await ExecutionService.signDelivery(userCtx, id, body);
        return sendSuccess(c, updated, 'Delivery acknowledgement signed successfully');
    }

    // FINAL REQUEST COMPLETION
    static async completeRequest(c: Context) {
        const userCtx = getUserContext(c);
        const requestId = c.req.param('id') as string;
        const completed = await ExecutionService.completeRequest(userCtx, requestId);
        return sendSuccess(c, completed, 'Calibration request verified and driven to COMPLETED status');
    }
}
