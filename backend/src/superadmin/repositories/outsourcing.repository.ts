import { query, queryOne } from '../db/client';

export class OutsourcingRepository {
    static async getOutsourcingList(tenantId: string, orgId: string, limit: number, offset: number) {
        return query(
            `SELECT vo.*, v.vendor_name as vendor_name, im.item_name as item_name
             FROM vendor_outsourcing vo
             JOIN vendors v ON vo.vendor_id = v.id
             JOIN item_masters im ON vo.item_master_id = im.id
             WHERE vo.tenant_id = $1 AND vo.organization_id = $2
             ORDER BY vo.created_at DESC LIMIT $3 OFFSET $4`,
            [tenantId, orgId, limit, offset]
        );
    }

    static async getOutsourcingById(tenantId: string, orgId: string, id: string) {
        return queryOne(
            `SELECT vo.*, v.vendor_name as vendor_name, im.item_name as item_name
             FROM vendor_outsourcing vo
             JOIN vendors v ON vo.vendor_id = v.id
             JOIN item_masters im ON vo.item_master_id = im.id
             WHERE vo.tenant_id = $1 AND vo.organization_id = $2 AND vo.id = $3`,
            [tenantId, orgId, id]
        );
    }

    static async createOutsourcing(tenantId: string, orgId: string, userId: string, data: any) {
        const item = await queryOne<{ request_id: string }>(
            `SELECT request_id FROM request_items WHERE id = $1 AND tenant_id = $2`,
            [data.requestItemId, tenantId]
        );
        if (!item) throw new Error('RESOURCE_NOT_FOUND: Request item not found');

        return queryOne(
            `INSERT INTO vendor_outsourcing (
                tenant_id, organization_id, request_id, request_item_id, item_master_id, vendor_id, outsourcing_reason, estimated_days, quoted_price, outsourcing_status, created_by
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                tenantId, orgId, item.request_id, data.requestItemId, data.itemMasterId,
                data.vendorId, data.outsourcingReason || null, data.estimatedDays || 7,
                data.quotedPrice || 0.00, 'CREATED', userId
            ]
        );
    }

    static async returnOutsourcing(tenantId: string, orgId: string, id: string, data: any) {
        return queryOne(
            `UPDATE vendor_outsourcing
             SET outsourcing_status = $4, vendor_certificate_number = COALESCE($5, vendor_certificate_number), return_condition = COALESCE($6, return_condition), actual_cost = COALESCE($7, actual_cost), remarks = COALESCE($8, remarks), updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *`,
            [tenantId, orgId, id, data.outsourcingStatus, data.vendorCertificateNumber || null, data.returnCondition || 'GOOD', data.actualCost || 0.00, data.remarks || null]
        );
    }
}
