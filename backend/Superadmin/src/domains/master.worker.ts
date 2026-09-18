import { Hono } from 'hono';
import { MasterController } from '../controllers/master.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody, validateParams } from '../middleware/zod.middleware';
import { uuidParamSchema } from '../schemas/common.schema';
import {
    createClientSchema, updateClientSchema,
    createVendorSchema, updateVendorSchema,
    createItemMasterSchema, updateItemMasterSchema
} from '../schemas/master.schema';

const masterWorker = new Hono();

masterWorker.use('*', authMiddleware, tenantMiddleware);

// CLIENTS
masterWorker.get('/clients', requirePermission('CLIENT_VIEW'), MasterController.getClients);
masterWorker.get('/clients/:id', requirePermission('CLIENT_VIEW'), validateParams(uuidParamSchema), MasterController.getClientById);
masterWorker.post('/clients', requirePermission('CLIENT_CREATE'), validateBody(createClientSchema), MasterController.createClient);
masterWorker.put('/clients/:id', requirePermission('CLIENT_UPDATE'), validateParams(uuidParamSchema), validateBody(updateClientSchema), MasterController.updateClient);

// VENDORS
masterWorker.get('/vendors', requirePermission('VENDOR_VIEW'), MasterController.getVendors);
masterWorker.get('/vendors/:id', requirePermission('VENDOR_VIEW'), validateParams(uuidParamSchema), MasterController.getVendorById);
masterWorker.post('/vendors', requirePermission('VENDOR_CREATE'), validateBody(createVendorSchema), MasterController.createVendor);
masterWorker.put('/vendors/:id', requirePermission('VENDOR_UPDATE'), validateParams(uuidParamSchema), validateBody(updateVendorSchema), MasterController.updateVendor);

// ITEM MASTERS
masterWorker.get('/items', requirePermission('ITEM_VIEW'), MasterController.getItems);
masterWorker.get('/items/:id', requirePermission('ITEM_VIEW'), validateParams(uuidParamSchema), MasterController.getItemById);
masterWorker.post('/items', requirePermission('ITEM_CREATE'), validateBody(createItemMasterSchema), MasterController.createItem);
masterWorker.put('/items/:id', requirePermission('ITEM_UPDATE'), validateParams(uuidParamSchema), validateBody(updateItemMasterSchema), MasterController.updateItem);

export { masterWorker };
