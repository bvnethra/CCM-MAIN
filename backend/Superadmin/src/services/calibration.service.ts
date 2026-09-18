import { CalibrationRepository } from '../repositories/calibration.repository';
import { UserSecurityContext } from '../types/context';
import { createAuditLog } from '../db/audit';

export class CalibrationService {
    static async getCalibrations(ctx: UserSecurityContext, limit: number, offset: number) {
        return CalibrationRepository.getCalibrations(ctx.tenantId, ctx.organizationId, limit, offset);
    }

    static async getCalibrationById(ctx: UserSecurityContext, id: string) {
        const cal = await CalibrationRepository.getCalibrationById(ctx.tenantId, ctx.organizationId, id);
        if (!cal) throw new Error('RESOURCE_NOT_FOUND: Calibration record not found');
        return cal;
    }

    static async createCalibration(ctx: UserSecurityContext, input: any) {
        const cal = await CalibrationRepository.createCalibration(ctx.tenantId, ctx.organizationId, ctx.userId, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'CALIBRATION_STARTED',
            entityType: 'calibrations',
            entityId: cal.id,
            newData: cal
        });
        return cal;
    }

    static async addMeasurement(ctx: UserSecurityContext, calibrationId: string, input: any) {
        await this.getCalibrationById(ctx, calibrationId);
        const measurement = await CalibrationRepository.addMeasurement(ctx.tenantId, ctx.organizationId, calibrationId, input);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'MEASUREMENT_RECORDED',
            entityType: 'calibration_measurements',
            entityId: measurement.id,
            newData: measurement
        });
        return measurement;
    }

    static async completeCalibration(ctx: UserSecurityContext, id: string, input: any) {
        const cal = await this.getCalibrationById(ctx, id);
        if (cal.calibration_result && cal.calibration_result !== 'PENDING') {
            throw new Error(`INVALID_STATE: Calibration is already completed with result '${cal.calibration_result}'`);
        }
        const updated = await CalibrationRepository.completeCalibration(ctx.tenantId, ctx.organizationId, id, input.calibrationResult, input.remarks);
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'CALIBRATION_COMPLETED',
            entityType: 'calibrations',
            entityId: id,
            oldData: cal,
            newData: updated
        });
        return updated;
    }

    static async getCertificates(ctx: UserSecurityContext, limit: number, offset: number) {
        return CalibrationRepository.getCertificates(ctx.tenantId, ctx.organizationId, limit, offset);
    }

    static async getDueList(ctx: UserSecurityContext, limit: number, offset: number) {
        return CalibrationRepository.getDueList(ctx.tenantId, ctx.organizationId, limit, offset);
    }
}
