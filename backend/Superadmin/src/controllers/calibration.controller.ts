import { Context } from 'hono';
import { CalibrationService } from '../services/calibration.service';
import { getUserContext } from '../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../utils/response';
import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';

export class CalibrationController {
    static async getCalibrations(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const { data, total } = await CalibrationService.getCalibrations(userCtx, pagination.limit, pagination.offset);
        return sendSuccess(c, data, 'Calibrations retrieved successfully', buildPaginationMeta(pagination.page, pagination.limit, total));
    }

    static async getCalibrationById(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const cal = await CalibrationService.getCalibrationById(userCtx, id);
        return sendSuccess(c, cal);
    }

    static async createCalibration(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const cal = await CalibrationService.createCalibration(userCtx, body);
        return sendCreated(c, cal, 'Calibration initiated successfully');
    }

    static async addMeasurement(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = c.get('validatedBody');
        const m = await CalibrationService.addMeasurement(userCtx, id, body);
        return sendCreated(c, m, 'Measurement recorded successfully');
    }

    static async completeCalibration(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = c.get('validatedBody');
        const completed = await CalibrationService.completeCalibration(userCtx, id, body);
        return sendSuccess(c, completed, 'Calibration completed successfully');
    }

    static async getCertificates(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const certs = await CalibrationService.getCertificates(userCtx, pagination.limit, pagination.offset);
        return sendSuccess(c, certs, 'Certificates metadata retrieved successfully');
    }

    static async getDueList(c: Context) {
        const userCtx = getUserContext(c);
        const pagination = parsePaginationParams(c.req.query());
        const dueList = await CalibrationService.getDueList(userCtx, pagination.limit, pagination.offset);
        return sendSuccess(c, dueList, 'Calibration due-list retrieved successfully');
    }
}
