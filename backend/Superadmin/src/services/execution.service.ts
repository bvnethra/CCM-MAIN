import { ExecutionRepository } from '../repositories/execution.repository';
import { RequestRepository } from '../repositories/request.repository';
import { UserSecurityContext } from '../types/context';
import { createAuditLog } from '../db/audit';

export class ExecutionService {
    // SIGNATURES
    static async getSignaturesByRequestId(ctx: UserSecurityContext, requestId: string) {
        return ExecutionRepository.getSignaturesByRequestId(ctx.tenantId, ctx.organizationId, requestId);
    }

    static async createSignature(ctx: UserSecurityContext, input: any) {
        const sig = await ExecutionRepository.createSignature(ctx.tenantId, ctx.organizationId, ctx.userId, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: input.signatureType === 'CLIENT_INVOICE' ? 'CLIENT_SIGNATURE_SIGNED' : 'DELIVERY_SIGNATURE_SIGNED',
            entityType: 'signatures',
            entityId: sig.id,
            newData: sig
        });
        return sig;
    }

    static async updateSignatureStatus(ctx: UserSecurityContext, id: string, status: string, remarks?: string) {
        const sig = await ExecutionRepository.getSignatureById(ctx.tenantId, ctx.organizationId, id);
        if (!sig) throw new Error('RESOURCE_NOT_FOUND: Signature record not found');

        const updated = await ExecutionRepository.updateSignatureStatus(ctx.tenantId, ctx.organizationId, id, status, remarks);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'SIGNATURE_STATUS_UPDATED',
            entityType: 'signatures',
            entityId: id,
            oldData: sig,
            newData: updated
        });
        return updated;
    }

    // DISPATCHES
    static async getDispatches(ctx: UserSecurityContext, limit: number, offset: number) {
        return ExecutionRepository.getDispatches(ctx.tenantId, ctx.organizationId, limit, offset);
    }

    static async getDispatchById(ctx: UserSecurityContext, id: string) {
        const dsp = await ExecutionRepository.getDispatchById(ctx.tenantId, ctx.organizationId, id);
        if (!dsp) throw new Error('RESOURCE_NOT_FOUND: Dispatch note not found');
        return dsp;
    }

    static async createDispatch(ctx: UserSecurityContext, input: any) {
        // Validate client invoice signature exists before dispatch note creation
        const sigs = await ExecutionRepository.getSignaturesByRequestId(ctx.tenantId, ctx.organizationId, input.requestId);
        const invSig = sigs.find(s => s.signature_type === 'CLIENT_INVOICE' && s.signature_status === 'SIGNED');
        if (!invSig) {
            throw new Error('BUSINESS_RULE_FAILED: Cannot create dispatch note without a SIGNED client invoice signature');
        }

        const dsp = await ExecutionRepository.createDispatch(ctx.tenantId, ctx.organizationId, ctx.userId, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'DISPATCH_CREATED',
            entityType: 'dispatches',
            entityId: dsp.id,
            newData: dsp
        });
        return this.getDispatchById(ctx, dsp.id);
    }

    static async executeDispatch(ctx: UserSecurityContext, id: string) {
        const dsp = await this.getDispatchById(ctx, id);
        if (dsp.dispatch_status !== 'DRAFT' && dsp.dispatch_status !== 'READY') {
            throw new Error(`INVALID_STATE: Cannot dispatch from status '${dsp.dispatch_status}'`);
        }
        const updated = await ExecutionRepository.updateDispatchStatus(ctx.tenantId, ctx.organizationId, id, 'DISPATCHED', ctx.userId);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'DISPATCHED',
            entityType: 'dispatches',
            entityId: id,
            oldData: dsp,
            newData: updated
        });
        return updated;
    }

    // DELIVERIES
    static async getDeliveries(ctx: UserSecurityContext, limit: number, offset: number) {
        return ExecutionRepository.getDeliveries(ctx.tenantId, ctx.organizationId, limit, offset);
    }

    static async getDeliveryById(ctx: UserSecurityContext, id: string) {
        const del = await ExecutionRepository.getDeliveryById(ctx.tenantId, ctx.organizationId, id);
        if (!del) throw new Error('RESOURCE_NOT_FOUND: Delivery record not found');
        return del;
    }

    static async createDelivery(ctx: UserSecurityContext, input: any) {
        const del = await ExecutionRepository.createDelivery(ctx.tenantId, ctx.organizationId, ctx.userId, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'DELIVERY_CREATED',
            entityType: 'deliveries',
            entityId: del.id,
            newData: del
        });
        return del;
    }

    static async receiveDelivery(ctx: UserSecurityContext, id: string, input: any) {
        const del = await this.getDeliveryById(ctx, id);
        const updated = await ExecutionRepository.updateDeliveryStatus(
            ctx.tenantId, ctx.organizationId, id, 'CLIENT_RECEIVED', ctx.userId, input
        );
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'CLIENT_RECEIVED',
            entityType: 'deliveries',
            entityId: id,
            oldData: del,
            newData: updated
        });
        return updated;
    }

    static async signDelivery(ctx: UserSecurityContext, id: string, input: any) {
        const del = await this.getDeliveryById(ctx, id);
        
        // Create delivery signature entry
        await ExecutionRepository.createSignature(ctx.tenantId, ctx.organizationId, ctx.userId, {
            requestId: del.request_id,
            signatureType: 'CLIENT_DELIVERY',
            signedByName: input.signedByName,
            signatureReference: input.signatureReference,
            remarks: input.remarks
        });

        const updated = await ExecutionRepository.updateDeliveryStatus(
            ctx.tenantId, ctx.organizationId, id, 'DELIVERY_SIGNED', ctx.userId
        );

        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'DELIVERY_SIGNATURE_SIGNED',
            entityType: 'deliveries',
            entityId: id,
            oldData: del,
            newData: updated
        });

        return updated;
    }

    // FINAL REQUEST COMPLETION
    static async completeRequest(ctx: UserSecurityContext, requestId: string) {
        const req = await RequestRepository.getRequestById(ctx.tenantId, ctx.organizationId, requestId);
        if (!req) throw new Error('RESOURCE_NOT_FOUND: Calibration request not found');

        const updatedReq = await ExecutionRepository.completeCalibrationRequest(
            ctx.tenantId, ctx.organizationId, requestId, ctx.userId
        );

        if (updatedReq.status !== 'COMPLETED') {
            throw new Error('BUSINESS_RULE_FAILED: Completion failed prerequisite checks. Ensure all 8 workflow completion rules are satisfied.');
        }

        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'REQUEST_COMPLETED',
            entityType: 'calibration_requests',
            entityId: requestId,
            oldData: req,
            newData: updatedReq
        });

        return updatedReq;
    }
}
