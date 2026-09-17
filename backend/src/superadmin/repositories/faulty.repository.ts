import { query, queryOne } from '../db/client';

export class FaultyRepository {
    static async getFaultyServices(tenantId: string, orgId: string, limit: number, offset: number) {
        return query(
            `SELECT fs.*, im.item_name as item_name, im.item_code as item_code
             FROM faulty_item_services fs
             JOIN item_masters im ON fs.item_master_id = im.id
             WHERE fs.tenant_id = $1 AND fs.organization_id = $2
             ORDER BY fs.created_at DESC LIMIT $3 OFFSET $4`,
            [tenantId, orgId, limit, offset]
        );
    }

    static async getFaultyServiceById(tenantId: string, orgId: string, id: string) {
        return queryOne(
            `SELECT fs.*, im.item_name as item_name
             FROM faulty_item_services fs
             JOIN item_masters im ON fs.item_master_id = im.id
             WHERE fs.tenant_id = $1 AND fs.organization_id = $2 AND fs.id = $3`,
            [tenantId, orgId, id]
        );
    }

    static async createFaultyService(tenantId: string, orgId: string, userId: string, data: any) {
        const item = await queryOne<{ request_id: string }>(
            `SELECT request_id FROM request_items WHERE id = $1 AND tenant_id = $2`,
            [data.requestItemId, tenantId]
        );
        if (!item) throw new Error('RESOURCE_NOT_FOUND: Request item not found');

        return queryOne(
            `INSERT INTO faulty_item_services (
                tenant_id, organization_id, request_id, request_item_id, item_master_id, calibration_id, fault_description, action_proposed, estimated_cost, service_status, created_by
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                tenantId, orgId, item.request_id, data.requestItemId, data.itemMasterId,
                data.calibrationId || null, data.faultDescription, data.actionProposed || null,
                data.estimatedCost || 0.00, 'CREATED', userId
            ]
        );
    }

    static async completeFaultyService(tenantId: string, orgId: string, id: string, data: any) {
        return queryOne(
            `UPDATE faulty_item_services
             SET service_status = $4, work_done = COALESCE($5, work_done), cost_incurred = COALESCE($6, cost_incurred), remarks = COALESCE($7, remarks), updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *`,
            [tenantId, orgId, id, data.serviceStatus, data.workDone || null, data.costIncurred || 0.00, data.remarks || null]
        );
    }
}
