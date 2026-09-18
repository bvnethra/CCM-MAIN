import { MasterRepository } from '../repositories/master.repository';
import { UserSecurityContext } from '../types/context';
import { createAuditLog } from '../db/audit';

export class MasterService {
    // CLIENTS
    static async getClients(ctx: UserSecurityContext, limit: number, offset: number, search?: string) {
        return MasterRepository.getClients(ctx.tenantId, ctx.organizationId, limit, offset, search);
    }

    static async getClientById(ctx: UserSecurityContext, id: string) {
        const client = await MasterRepository.getClientById(ctx.tenantId, ctx.organizationId, id);
        if (!client) throw new Error('RESOURCE_NOT_FOUND: Client not found');
        return client;
    }

    static async createClient(ctx: UserSecurityContext, input: any) {
        const client = await MasterRepository.createClient({
            ...input,
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId
        });
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'CLIENT_CREATED',
            entityType: 'clients',
            entityId: client.id,
            newData: client
        });
        return client;
    }

    static async updateClient(ctx: UserSecurityContext, id: string, input: any) {
        const existing = await this.getClientById(ctx, id);
        const updated = await MasterRepository.updateClient(ctx.tenantId, ctx.organizationId, id, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'CLIENT_UPDATED',
            entityType: 'clients',
            entityId: id,
            oldData: existing,
            newData: updated
        });
        return updated;
    }

    // VENDORS
    static async getVendors(ctx: UserSecurityContext, limit: number, offset: number, search?: string) {
        return MasterRepository.getVendors(ctx.tenantId, ctx.organizationId, limit, offset, search);
    }

    static async getVendorById(ctx: UserSecurityContext, id: string) {
        const vendor = await MasterRepository.getVendorById(ctx.tenantId, ctx.organizationId, id);
        if (!vendor) throw new Error('RESOURCE_NOT_FOUND: Vendor not found');
        return vendor;
    }

    static async createVendor(ctx: UserSecurityContext, input: any) {
        const vendor = await MasterRepository.createVendor({
            ...input,
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId
        });
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'VENDOR_CREATED',
            entityType: 'vendors',
            entityId: vendor.id,
            newData: vendor
        });
        return vendor;
    }

    static async updateVendor(ctx: UserSecurityContext, id: string, input: any) {
        const existing = await this.getVendorById(ctx, id);
        const updated = await MasterRepository.updateVendor(ctx.tenantId, ctx.organizationId, id, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'VENDOR_UPDATED',
            entityType: 'vendors',
            entityId: id,
            oldData: existing,
            newData: updated
        });
        return updated;
    }

    // ITEM MASTERS
    static async getItems(ctx: UserSecurityContext, limit: number, offset: number, search?: string) {
        return MasterRepository.getItems(ctx.tenantId, ctx.organizationId, limit, offset, search);
    }

    static async getItemById(ctx: UserSecurityContext, id: string) {
        const item = await MasterRepository.getItemById(ctx.tenantId, ctx.organizationId, id);
        if (!item) throw new Error('RESOURCE_NOT_FOUND: Item Master not found');
        return item;
    }

    static async createItem(ctx: UserSecurityContext, input: any) {
        const item = await MasterRepository.createItem({
            ...input,
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId
        });
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'ITEM_MASTER_CREATED',
            entityType: 'item_masters',
            entityId: item.id,
            newData: item
        });
        return item;
    }

    static async updateItem(ctx: UserSecurityContext, id: string, input: any) {
        const existing = await this.getItemById(ctx, id);
        const updated = await MasterRepository.updateItem(ctx.tenantId, ctx.organizationId, id, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'ITEM_MASTER_UPDATED',
            entityType: 'item_masters',
            entityId: id,
            oldData: existing,
            newData: updated
        });
        return updated;
    }
}
