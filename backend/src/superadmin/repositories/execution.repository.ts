import { query, queryOne, withTransaction } from '../db/client';

export class ExecutionRepository {
    // SIGNATURES
    static async getSignaturesByRequestId(tenantId: string, orgId: string, requestId: string) {
        return query(
            `SELECT s.*, u.full_name as signed_by_user_name
             FROM signatures s
             LEFT JOIN user_profiles u ON s.signed_by_user_id = u.id
             WHERE s.tenant_id = $1 AND s.organization_id = $2 AND s.request_id = $3
             ORDER BY s.created_at ASC`,
            [tenantId, orgId, requestId]
        );
    }

    static async getSignatureById(tenantId: string, orgId: string, id: string) {
        return queryOne(
            `SELECT * FROM signatures WHERE tenant_id = $1 AND organization_id = $2 AND id = $3`,
            [tenantId, orgId, id]
        );
    }

    static async createSignature(tenantId: string, orgId: string, userId: string, data: any) {
        return queryOne(
            `INSERT INTO signatures (
                tenant_id, organization_id, request_id, signature_type, signed_by_name, signed_by_user_id, signature_status, signed_at, signature_reference, remarks
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)
             RETURNING *`,
            [
                tenantId, orgId, data.requestId, data.signatureType, data.signedByName,
                userId, 'SIGNED', data.signatureReference || null, data.remarks || null
            ]
        );
    }

    static async updateSignatureStatus(tenantId: string, orgId: string, id: string, status: string, remarks?: string) {
        return queryOne(
            `UPDATE signatures
             SET signature_status = $4, remarks = COALESCE($5, remarks), updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *`,
            [tenantId, orgId, id, status, remarks || null]
        );
    }

    // DISPATCHES
    static async getDispatches(tenantId: string, orgId: string, limit: number, offset: number) {
        return query(
            `SELECT d.*, cr.request_number, c.client_name as client_name
             FROM dispatches d
             JOIN calibration_requests cr ON d.request_id = cr.id
             JOIN clients c ON cr.client_id = c.id
             WHERE d.tenant_id = $1 AND d.organization_id = $2
             ORDER BY d.created_at DESC LIMIT $3 OFFSET $4`,
            [tenantId, orgId, limit, offset]
        );
    }

    static async getDispatchById(tenantId: string, orgId: string, id: string) {
        const dsp = await queryOne(
            `SELECT d.*, cr.request_number, c.client_name as client_name
             FROM dispatches d
             JOIN calibration_requests cr ON d.request_id = cr.id
             JOIN clients c ON cr.client_id = c.id
             WHERE d.tenant_id = $1 AND d.organization_id = $2 AND d.id = $3`,
            [tenantId, orgId, id]
        );
        if (!dsp) return null;

        const items = await query(
            `SELECT di.*, im.item_name as item_name, im.item_code as item_code
             FROM dispatch_items di
             JOIN item_masters im ON di.item_master_id = im.id
             WHERE di.dispatch_id = $1`,
            [id]
        );
        return { ...dsp, items };
    }

    static async createDispatch(tenantId: string, orgId: string, userId: string, data: any) {
        return withTransaction(async (client) => {
            await client.query(`
                SELECT setval('dispatch_seq', GREATEST(
                    (SELECT COALESCE(MAX(CAST(SUBSTRING(dispatch_number FROM 10) AS BIGINT)), 0) FROM dispatches),
                    10
                ));
            `);

            const dspRes = await client.query(
                `INSERT INTO dispatches (
                    tenant_id, organization_id, request_id, dispatch_date, dispatch_status, courier_name, tracking_number, tracking_url, expected_delivery_date, remarks, created_by
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 RETURNING *`,
                [
                    tenantId, orgId, data.requestId, data.dispatchDate || new Date(), 'DRAFT',
                    data.courierName || null, data.trackingNumber || null, data.trackingUrl || null,
                    data.expectedDeliveryDate || null, data.remarks || null, userId
                ]
            );
            const newDsp = dspRes.rows[0];

            for (const item of data.items) {
                await client.query(
                    `INSERT INTO dispatch_items (
                        tenant_id, organization_id, dispatch_id, request_id, request_item_id, item_master_id, quantity, remarks
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        tenantId, orgId, newDsp.id, data.requestId, item.requestItemId,
                        item.itemMasterId, item.quantity || 1, item.remarks || null
                    ]
                );
            }

            return newDsp;
        });
    }

    static async updateDispatchStatus(tenantId: string, orgId: string, id: string, status: string, userId: string) {
        return withTransaction(async (client) => {
            const dspRes = await client.query(
                `UPDATE dispatches
                 SET dispatch_status = $4::varchar, actual_dispatch_date = CASE WHEN $4::varchar = 'DISPATCHED' THEN NOW() ELSE actual_dispatch_date END, updated_by = $5, updated_at = NOW()
                 WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
                 RETURNING *`,
                [tenantId, orgId, id, status, userId]
            );
            const dsp = dspRes.rows[0];

            if (dsp && status === 'DISPATCHED') {
                await client.query(
                    `UPDATE calibration_requests SET status = 'DISPATCHED', updated_by = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
                    [userId, dsp.request_id, tenantId]
                );
            }

            return dsp;
        });
    }

    // DELIVERIES
    static async getDeliveries(tenantId: string, orgId: string, limit: number, offset: number) {
        return query(
            `SELECT del.*, dsp.dispatch_number, cr.request_number
             FROM deliveries del
             JOIN dispatches dsp ON del.dispatch_id = dsp.id
             JOIN calibration_requests cr ON del.request_id = cr.id
             WHERE del.tenant_id = $1 AND del.organization_id = $2
             ORDER BY del.created_at DESC LIMIT $3 OFFSET $4`,
            [tenantId, orgId, limit, offset]
        );
    }

    static async getDeliveryById(tenantId: string, orgId: string, id: string) {
        return queryOne(
            `SELECT del.*, dsp.dispatch_number, cr.request_number
             FROM deliveries del
             JOIN dispatches dsp ON del.dispatch_id = dsp.id
             JOIN calibration_requests cr ON del.request_id = cr.id
             WHERE del.tenant_id = $1 AND del.organization_id = $2 AND del.id = $3`,
            [tenantId, orgId, id]
        );
    }

    static async createDelivery(tenantId: string, orgId: string, userId: string, data: any) {
        return withTransaction(async (client) => {
            await client.query(`
                SELECT setval('delivery_seq', GREATEST(
                    (SELECT COALESCE(MAX(CAST(SUBSTRING(delivery_number FROM 10) AS BIGINT)), 0) FROM deliveries),
                    10
                ));
            `);

            const delRes = await client.query(
                `INSERT INTO deliveries (
                    tenant_id, organization_id, request_id, dispatch_id, delivery_date, delivery_status, received_by_name, received_by_contact, delivery_remarks, created_by
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING *`,
                [
                    tenantId, orgId, data.requestId, data.dispatchId, data.deliveryDate || new Date(),
                    'PENDING', data.receivedByName || null, data.receivedByContact || null,
                    data.deliveryRemarks || null, userId
                ]
            );
            return delRes.rows[0];
        });
    }

    static async updateDeliveryStatus(tenantId: string, orgId: string, id: string, status: string, userId: string, data?: any) {
        return withTransaction(async (client) => {
            const delRes = await client.query(
                `UPDATE deliveries
                 SET delivery_status = $4::varchar, received_by_name = COALESCE($5, received_by_name), received_by_contact = COALESCE($6, received_by_contact), delivery_remarks = COALESCE($7, delivery_remarks), updated_by = $8, updated_at = NOW()
                 WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
                 RETURNING *`,
                [
                    tenantId, orgId, id, status, data?.receivedByName || null,
                    data?.receivedByContact || null, data?.deliveryRemarks || null, userId
                ]
            );
            const del = delRes.rows[0];

            if (del) {
                if (status === 'CLIENT_RECEIVED') {
                    await client.query(
                        `UPDATE calibration_requests SET status = 'CLIENT_RECEIVED', updated_by = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
                        [userId, del.request_id, tenantId]
                    );
                } else if (status === 'DELIVERY_SIGNED') {
                    await client.query(
                        `UPDATE calibration_requests SET status = 'DELIVERY_SIGNED', updated_by = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
                        [userId, del.request_id, tenantId]
                    );
                }
            }

            return del;
        });
    }

    // FINAL REQUEST COMPLETION PROCEDURE CALL
    static async completeCalibrationRequest(tenantId: string, orgId: string, requestId: string, userId: string) {
        return withTransaction(async (client) => {
            await client.query(
                `SELECT complete_calibration_request($1, $2);`,
                [requestId, userId]
            );

            const updatedReq = await client.query(
                `SELECT * FROM calibration_requests WHERE id = $1 AND tenant_id = $2 AND organization_id = $3`,
                [requestId, tenantId, orgId]
            );

            return updatedReq.rows[0];
        });
    }
}
