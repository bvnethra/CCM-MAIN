import { Hono } from 'hono';
import { RequestController } from '../controllers/request.controller';
import { VerificationController } from '../controllers/verification.controller';
import { CalibrationController } from '../controllers/calibration.controller';
import { FaultyController } from '../controllers/faulty.controller';
import { OutsourcingController } from '../controllers/outsourcing.controller';

import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody, validateParams } from '../middleware/zod.middleware';
import { uuidParamSchema } from '../schemas/common.schema';
import {
    createRequestSchema, updateRequestSchema, verifyItemSchema,
    createCalibrationSchema, updateCalibrationMeasurementSchema, completeCalibrationSchema,
    createFaultyServiceSchema, completeFaultyServiceSchema,
    createVendorOutsourcingSchema, returnVendorOutsourcingSchema
} from '../schemas/operations.schema';

const operationsWorker = new Hono();

operationsWorker.use('*', authMiddleware, tenantMiddleware);

// REQUESTS
operationsWorker.get('/requests', requirePermission('REQUEST_VIEW'), RequestController.getRequests);
operationsWorker.get('/requests/:id', requirePermission('REQUEST_VIEW'), validateParams(uuidParamSchema), RequestController.getRequestById);
operationsWorker.post('/requests', requirePermission('REQUEST_CREATE'), validateBody(createRequestSchema), RequestController.createRequest);
operationsWorker.put('/requests/:id', requirePermission('REQUEST_UPDATE'), validateParams(uuidParamSchema), validateBody(updateRequestSchema), RequestController.updateRequest);
operationsWorker.post('/requests/:id/submit', requirePermission('REQUEST_CREATE'), validateParams(uuidParamSchema), RequestController.submitRequest);
operationsWorker.post('/requests/:id/cancel', requirePermission('REQUEST_CANCEL'), validateParams(uuidParamSchema), RequestController.cancelRequest);

// LAB QUEUE & VERIFICATION
operationsWorker.get('/lab/queue', requirePermission('LAB_VIEW'), VerificationController.getLabQueue);
operationsWorker.get('/lab/queue/:requestItemId', requirePermission('LAB_VIEW'), VerificationController.getLabQueueItem);
operationsWorker.post('/requests/:id/items/:itemId/verify', requirePermission('VERIFICATION_EXECUTE'), validateBody(verifyItemSchema), VerificationController.verifyItem);
operationsWorker.get('/requests/:id/items/:itemId/verification', requirePermission('VERIFICATION_VIEW'), VerificationController.getVerification);

// CALIBRATIONS & MEASUREMENTS
operationsWorker.get('/calibrations', requirePermission('CALIBRATION_VIEW'), CalibrationController.getCalibrations);
operationsWorker.get('/calibrations/:id', requirePermission('CALIBRATION_VIEW'), validateParams(uuidParamSchema), CalibrationController.getCalibrationById);
operationsWorker.post('/calibrations', requirePermission('CALIBRATION_CREATE'), validateBody(createCalibrationSchema), CalibrationController.createCalibration);
operationsWorker.post('/calibrations/:id/measurements', requirePermission('CALIBRATION_MEASURE'), validateParams(uuidParamSchema), validateBody(updateCalibrationMeasurementSchema), CalibrationController.addMeasurement);
operationsWorker.post('/calibrations/:id/complete', requirePermission('CALIBRATION_COMPLETE'), validateParams(uuidParamSchema), validateBody(completeCalibrationSchema), CalibrationController.completeCalibration);

import { PdfGenerationController } from '../controllers/pdf-generation.controller';

// CERTIFICATES METADATA & DUE-LIST
operationsWorker.get('/certificates', requirePermission('CERTIFICATE_VIEW'), CalibrationController.getCertificates);
operationsWorker.post('/certificates/:id/generate', requirePermission('CERTIFICATE_GENERATE'), validateParams(uuidParamSchema), PdfGenerationController.generateCalibrationCertificatePdf);
operationsWorker.get('/due-list', requirePermission('DUE_LIST_VIEW'), CalibrationController.getDueList);

// FAULTY SERVICES
operationsWorker.get('/faulty-services', requirePermission('FAULTY_SERVICE_VIEW'), FaultyController.getFaultyServices);
operationsWorker.get('/faulty-services/:id', requirePermission('FAULTY_SERVICE_VIEW'), validateParams(uuidParamSchema), FaultyController.getFaultyServiceById);
operationsWorker.post('/faulty-services', requirePermission('FAULTY_SERVICE_CREATE'), validateBody(createFaultyServiceSchema), FaultyController.createFaultyService);
operationsWorker.post('/faulty-services/:id/complete', requirePermission('FAULTY_SERVICE_UPDATE'), validateParams(uuidParamSchema), validateBody(completeFaultyServiceSchema), FaultyController.completeFaultyService);

// VENDOR OUTSOURCING
operationsWorker.get('/vendor-outsourcing', requirePermission('VENDOR_OUTSOURCING_VIEW'), OutsourcingController.getOutsourcingList);
operationsWorker.get('/vendor-outsourcing/:id', requirePermission('VENDOR_OUTSOURCING_VIEW'), validateParams(uuidParamSchema), OutsourcingController.getOutsourcingById);
operationsWorker.post('/vendor-outsourcing', requirePermission('VENDOR_OUTSOURCING_CREATE'), validateBody(createVendorOutsourcingSchema), OutsourcingController.createOutsourcing);
operationsWorker.post('/vendor-outsourcing/:id/return', requirePermission('VENDOR_OUTSOURCING_UPDATE'), validateParams(uuidParamSchema), validateBody(returnVendorOutsourcingSchema), OutsourcingController.returnOutsourcing);

export { operationsWorker };
