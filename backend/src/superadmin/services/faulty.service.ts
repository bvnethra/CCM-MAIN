import { FaultyRepository } from '../repositories/faulty.repository';
import { UserSecurityContext } from '../types/context';
import { createAuditLog } from '../db/audit';

export class FaultyService {
    static async getFaultyServices(ctx: UserSecurityContext, limit: number, offset: number) {
        return FaultyRepository.getFaultyServices(ctx.tenantId, ctx.organizationId, limit, offset);
    }

    static async getFaultyServiceById(ctx: UserSecurityContext, id: string) {
        const fs = await FaultyRepository.getFaultyServiceById(ctx.tenantId, ctx.organizationId, id);
        if (!fs) throw new Error('RESOURCE_NOT_FOUND: Faulty item service record not found');
        return fs;
    }

    static async createFaultyService(ctx: UserSecurityContext, input: any) {
        const fs = await FaultyRepository.createFaultyService(ctx.tenantId, ctx.organizationId, ctx.userId, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'FAULTY_SERVICE_CREATED',
            entityType: 'faulty_item_services',
            entityId: fs.id,
            newData: fs
        });
        return fs;
    }

    static async completeFaultyService(ctx: UserSecurityContext, id: string, input: any) {
        const fs = await this.getFaultyServiceById(ctx, id);
        const updated = await FaultyRepository.completeFaultyService(ctx.tenantId, ctx.organizationId, id, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'FAULTY_SERVICE_COMPLETED',
            entityType: 'faulty_item_services',
            entityId: id,
            oldData: fs,
            newData: updated
        });
        return updated;
    }
}
