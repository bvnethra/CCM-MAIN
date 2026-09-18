import { Context } from 'hono';
import { CommercialService } from '../services/commercial.service';
import { getUserContext } from '../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../utils/response';
import { parsePaginationParams } from '../utils/pagination';

export class CommercialController {
    // QUOTATIONS
    static async getQuotations(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const quots = await CommercialService.getQuotations(userCtx, pagination.limit, pagination.offset);
        return sendSuccess(c, quots, 'Quotations retrieved successfully');
    }

    static async getQuotationById(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const quot = await CommercialService.getQuotationById(userCtx, id);
        return sendSuccess(c, quot);
    }

    static async createQuotation(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const quot = await CommercialService.createQuotation(userCtx, body);
        return sendCreated(c, quot, 'Quotation draft created successfully');
    }

    static async submitQuotation(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const updated = await CommercialService.submitQuotation(userCtx, id);
        return sendSuccess(c, updated, 'Quotation submitted for approval successfully');
    }

    static async approveQuotation(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = c.get('validatedBody');
        const updated = await CommercialService.approveQuotation(userCtx, id, body);
        return sendSuccess(c, updated, 'Quotation approval decision processed successfully');
    }

    // INVOICES
    static async getInvoices(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const invs = await CommercialService.getInvoices(userCtx, pagination.limit, pagination.offset);
        return sendSuccess(c, invs, 'Invoices retrieved successfully');
    }

    static async getInvoiceById(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const inv = await CommercialService.getInvoiceById(userCtx, id);
        return sendSuccess(c, inv);
    }

    static async createInvoice(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const inv = await CommercialService.createInvoice(userCtx, body);
        return sendCreated(c, inv, 'Invoice draft created successfully');
    }

    static async issueInvoice(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const updated = await CommercialService.issueInvoice(userCtx, id);
        return sendSuccess(c, updated, 'Invoice issued successfully');
    }

    // PURCHASE ORDERS
    static async getPurchaseOrders(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const pos = await CommercialService.getPurchaseOrders(userCtx, pagination.limit, pagination.offset);
        return sendSuccess(c, pos, 'Purchase orders retrieved successfully');
    }

    static async getPurchaseOrderById(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const po = await CommercialService.getPurchaseOrderById(userCtx, id);
        return sendSuccess(c, po);
    }

    static async createPurchaseOrder(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const po = await CommercialService.createPurchaseOrder(userCtx, body);
        return sendCreated(c, po, 'Purchase Order draft created successfully');
    }

    static async issuePurchaseOrder(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const updated = await CommercialService.issuePurchaseOrder(userCtx, id);
        return sendSuccess(c, updated, 'Purchase Order issued successfully');
    }
}
