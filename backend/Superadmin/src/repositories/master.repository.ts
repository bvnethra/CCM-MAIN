import { query, queryOne } from '../db/client';

export class MasterRepository {
    // CLIENTS
    static async getClients(tenantId: string, orgId: string, limit: number, offset: number, search?: string) {
        let sql = `SELECT *, client_name as name, client_code as code, gst_tax_number as gstin FROM clients WHERE tenant_id = $1 AND organization_id = $2`;
        const params: any[] = [tenantId, orgId];

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (client_name ILIKE $3 OR client_code ILIKE $3 OR email ILIKE $3)`;
        }

        sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const rows = await query(sql, params);
        const countRow = await queryOne<{ count: string }>(
            `SELECT count(*) FROM clients WHERE tenant_id = $1 AND organization_id = $2`,
            [tenantId, orgId]
        );
        return { data: rows, total: parseInt(countRow?.count || '0', 10) };
    }

    static async getClientById(tenantId: string, orgId: string, id: string) {
        return queryOne(`SELECT *, client_name as name, client_code as code, gst_tax_number as gstin FROM clients WHERE tenant_id = $1 AND organization_id = $2 AND id = $3`, [tenantId, orgId, id]);
    }

    static async createClient(data: any) {
        return queryOne(
            `INSERT INTO clients (tenant_id, organization_id, client_name, client_code, contact_person, email, phone, address, gst_tax_number, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *, client_name as name, client_code as code, gst_tax_number as gstin`,
            [data.tenantId, data.organizationId, data.name, data.code, data.contactPerson, data.email, data.phone, data.address, data.gstin, data.status || 'ACTIVE']
        );
    }

    static async updateClient(tenantId: string, orgId: string, id: string, data: any) {
        const fields: string[] = [];
        const params: any[] = [tenantId, orgId, id];

        if (data.name !== undefined) { params.push(data.name); fields.push(`client_name = $${params.length}`); }
        if (data.contactPerson !== undefined) { params.push(data.contactPerson); fields.push(`contact_person = $${params.length}`); }
        if (data.email !== undefined) { params.push(data.email); fields.push(`email = $${params.length}`); }
        if (data.phone !== undefined) { params.push(data.phone); fields.push(`phone = $${params.length}`); }
        if (data.address !== undefined) { params.push(data.address); fields.push(`address = $${params.length}`); }
        if (data.gstin !== undefined) { params.push(data.gstin); fields.push(`gst_tax_number = $${params.length}`); }
        if (data.status !== undefined) { params.push(data.status); fields.push(`status = $${params.length}`); }

        if (fields.length === 0) return this.getClientById(tenantId, orgId, id);

        return queryOne(
            `UPDATE clients SET ${fields.join(', ')}, updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *, client_name as name, client_code as code, gst_tax_number as gstin`,
            params
        );
    }

    // VENDORS
    static async getVendors(tenantId: string, orgId: string, limit: number, offset: number, search?: string) {
        let sql = `SELECT *, vendor_name as name, vendor_code as code, gst_tax_number as gstin FROM vendors WHERE tenant_id = $1 AND organization_id = $2`;
        const params: any[] = [tenantId, orgId];

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (vendor_name ILIKE $3 OR vendor_code ILIKE $3)`;
        }

        sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const rows = await query(sql, params);
        const countRow = await queryOne<{ count: string }>(
            `SELECT count(*) FROM vendors WHERE tenant_id = $1 AND organization_id = $2`,
            [tenantId, orgId]
        );
        return { data: rows, total: parseInt(countRow?.count || '0', 10) };
    }

    static async getVendorById(tenantId: string, orgId: string, id: string) {
        return queryOne(`SELECT *, vendor_name as name, vendor_code as code, gst_tax_number as gstin FROM vendors WHERE tenant_id = $1 AND organization_id = $2 AND id = $3`, [tenantId, orgId, id]);
    }

    static async createVendor(data: any) {
        return queryOne(
            `INSERT INTO vendors (tenant_id, organization_id, vendor_name, vendor_code, contact_person, email, phone, address, gst_tax_number, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *, vendor_name as name, vendor_code as code, gst_tax_number as gstin`,
            [data.tenantId, data.organizationId, data.name, data.code, data.contactPerson, data.email, data.phone, data.address, data.gstin, data.status || 'ACTIVE']
        );
    }

    static async updateVendor(tenantId: string, orgId: string, id: string, data: any) {
        const fields: string[] = [];
        const params: any[] = [tenantId, orgId, id];

        if (data.name !== undefined) { params.push(data.name); fields.push(`vendor_name = $${params.length}`); }
        if (data.contactPerson !== undefined) { params.push(data.contactPerson); fields.push(`contact_person = $${params.length}`); }
        if (data.email !== undefined) { params.push(data.email); fields.push(`email = $${params.length}`); }
        if (data.phone !== undefined) { params.push(data.phone); fields.push(`phone = $${params.length}`); }
        if (data.address !== undefined) { params.push(data.address); fields.push(`address = $${params.length}`); }
        if (data.status !== undefined) { params.push(data.status); fields.push(`status = $${params.length}`); }

        if (fields.length === 0) return this.getVendorById(tenantId, orgId, id);

        return queryOne(
            `UPDATE vendors SET ${fields.join(', ')}, updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *, vendor_name as name, vendor_code as code, gst_tax_number as gstin`,
            params
        );
    }

    // ITEM MASTERS
    static async getItems(tenantId: string, orgId: string, limit: number, offset: number, search?: string) {
        let sql = `SELECT *, item_name as name, item_code as code, item_type as category, manufacturer as make, measurement_range as range_capacity, least_count as accuracy, calibration_frequency as calibration_frequency_days FROM item_masters WHERE tenant_id = $1 AND organization_id = $2`;
        const params: any[] = [tenantId, orgId];

        if (search) {
            params.push(`%${search}%`);
            sql += ` AND (item_name ILIKE $3 OR item_code ILIKE $3 OR item_type ILIKE $3)`;
        }

        sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const rows = await query(sql, params);
        const countRow = await queryOne<{ count: string }>(
            `SELECT count(*) FROM item_masters WHERE tenant_id = $1 AND organization_id = $2`,
            [tenantId, orgId]
        );
        return { data: rows, total: parseInt(countRow?.count || '0', 10) };
    }

    static async getItemById(tenantId: string, orgId: string, id: string) {
        return queryOne(`SELECT *, item_name as name, item_code as code, item_type as category, manufacturer as make, measurement_range as range_capacity, least_count as accuracy, calibration_frequency as calibration_frequency_days FROM item_masters WHERE tenant_id = $1 AND organization_id = $2 AND id = $3`, [tenantId, orgId, id]);
    }

    static async createItem(data: any) {
        return queryOne(
            `INSERT INTO item_masters (
                tenant_id, organization_id, item_name, item_code, item_type, manufacturer, model, serial_number, measurement_range, least_count, calibration_frequency, status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *, item_name as name, item_code as code, item_type as category, manufacturer as make, measurement_range as range_capacity, least_count as accuracy, calibration_frequency as calibration_frequency_days`,
            [
                data.tenantId, data.organizationId, data.name, data.code, data.category,
                data.make, data.model, data.serialNumber, data.rangeCapacity, data.accuracy,
                data.calibrationFrequencyDays || 365, data.status || 'ACTIVE'
            ]
        );
    }

    static async updateItem(tenantId: string, orgId: string, id: string, data: any) {
        const fields: string[] = [];
        const params: any[] = [tenantId, orgId, id];

        if (data.name !== undefined) { params.push(data.name); fields.push(`item_name = $${params.length}`); }
        if (data.category !== undefined) { params.push(data.category); fields.push(`item_type = $${params.length}`); }
        if (data.make !== undefined) { params.push(data.make); fields.push(`manufacturer = $${params.length}`); }
        if (data.model !== undefined) { params.push(data.model); fields.push(`model = $${params.length}`); }
        if (data.rangeCapacity !== undefined) { params.push(data.rangeCapacity); fields.push(`measurement_range = $${params.length}`); }
        if (data.accuracy !== undefined) { params.push(data.accuracy); fields.push(`least_count = $${params.length}`); }
        if (data.calibrationFrequencyDays !== undefined) { params.push(data.calibrationFrequencyDays); fields.push(`calibration_frequency = $${params.length}`); }
        if (data.status !== undefined) { params.push(data.status); fields.push(`status = $${params.length}`); }

        if (fields.length === 0) return this.getItemById(tenantId, orgId, id);

        return queryOne(
            `UPDATE item_masters SET ${fields.join(', ')}, updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *, item_name as name, item_code as code, item_type as category, manufacturer as make, measurement_range as range_capacity, least_count as accuracy, calibration_frequency as calibration_frequency_days`,
            params
        );
    }
}
