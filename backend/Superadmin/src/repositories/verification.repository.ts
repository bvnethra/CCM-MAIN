import { query, queryOne, withTransaction } from '../db/client';

export class VerificationRepository {
    static async getLabQueue(tenantId: string, orgId: string) {
        return query(
            `SELECT ri.*, cr.request_number, cr.priority, cr.status as request_status, c.client_name as client_name, im.item_name as item_name, im.item_code as item_code
             FROM request_items ri
             JOIN calibration_requests cr ON ri.request_id = cr.id
             JOIN clients c ON cr.client_id = c.id
             JOIN item_masters im ON ri.item_master_id = im.id
             WHERE ri.tenant_id = $1 AND ri.organization_id = $2
               AND ri.status IN ('ADDED', 'RECEIVED', 'VERIFICATION_PENDING')
             ORDER BY cr.priority DESC, cr.created_at ASC`,
            [tenantId, orgId]
        );
    }

    static async getLabQueueItem(tenantId: string, orgId: string, requestItemId: string) {
        return queryOne(
            `SELECT ri.*, cr.request_number, cr.priority, im.item_name as item_name, im.item_code as item_code
             FROM request_items ri
             JOIN calibration_requests cr ON ri.request_id = cr.id
             JOIN item_masters im ON ri.item_master_id = im.id
             WHERE ri.tenant_id = $1 AND ri.organization_id = $2 AND ri.id = $3`,
            [tenantId, orgId, requestItemId]
        );
    }

    static async createVerification(tenantId: string, orgId: string, requestId: string, requestItemId: string, userId: string, data: any) {
        return withTransaction(async (client) => {
            const itemRes = await client.query(`SELECT quantity FROM request_items WHERE id = $1`, [requestItemId]);
            const expQty = itemRes.rows[0]?.quantity || 1;

            const verRes = await client.query(
                `INSERT INTO verifications (
                    tenant_id, organization_id, request_id, request_item_id, verified_by, verified_quantity, expected_quantity, observed_item_condition, result, remarks
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING *`,
                [
                    tenantId, orgId, requestId, requestItemId, userId,
                    data.receivedQuantity || expQty, expQty,
                    data.verificationCondition || 'GOOD',
                    data.verificationResult || 'VERIFIED',
                    data.remarks || null
                ]
            );

            const itemStatus = data.verificationResult === 'VERIFIED' ? 'VERIFIED' : data.verificationResult;
            await client.query(
                `UPDATE request_items SET status = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
                [itemStatus, requestItemId, tenantId]
            );

            return verRes.rows[0];
        });
    }

    static async getVerificationByItemId(tenantId: string, orgId: string, requestItemId: string) {
        return queryOne(
            `SELECT * FROM verifications WHERE tenant_id = $1 AND organization_id = $2 AND request_item_id = $3`,
            [tenantId, orgId, requestItemId]
        );
    }
}
