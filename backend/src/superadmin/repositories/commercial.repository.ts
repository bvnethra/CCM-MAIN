import { query, queryOne, withTransaction } from '../db/client';

export class CommercialRepository {
    // QUOTATIONS
    static async getQuotations(tenantId: string, orgId: string, limit: number, offset: number) {
        return query(
            `SELECT q.*, c.client_name as client_name, cr.request_number
             FROM quotations q
             JOIN clients c ON q.client_id = c.id
             JOIN calibration_requests cr ON q.request_id = cr.id
             WHERE q.tenant_id = $1 AND q.organization_id = $2
             ORDER BY q.created_at DESC LIMIT $3 OFFSET $4`,
            [tenantId, orgId, limit, offset]
        );
    }

    static async getQuotationById(tenantId: string, orgId: string, id: string) {
        const quot = await queryOne(
            `SELECT q.*, c.client_name as client_name, c.email as client_email, cr.request_number
             FROM quotations q
             JOIN clients c ON q.client_id = c.id
             JOIN calibration_requests cr ON q.request_id = cr.id
             WHERE q.tenant_id = $1 AND q.organization_id = $2 AND q.id = $3`,
            [tenantId, orgId, id]
        );
        if (!quot) return null;

        const items = await query(
            `SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY created_at ASC`,
            [id]
        );
        const approvals = await query(
            `SELECT qa.*, u.full_name as approver_name
             FROM approvals qa
             LEFT JOIN user_profiles u ON qa.approver_user_id = u.id
             WHERE qa.quotation_id = $1 ORDER BY qa.created_at ASC`,
            [id]
        );
        return { ...quot, items, approvals };
    }

    static async createQuotation(tenantId: string, orgId: string, userId: string, data: any) {
        return withTransaction(async (client) => {
            await client.query(`
                SELECT setval('quotation_seq', (
                    SELECT COALESCE(MAX(CAST(SUBSTRING(quotation_number FROM 9) AS BIGINT)), 0) FROM quotations
                ));
            `);

            let subtotal = 0;
            let taxTotal = 0;

            data.items.forEach((item: any) => {
                const linePrice = item.quantity * item.unitPrice;
                const lineTax = (linePrice * (item.taxRatePercentage || 18.0)) / 100;
                subtotal += linePrice;
                taxTotal += lineTax;
            });

            const discount = data.discountAmount || 0;
            const grandTotal = subtotal + taxTotal - discount;

            const qRes = await client.query(
                `INSERT INTO quotations (
                    tenant_id, organization_id, request_id, client_id, quotation_status, valid_until, subtotal, tax_amount, discount_amount, total_amount, terms_and_conditions, notes, created_by
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                 RETURNING *`,
                [
                    tenantId, orgId, data.requestId, data.clientId, 'DRAFT',
                    data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    subtotal, taxTotal, discount, grandTotal,
                    data.termsAndConditions || 'Payment due within 30 days.', data.remarks || null, userId
                ]
            );
            const newQ = qRes.rows[0];

            for (const item of data.items) {
                const linePrice = item.quantity * item.unitPrice;
                const lineTax = (linePrice * (item.taxRatePercentage || 18.0)) / 100;
                const lineTotal = linePrice + lineTax;

                await client.query(
                    `INSERT INTO quotation_items (
                        tenant_id, organization_id, quotation_id, request_id, request_item_id, item_master_id, client_id, client_name, description, quantity, unit_price, tax_rate, tax_amount, line_total, remarks
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                    [
                        tenantId, orgId, newQ.id, data.requestId, item.requestItemId || null, item.itemMasterId || null,
                        data.clientId || newQ.client_id || null, item.clientName || null,
                        item.description, item.quantity, item.unitPrice,
                        item.taxRatePercentage || 18.0, lineTax, lineTotal, item.remarks || null
                    ]
                );
            }

            return newQ;
        });
    }

    static async updateQuotationStatus(tenantId: string, orgId: string, id: string, status: string, userId: string) {
        return queryOne(
            `UPDATE quotations SET quotation_status = $4, updated_by = $5, updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *`,
            [tenantId, orgId, id, status, userId]
        );
    }

    static async addApproval(tenantId: string, orgId: string, quotationId: string, approverId: string, action: string, reason?: string, remarks?: string) {
        return withTransaction(async (client) => {
            const qRow = await client.query(`SELECT request_id FROM quotations WHERE id = $1`, [quotationId]);
            const requestId = qRow.rows[0]?.request_id;

            const appRes = await client.query(
                `INSERT INTO approvals (
                    tenant_id, organization_id, quotation_id, request_id, approver_user_id, approval_status, action_at, rejection_reason, comments
                 ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8)
                 RETURNING *`,
                [tenantId, orgId, quotationId, requestId, approverId, action, reason || null, remarks || null]
            );

            const newStatus = action === 'APPROVED' ? 'APPROVED' : 'REJECTED';
            await client.query(
                `UPDATE quotations SET quotation_status = $1, updated_by = $2, updated_at = NOW() WHERE id = $3 AND tenant_id = $4`,
                [newStatus, approverId, quotationId, tenantId]
            );

            return appRes.rows[0];
        });
    }

    // INVOICES
    static async getInvoices(tenantId: string, orgId: string, limit: number, offset: number) {
        return query(
            `SELECT i.*, c.client_name as client_name, cr.request_number
             FROM invoices i
             JOIN clients c ON i.client_id = c.id
             JOIN calibration_requests cr ON i.request_id = cr.id
             WHERE i.tenant_id = $1 AND i.organization_id = $2
             ORDER BY i.created_at DESC LIMIT $3 OFFSET $4`,
            [tenantId, orgId, limit, offset]
        );
    }

    static async getInvoiceById(tenantId: string, orgId: string, id: string) {
        const inv = await queryOne(
            `SELECT i.*, c.client_name as client_name, cr.request_number
             FROM invoices i
             JOIN clients c ON i.client_id = c.id
             JOIN calibration_requests cr ON i.request_id = cr.id
             WHERE i.tenant_id = $1 AND i.organization_id = $2 AND i.id = $3`,
            [tenantId, orgId, id]
        );
        if (!inv) return null;

        const items = await query(`SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at ASC`, [id]);
        return { ...inv, items };
    }

    static async createInvoice(tenantId: string, orgId: string, userId: string, data: any) {
        return withTransaction(async (client) => {
            await client.query(`
                SELECT setval('invoice_seq', (
                    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 10) AS BIGINT)), 0) FROM invoices
                ));
            `);

            let subtotal = 0;
            let taxTotal = 0;

            data.items.forEach((item: any) => {
                const linePrice = item.quantity * item.unitPrice;
                const lineTax = (linePrice * (item.taxRatePercentage || 18.0)) / 100;
                subtotal += linePrice;
                taxTotal += lineTax;
            });

            const discount = data.discountAmount || 0;
            const grandTotal = subtotal + taxTotal - discount;

            let quotId = data.quotationId;
            if (!quotId) {
                const qRow = await client.query(
                    `SELECT id FROM quotations WHERE request_id = $1 AND tenant_id = $2 ORDER BY created_at DESC LIMIT 1`,
                    [data.requestId, tenantId]
                );
                quotId = qRow.rows[0]?.id;
            }
            if (!quotId) throw new Error('BUSINESS_RULE_FAILED: Cannot create invoice without a valid quotation');

            const invRes = await client.query(
                `INSERT INTO invoices (
                    tenant_id, organization_id, request_id, quotation_id, client_id, invoice_status, invoice_date, due_date, subtotal, tax_amount, discount_amount, total_amount, paid_amount, balance_amount, notes, created_by
                 ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10, $11, $12, $13, $14, $15)
                 RETURNING *`,
                [
                    tenantId, orgId, data.requestId, quotId, data.clientId, 'DRAFT',
                    data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    subtotal, taxTotal, discount, grandTotal, 0.00, grandTotal, data.remarks || null, userId
                ]
            );
            const newInv = invRes.rows[0];

            for (const item of data.items) {
                const linePrice = item.quantity * item.unitPrice;
                const lineTax = (linePrice * (item.taxRatePercentage || 18.0)) / 100;
                const lineTotal = linePrice + lineTax;

                await client.query(
                    `INSERT INTO invoice_items (
                        tenant_id, organization_id, invoice_id, request_id, request_item_id, quotation_id, description, quantity, unit_price, tax_rate, tax_amount, line_total, remarks
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [
                        tenantId, orgId, newInv.id, data.requestId, item.requestItemId || null, quotId,
                        item.description, item.quantity, item.unitPrice,
                        item.taxRatePercentage || 18.0, lineTax, lineTotal, item.remarks || null
                    ]
                );
            }

            return newInv;
        });
    }

    static async updateInvoiceStatus(tenantId: string, orgId: string, id: string, status: string, userId: string) {
        return queryOne(
            `UPDATE invoices SET invoice_status = $4, updated_by = $5, updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *`,
            [tenantId, orgId, id, status, userId]
        );
    }

    // PURCHASE ORDERS
    static async getPurchaseOrders(tenantId: string, orgId: string, limit: number, offset: number) {
        return query(
            `SELECT po.*, c.client_name as client_name, cr.request_number
             FROM purchase_orders po
             JOIN clients c ON po.client_id = c.id
             JOIN calibration_requests cr ON po.request_id = cr.id
             WHERE po.tenant_id = $1 AND po.organization_id = $2
             ORDER BY po.created_at DESC LIMIT $3 OFFSET $4`,
            [tenantId, orgId, limit, offset]
        );
    }

    static async getPurchaseOrderById(tenantId: string, orgId: string, id: string) {
        const po = await queryOne(
            `SELECT po.*, c.client_name as client_name, cr.request_number
             FROM purchase_orders po
             JOIN clients c ON po.client_id = c.id
             JOIN calibration_requests cr ON po.request_id = cr.id
             WHERE po.tenant_id = $1 AND po.organization_id = $2 AND po.id = $3`,
            [tenantId, orgId, id]
        );
        if (!po) return null;

        const items = await query(`SELECT * FROM po_items WHERE purchase_order_id = $1 ORDER BY created_at ASC`, [id]);
        return { ...po, items };
    }

    static async createPurchaseOrder(tenantId: string, orgId: string, userId: string, data: any) {
        return withTransaction(async (client) => {
            await client.query(`
                SELECT setval('po_seq', (
                    SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 10) AS BIGINT)), 0) FROM purchase_orders
                ));
            `);

            let subtotal = 0;
            let taxTotal = 0;

            data.items.forEach((item: any) => {
                const linePrice = item.quantity * item.unitPrice;
                const lineTax = (linePrice * (item.taxRatePercentage || 18.0)) / 100;
                subtotal += linePrice;
                taxTotal += lineTax;
            });

            const discount = data.discountAmount || 0;
            const grandTotal = subtotal + taxTotal - discount;

            let quotId = data.quotationId;
            if (!quotId) {
                const qRow = await client.query(
                    `SELECT id FROM quotations WHERE request_id = $1 AND tenant_id = $2 ORDER BY created_at DESC LIMIT 1`,
                    [data.requestId, tenantId]
                );
                quotId = qRow.rows[0]?.id;
            }
            if (!quotId) throw new Error('BUSINESS_RULE_FAILED: Cannot create PO without a valid quotation');

            const poRes = await client.query(
                `INSERT INTO purchase_orders (
                    tenant_id, organization_id, request_id, quotation_id, client_id, po_number, po_date, po_status, subtotal, tax_amount, discount_amount, total_amount, notes, created_by
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                 RETURNING *`,
                [
                    tenantId, orgId, data.requestId, quotId, data.clientId,
                    data.clientPoNumber, data.poDate || new Date(), 'DRAFT',
                    subtotal, taxTotal, discount, grandTotal, data.remarks || null, userId
                ]
            );
            const newPo = poRes.rows[0];

            for (const item of data.items) {
                const linePrice = item.quantity * item.unitPrice;
                const lineTax = (linePrice * (item.taxRatePercentage || 18.0)) / 100;
                const lineTotal = linePrice + lineTax;

                await client.query(
                    `INSERT INTO po_items (
                        tenant_id, organization_id, purchase_order_id, request_id, request_item_id, quotation_id, description, quantity, unit_price, tax_rate, tax_amount, line_total, remarks
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [
                        tenantId, orgId, newPo.id, data.requestId, item.requestItemId || null, quotId,
                        item.description, item.quantity, item.unitPrice,
                        item.taxRatePercentage || 18.0, lineTax, lineTotal, item.remarks || null
                    ]
                );
            }

            return newPo;
        });
    }

    static async updatePOStatus(tenantId: string, orgId: string, id: string, status: string, userId: string) {
        return queryOne(
            `UPDATE purchase_orders SET po_status = $4, updated_by = $5, updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *`,
            [tenantId, orgId, id, status, userId]
        );
    }
}
