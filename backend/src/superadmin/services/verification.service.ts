import { VerificationRepository } from '../repositories/verification.repository';
import { RequestRepository } from '../repositories/request.repository';
import { UserSecurityContext } from '../types/context';
import { createAuditLog } from '../db/audit';

export class VerificationService {
    static async getLabQueue(ctx: UserSecurityContext) {
        return VerificationRepository.getLabQueue(ctx.tenantId, ctx.organizationId);
    }

    static async getLabQueueItem(ctx: UserSecurityContext, requestItemId: string) {
        const item = await VerificationRepository.getLabQueueItem(ctx.tenantId, ctx.organizationId, requestItemId);
        if (!item) throw new Error('RESOURCE_NOT_FOUND: Lab queue item not found');
        return item;
    }

    static async verifyItem(ctx: UserSecurityContext, requestId: string, requestItemId: string, input: any) {
        const item = await this.getLabQueueItem(ctx, requestItemId);
        if (item.request_id !== requestId) {
            throw new Error('BUSINESS_RULE_FAILED: Item does not belong to specified request');
        }

        const ver = await VerificationRepository.createVerification(
            ctx.tenantId, ctx.organizationId, requestId, requestItemId, ctx.userId, input
        );

        // Update request status to VERIFICATION
        await RequestRepository.updateRequestStatus(ctx.tenantId, ctx.organizationId, requestId, 'VERIFICATION', ctx.userId);

        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'ITEM_VERIFIED',
            entityType: 'item_verifications',
            entityId: ver.id,
            newData: ver
        });

        return ver;
    }

    static async getVerification(ctx: UserSecurityContext, requestItemId: string) {
        const ver = await VerificationRepository.getVerificationByItemId(ctx.tenantId, ctx.organizationId, requestItemId);
        if (!ver) throw new Error('RESOURCE_NOT_FOUND: Verification record not found for item');
        return ver;
    }
}
