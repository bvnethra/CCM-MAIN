import { RequestRepository } from '../repositories/request.repository';
import { MasterRepository } from '../repositories/master.repository';
import { UserSecurityContext } from '../types/context';
import { createAuditLog } from '../db/audit';

export class RequestService {
    static async getRequests(ctx: UserSecurityContext, limit: number, offset: number, status?: string, clientId?: string) {
        return RequestRepository.getRequests(ctx.tenantId, ctx.organizationId, limit, offset, status, clientId);
    }

    static async getRequestById(ctx: UserSecurityContext, id: string) {
        const req = await RequestRepository.getRequestById(ctx.tenantId, ctx.organizationId, id);
        if (!req) throw new Error('RESOURCE_NOT_FOUND: Calibration request not found');
        return req;
    }

    static async createRequest(ctx: UserSecurityContext, input: any) {
        // Multi-tenant security check: Ensure client belongs to authenticated user's tenant & organization
        const client = await MasterRepository.getClientById(ctx.tenantId, ctx.organizationId, input.clientId);
        if (!client) {
            throw new Error('RESOURCE_NOT_FOUND: Client not found in tenant/organization');
        }

        const newReq = await RequestRepository.createRequestWithItems(ctx.tenantId, ctx.organizationId, ctx.userId, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'REQUEST_CREATED',
            entityType: 'calibration_requests',
            entityId: newReq.id,
            newData: newReq
        });
        return this.getRequestById(ctx, newReq.id);
    }

    static async submitRequest(ctx: UserSecurityContext, id: string) {
        const req = await this.getRequestById(ctx, id);
        if (req.status !== 'CREATED') {
            throw new Error(`INVALID_STATE: Cannot submit request in status '${req.status}'`);
        }
        const updated = await RequestRepository.updateRequestStatus(ctx.tenantId, ctx.organizationId, id, 'COLLECTED', ctx.userId);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'REQUEST_SUBMITTED',
            entityType: 'calibration_requests',
            entityId: id,
            oldData: req,
            newData: updated
        });
        return updated;
    }

    static async cancelRequest(ctx: UserSecurityContext, id: string, reason?: string) {
        const req = await this.getRequestById(ctx, id);
        if (req.status === 'COMPLETED' || req.status === 'CANCELLED') {
            throw new Error(`INVALID_STATE: Cannot cancel request in status '${req.status}'`);
        }
        const updated = await RequestRepository.updateRequestStatus(ctx.tenantId, ctx.organizationId, id, 'CANCELLED', ctx.userId);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'REQUEST_CANCELLED',
            entityType: 'calibration_requests',
            entityId: id,
            oldData: req,
            newData: { ...updated, cancel_reason: reason }
        });
        return updated;
    }

    static async updateRequest(ctx: UserSecurityContext, id: string, input: any) {
        const req = await this.getRequestById(ctx, id);
        if (req.status !== 'CREATED') {
            throw new Error(`INVALID_STATE: Cannot edit request in status '${req.status}'`);
        }
        const updated = await RequestRepository.updateRequest(ctx.tenantId, ctx.organizationId, id, input, ctx.userId);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'REQUEST_UPDATED',
            entityType: 'calibration_requests',
            entityId: id,
            oldData: req,
            newData: updated
        });
        return this.getRequestById(ctx, id);
    }
}
