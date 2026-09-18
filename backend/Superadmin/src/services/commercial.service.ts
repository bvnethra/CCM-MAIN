import { CommercialRepository } from '../repositories/commercial.repository';
import { UserSecurityContext } from '../types/context';
import { createAuditLog } from '../db/audit';

export class CommercialService {
    // QUOTATIONS
    static async getQuotations(ctx: UserSecurityContext, limit: number, offset: number) {
        return CommercialRepository.getQuotations(ctx.tenantId, ctx.organizationId, limit, offset);
    }

    static async getQuotationById(ctx: UserSecurityContext, id: string) {
        const quot = await CommercialRepository.getQuotationById(ctx.tenantId, ctx.organizationId, id);
        if (!quot) throw new Error('RESOURCE_NOT_FOUND: Quotation not found');
        return quot;
    }

    static async createQuotation(ctx: UserSecurityContext, input: any) {
        const quot = await CommercialRepository.createQuotation(ctx.tenantId, ctx.organizationId, ctx.userId, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'QUOTATION_CREATED',
            entityType: 'quotations',
            entityId: quot.id,
            newData: quot
        });
        return this.getQuotationById(ctx, quot.id);
    }

    static async submitQuotation(ctx: UserSecurityContext, id: string) {
        const quot = await this.getQuotationById(ctx, id);
        if (quot.quotation_status !== 'DRAFT') {
            throw new Error(`INVALID_STATE: Cannot submit quotation in status '${quot.quotation_status}'`);
        }
        const updated = await CommercialRepository.updateQuotationStatus(ctx.tenantId, ctx.organizationId, id, 'SUBMITTED', ctx.userId);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'QUOTATION_SUBMITTED',
            entityType: 'quotations',
            entityId: id,
            oldData: quot,
            newData: updated
        });
        return updated;
    }

    static async approveQuotation(ctx: UserSecurityContext, id: string, input: any) {
        const quot = await this.getQuotationById(ctx, id);
        if (quot.quotation_status === 'APPROVED' || quot.quotation_status === 'REJECTED') {
            throw new Error(`INVALID_STATE: Quotation is already '${quot.quotation_status}'`);
        }
        const approval = await CommercialRepository.addApproval(
            ctx.tenantId, ctx.organizationId, id, ctx.userId, input.approvalAction, input.rejectionReason, input.remarks
        );
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: input.approvalAction === 'APPROVED' ? 'QUOTATION_APPROVED' : 'QUOTATION_REJECTED',
            entityType: 'quotation_approvals',
            entityId: approval.id,
            newData: approval
        });
        return this.getQuotationById(ctx, id);
    }

    // INVOICES
    static async getInvoices(ctx: UserSecurityContext, limit: number, offset: number) {
        return CommercialRepository.getInvoices(ctx.tenantId, ctx.organizationId, limit, offset);
    }

    static async getInvoiceById(ctx: UserSecurityContext, id: string) {
        const inv = await CommercialRepository.getInvoiceById(ctx.tenantId, ctx.organizationId, id);
        if (!inv) throw new Error('RESOURCE_NOT_FOUND: Invoice not found');
        return inv;
    }

    static async createInvoice(ctx: UserSecurityContext, input: any) {
        const inv = await CommercialRepository.createInvoice(ctx.tenantId, ctx.organizationId, ctx.userId, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'INVOICE_CREATED',
            entityType: 'invoices',
            entityId: inv.id,
            newData: inv
        });
        return this.getInvoiceById(ctx, inv.id);
    }

    static async issueInvoice(ctx: UserSecurityContext, id: string) {
        const inv = await this.getInvoiceById(ctx, id);
        if (inv.invoice_status !== 'DRAFT') {
            throw new Error(`INVALID_STATE: Cannot issue invoice in status '${inv.invoice_status}'`);
        }
        const updated = await CommercialRepository.updateInvoiceStatus(ctx.tenantId, ctx.organizationId, id, 'ISSUED', ctx.userId);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'INVOICE_ISSUED',
            entityType: 'invoices',
            entityId: id,
            oldData: inv,
            newData: updated
        });
        return updated;
    }

    // PURCHASE ORDERS
    static async getPurchaseOrders(ctx: UserSecurityContext, limit: number, offset: number) {
        return CommercialRepository.getPurchaseOrders(ctx.tenantId, ctx.organizationId, limit, offset);
    }

    static async getPurchaseOrderById(ctx: UserSecurityContext, id: string) {
        const po = await CommercialRepository.getPurchaseOrderById(ctx.tenantId, ctx.organizationId, id);
        if (!po) throw new Error('RESOURCE_NOT_FOUND: Purchase Order not found');
        return po;
    }

    static async createPurchaseOrder(ctx: UserSecurityContext, input: any) {
        const po = await CommercialRepository.createPurchaseOrder(ctx.tenantId, ctx.organizationId, ctx.userId, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'PO_CREATED',
            entityType: 'purchase_orders',
            entityId: po.id,
            newData: po
        });
        return this.getPurchaseOrderById(ctx, po.id);
    }

    static async issuePurchaseOrder(ctx: UserSecurityContext, id: string) {
        const po = await this.getPurchaseOrderById(ctx, id);
        if (po.po_status !== 'DRAFT') {
            throw new Error(`INVALID_STATE: Cannot issue PO in status '${po.po_status}'`);
        }
        const updated = await CommercialRepository.updatePOStatus(ctx.tenantId, ctx.organizationId, id, 'ISSUED', ctx.userId);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'PO_ISSUED',
            entityType: 'purchase_orders',
            entityId: id,
            oldData: po,
            newData: updated
        });
        return updated;
    }
}
