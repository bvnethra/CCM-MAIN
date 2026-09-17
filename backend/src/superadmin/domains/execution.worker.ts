import { Hono } from 'hono';
import { ExecutionController } from '../controllers/execution.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody, validateParams } from '../middleware/zod.middleware';
import { uuidParamSchema } from '../schemas/common.schema';
import {
    createSignatureSchema, updateSignatureStatusSchema,
    createDispatchSchema, createDeliverySchema, receiveDeliverySchema, signDeliverySchema
} from '../schemas/execution.schema';

const executionWorker = new Hono();

executionWorker.use('*', authMiddleware, tenantMiddleware);

// SIGNATURES
executionWorker.get('/signatures/:requestId', requirePermission('SIGNATURE_VIEW'), ExecutionController.getSignaturesByRequestId);
executionWorker.post('/signatures', requirePermission('SIGNATURE_CREATE'), validateBody(createSignatureSchema), ExecutionController.createSignature);
executionWorker.post('/signatures/:id/sign', requirePermission('SIGNATURE_CREATE'), validateParams(uuidParamSchema), ExecutionController.updateSignatureStatus);

// DISPATCHES
executionWorker.get('/dispatches', requirePermission('DISPATCH_VIEW'), ExecutionController.getDispatches);
executionWorker.get('/dispatches/:id', requirePermission('DISPATCH_VIEW'), validateParams(uuidParamSchema), ExecutionController.getDispatchById);
executionWorker.post('/dispatches', requirePermission('DISPATCH_CREATE'), validateBody(createDispatchSchema), ExecutionController.createDispatch);
executionWorker.post('/dispatches/:id/dispatch', requirePermission('DISPATCH_CREATE'), validateParams(uuidParamSchema), ExecutionController.executeDispatch);

// DELIVERIES
executionWorker.get('/deliveries', requirePermission('DELIVERY_VIEW'), ExecutionController.getDeliveries);
executionWorker.get('/deliveries/:id', requirePermission('DELIVERY_VIEW'), validateParams(uuidParamSchema), ExecutionController.getDeliveryById);
executionWorker.post('/deliveries', requirePermission('DELIVERY_UPDATE'), validateBody(createDeliverySchema), ExecutionController.createDelivery);
executionWorker.post('/deliveries/:id/receive', requirePermission('DELIVERY_UPDATE'), validateParams(uuidParamSchema), validateBody(receiveDeliverySchema), ExecutionController.receiveDelivery);
executionWorker.post('/deliveries/:id/sign', requirePermission('DELIVERY_UPDATE'), validateParams(uuidParamSchema), validateBody(signDeliverySchema), ExecutionController.signDelivery);

// FINAL COMPLETION
executionWorker.post('/requests/:id/complete', requirePermission('REQUEST_COMPLETE'), validateParams(uuidParamSchema), ExecutionController.completeRequest);

export { executionWorker };
