import { OutsourcingRepository } from '../repositories/outsourcing.repository';
import { UserSecurityContext } from '../types/context';
import { createAuditLog } from '../db/audit';

export class OutsourcingService {
    static async getOutsourcingList(ctx: UserSecurityContext, limit: number, offset: number) {
        return OutsourcingRepository.getOutsourcingList(ctx.tenantId, ctx.organizationId, limit, offset);
    }

    static async getOutsourcingById(ctx: UserSecurityContext, id: string) {
        const vo = await OutsourcingRepository.getOutsourcingById(ctx.tenantId, ctx.organizationId, id);
        if (!vo) throw new Error('RESOURCE_NOT_FOUND: Vendor outsourcing record not found');
        return vo;
    }

    static async createOutsourcing(ctx: UserSecurityContext, input: any) {
        const vo = await OutsourcingRepository.createOutsourcing(ctx.tenantId, ctx.organizationId, ctx.userId, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'VENDOR_OUTSOURCING_CREATED',
            entityType: 'vendor_outsourcing',
            entityId: vo.id,
            newData: vo
        });
        return vo;
    }

    static async returnOutsourcing(ctx: UserSecurityContext, id: string, input: any) {
        const vo = await this.getOutsourcingById(ctx, id);
        const updated = await OutsourcingRepository.returnOutsourcing(ctx.tenantId, ctx.organizationId, id, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'VENDOR_OUTSOURCING_RETURNED',
            entityType: 'vendor_outsourcing',
            entityId: id,
            oldData: vo,
            newData: updated
        });
        return updated;
    }
}
