import { query, queryOne, withTransaction } from '../db/client';

export class CalibrationRepository {
    static async getCalibrations(tenantId: string, orgId: string, limit: number, offset: number) {
        const rows = await query(
            `SELECT c.*, im.item_name as item_name, im.item_code as item_code, cr.request_number
             FROM calibrations c
             JOIN request_items ri ON c.request_item_id = ri.id
             JOIN item_masters im ON ri.item_master_id = im.id
             JOIN calibration_requests cr ON c.request_id = cr.id
             WHERE c.tenant_id = $1 AND c.organization_id = $2
             ORDER BY c.created_at DESC LIMIT $3 OFFSET $4`,
            [tenantId, orgId, limit, offset]
        );
        const countRow = await queryOne<{ count: string }>(
            `SELECT count(*) FROM calibrations WHERE tenant_id = $1 AND organization_id = $2`,
            [tenantId, orgId]
        );
        return { data: rows, total: parseInt(countRow?.count || '0', 10) };
    }

    static async getCalibrationById(tenantId: string, orgId: string, id: string) {
        const cal = await queryOne(
            `SELECT c.*, im.item_name as item_name, im.item_code as item_code, cr.request_number
             FROM calibrations c
             JOIN request_items ri ON c.request_item_id = ri.id
             JOIN item_masters im ON ri.item_master_id = im.id
             JOIN calibration_requests cr ON c.request_id = cr.id
             WHERE c.tenant_id = $1 AND c.organization_id = $2 AND c.id = $3`,
            [tenantId, orgId, id]
        );
        if (!cal) return null;

        const measurements = await query(
            `SELECT * FROM calibration_measurements WHERE calibration_id = $1 ORDER BY created_at ASC`,
            [id]
        );
        return { ...cal, measurements };
    }

    static async createCalibration(tenantId: string, orgId: string, userId: string, data: any) {
        return withTransaction(async (client) => {
            await client.query(`
                SELECT setval('calibration_seq', (
                    SELECT COALESCE(MAX(CAST(SUBSTRING(calibration_number FROM 5) AS BIGINT)), 0) FROM calibrations
                ));
            `);

            const itemRes = await client.query(
                `SELECT ri.request_id, im.calibration_frequency
                 FROM request_items ri
                 JOIN item_masters im ON ri.item_master_id = im.id
                 WHERE ri.id = $1 AND ri.tenant_id = $2`,
                [data.requestItemId, tenantId]
            );
            const reqId = itemRes.rows[0]?.request_id;
            const freqDays = itemRes.rows[0]?.calibration_frequency || 365;

            if (!reqId) throw new Error('RESOURCE_NOT_FOUND: Request item not found');

            const res = await client.query(
                `INSERT INTO calibrations (
                    tenant_id, organization_id, request_id, request_item_id, calibrated_by, calibration_date, result, outcome, calibration_frequency, remarks
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING *`,
                [
                    tenantId, orgId, reqId, data.requestItemId,
                    data.calibratedBy || userId, data.calibrationDate || new Date(),
                    'PASS', 'CALIBRATED', freqDays, data.remarks || null
                ]
            );
            return res.rows[0];
        });
    }

    static async addMeasurement(tenantId: string, orgId: string, calibrationId: string, data: any) {
        const passFail = (data.observedValue >= (data.toleranceMin ?? -Infinity) && data.observedValue <= (data.toleranceMax ?? Infinity)) ? 'PASS' : 'FAIL';
        return queryOne(
            `INSERT INTO calibration_measurements (
                tenant_id, organization_id, calibration_id, parameter_name, nominal_value, measured_value, unit, tolerance_min, tolerance_max, result, remarks
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                tenantId, orgId, calibrationId, data.parameterName, data.nominalValue, data.observedValue,
                data.unit, data.toleranceMin ?? 0.00, data.toleranceMax ?? 0.00, passFail, data.remarks || null
            ]
        );
    }

    static async completeCalibration(tenantId: string, orgId: string, id: string, result: string, remarks?: string) {
        const passResult = (result === 'PASSED' || result === 'PASS') ? 'PASS' : 'FAIL';
        const cal = await queryOne(
            `UPDATE calibrations
             SET result = $4, remarks = COALESCE($5, remarks), updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *`,
            [tenantId, orgId, id, passResult, remarks || null]
        );
        if (!cal) throw new Error('RESOURCE_NOT_FOUND: Calibration record not found');
        return cal;
    }

    static async getCertificates(tenantId: string, orgId: string, limit: number, offset: number) {
        return query(
            `SELECT c.*, cal.result as calibration_result, im.item_name as item_name
             FROM certificates c
             JOIN calibrations cal ON c.calibration_id = cal.id
             JOIN request_items ri ON cal.request_item_id = ri.id
             JOIN item_masters im ON ri.item_master_id = im.id
             WHERE c.tenant_id = $1 AND c.organization_id = $2
             ORDER BY c.created_at DESC LIMIT $3 OFFSET $4`,
            [tenantId, orgId, limit, offset]
        );
    }

    static async getDueList(tenantId: string, orgId: string, limit: number, offset: number) {
        return query(
            `SELECT c.id as calibration_id, c.calibration_number, c.calibration_date, c.next_due_date, c.result, im.item_name, im.item_code
             FROM calibrations c
             JOIN request_items ri ON c.request_item_id = ri.id
             JOIN item_masters im ON ri.item_master_id = im.id
             WHERE c.tenant_id = $1 AND c.organization_id = $2 AND c.next_due_date IS NOT NULL
             ORDER BY c.next_due_date ASC LIMIT $3 OFFSET $4`,
            [tenantId, orgId, limit, offset]
        );
    }
}
