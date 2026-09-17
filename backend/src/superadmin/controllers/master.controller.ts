import { Context } from 'hono';
import { MasterService } from '../services/master.service';
import { getUserContext } from '../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../utils/response';
import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';

export class MasterController {
    // CLIENTS
    static async getClients(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const search = c.req.query('search');
        const { data, total } = await MasterService.getClients(userCtx, pagination.limit, pagination.offset, search);
        return sendSuccess(c, data, 'Clients retrieved successfully', buildPaginationMeta(pagination.page, pagination.limit, total));
    }

    static async getClientById(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const client = await MasterService.getClientById(userCtx, id);
        return sendSuccess(c, client);
    }

    static async createClient(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const client = await MasterService.createClient(userCtx, body);
        return sendCreated(c, client, 'Client created successfully');
    }

    static async updateClient(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = c.get('validatedBody');
        const updated = await MasterService.updateClient(userCtx, id, body);
        return sendSuccess(c, updated, 'Client updated successfully');
    }

    // VENDORS
    static async getVendors(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const search = c.req.query('search');
        const { data, total } = await MasterService.getVendors(userCtx, pagination.limit, pagination.offset, search);
        return sendSuccess(c, data, 'Vendors retrieved successfully', buildPaginationMeta(pagination.page, pagination.limit, total));
    }

    static async getVendorById(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const vendor = await MasterService.getVendorById(userCtx, id);
        return sendSuccess(c, vendor);
    }

    static async createVendor(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const vendor = await MasterService.createVendor(userCtx, body);
        return sendCreated(c, vendor, 'Vendor created successfully');
    }

    static async updateVendor(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = c.get('validatedBody');
        const updated = await MasterService.updateVendor(userCtx, id, body);
        return sendSuccess(c, updated, 'Vendor updated successfully');
    }

    // ITEMS
    static async getItems(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const search = c.req.query('search');
        const { data, total } = await MasterService.getItems(userCtx, pagination.limit, pagination.offset, search);
        return sendSuccess(c, data, 'Item masters retrieved successfully', buildPaginationMeta(pagination.page, pagination.limit, total));
    }

    static async getItemById(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const item = await MasterService.getItemById(userCtx, id);
        return sendSuccess(c, item);
    }

    static async createItem(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const item = await MasterService.createItem(userCtx, body);
        return sendCreated(c, item, 'Item master created successfully');
    }

    static async updateItem(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = c.get('validatedBody');
        const updated = await MasterService.updateItem(userCtx, id, body);
        return sendSuccess(c, updated, 'Item master updated successfully');
    }
}
