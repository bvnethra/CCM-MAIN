import { query, queryOne, withTransaction } from '../db/client';

export class RequestRepository {
    static async getRequests(tenantId: string, orgId: string, limit: number, offset: number, status?: string, clientId?: string) {
        let sql = `SELECT cr.*, c.client_name as client_name, u.full_name as collection_agent_name
                   FROM calibration_requests cr
                   JOIN clients c ON cr.client_id = c.id
                   LEFT JOIN user_profiles u ON cr.collection_agent_id = u.id
                   WHERE cr.tenant_id = $1 AND cr.organization_id = $2`;
        const params: any[] = [tenantId, orgId];

        if (status) {
            params.push(status);
            sql += ` AND cr.status = $${params.length}`;
        }
        if (clientId) {
            params.push(clientId);
            sql += ` AND cr.client_id = $${params.length}`;
        }

        sql += ` ORDER BY cr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const rows = await query(sql, params);
        const countRow = await queryOne<{ count: string }>(
            `SELECT count(*) FROM calibration_requests WHERE tenant_id = $1 AND organization_id = $2`,
            [tenantId, orgId]
        );
        return { data: rows, total: parseInt(countRow?.count || '0', 10) };
    }

    static async getRequestById(tenantId: string, orgId: string, id: string) {
        const req = await queryOne(
            `SELECT cr.*, c.client_name as client_name, c.email as client_email, u.full_name as collection_agent_name
             FROM calibration_requests cr
             JOIN clients c ON cr.client_id = c.id
             LEFT JOIN user_profiles u ON cr.collection_agent_id = u.id
             WHERE cr.tenant_id = $1 AND cr.organization_id = $2 AND cr.id = $3`,
            [tenantId, orgId, id]
        );
        if (!req) return null;

        const items = await query(
            `SELECT ri.*, im.item_name as item_name, im.item_code as item_code, im.item_type as item_category
             FROM request_items ri
             JOIN item_masters im ON ri.item_master_id = im.id
             WHERE ri.tenant_id = $1 AND ri.organization_id = $2 AND ri.request_id = $3
             ORDER BY ri.created_at ASC`,
            [tenantId, orgId, id]
        );

        return { ...req, items };
    }

    static async createRequestWithItems(tenantId: string, orgId: string, userId: string, data: any) {
        return withTransaction(async (client) => {
            // Ensure sequence is higher than existing max request number to avoid unique constraint collisions
            await client.query(`
                SELECT setval('calibration_request_seq', GREATEST(
                    (SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 9) AS BIGINT)), 0) FROM calibration_requests),
                    10
                ));
            `);

            const reqRes = await client.query(
                `INSERT INTO calibration_requests (
                    tenant_id, organization_id, client_id, collection_agent_id, collection_date, priority, status, remarks, created_by
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [
                    tenantId, orgId, data.clientId, data.collectionAgentId || userId,
                    data.collectionDate || new Date(), data.priority || 'NORMAL',
                    'CREATED', data.remarks || null, userId
                ]
            );
            const newReq = reqRes.rows[0];

            for (const item of data.items) {
                await client.query(
                    `INSERT INTO request_items (
                        tenant_id, organization_id, request_id, item_master_id, quantity, item_condition, document_requirement_status, remarks
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        tenantId, orgId, newReq.id, item.itemMasterId, item.quantity || 1,
                        item.visualCondition || item.itemCondition || 'GOOD',
                        item.documentRequired ? 'DOCUMENT_REQUIRED' : 'DOCUMENT_PENDING',
                        item.remarks || null
                    ]
                );
            }

            return newReq;
        });
    }

    static async updateRequestStatus(tenantId: string, orgId: string, id: string, status: string, userId: string) {
        return queryOne(
            `UPDATE calibration_requests
             SET status = $4, updated_by = $5, updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *`,
            [tenantId, orgId, id, status, userId]
        );
    }

    static async updateRequest(tenantId: string, orgId: string, id: string, data: any, userId: string) {
        const fields: string[] = [];
        const params: any[] = [tenantId, orgId, id];

        if (data.clientId !== undefined) { params.push(data.clientId); fields.push(`client_id = $${params.length}`); }
        if (data.collectionAgentId !== undefined) { params.push(data.collectionAgentId); fields.push(`collection_agent_id = $${params.length}`); }
        if (data.priority !== undefined) { params.push(data.priority); fields.push(`priority = $${params.length}`); }
        if (data.remarks !== undefined) { params.push(data.remarks); fields.push(`remarks = $${params.length}`); }

        if (fields.length === 0) return this.getRequestById(tenantId, orgId, id);

        params.push(userId);
        fields.push(`updated_by = $${params.length}`);

        return queryOne(
            `UPDATE calibration_requests
             SET ${fields.join(', ')}, updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *`,
            params
        );
    }
}
