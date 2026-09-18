import { Hono } from 'hono';
import { DocumentController } from '../controllers/document.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody, validateParams } from '../middleware/zod.middleware';
import { uuidParamSchema } from '../schemas/common.schema';
import { createDocumentSchema, replaceDocumentSchema } from '../schemas/document.schema';

const documentWorker = new Hono();

// 1. Download endpoint (uses token query param verification, bypasses Bearer auth middleware)
documentWorker.get('/:id/download', DocumentController.downloadDocumentContent);

// 2. All other endpoints enforce authMiddleware + tenantMiddleware explicitly per-route
documentWorker.get('/', authMiddleware, tenantMiddleware, requirePermission('DOCUMENT_VIEW'), DocumentController.getDocuments);
documentWorker.get('/:id', authMiddleware, tenantMiddleware, requirePermission('DOCUMENT_VIEW'), validateParams(uuidParamSchema), DocumentController.getDocumentById);
documentWorker.post('/', authMiddleware, tenantMiddleware, requirePermission('DOCUMENT_CREATE'), validateBody(createDocumentSchema), DocumentController.uploadDocument);
documentWorker.post('/:id/signed-url', authMiddleware, tenantMiddleware, requirePermission('DOCUMENT_DOWNLOAD'), validateParams(uuidParamSchema), DocumentController.generateSignedUrl);
documentWorker.get('/:id/signed-url', authMiddleware, tenantMiddleware, requirePermission('DOCUMENT_DOWNLOAD'), validateParams(uuidParamSchema), DocumentController.generateSignedUrl);
documentWorker.post('/:id/replace', authMiddleware, tenantMiddleware, requirePermission('DOCUMENT_UPDATE'), validateParams(uuidParamSchema), validateBody(replaceDocumentSchema), DocumentController.replaceDocument);
documentWorker.delete('/:id', authMiddleware, tenantMiddleware, requirePermission('DOCUMENT_DELETE'), validateParams(uuidParamSchema), DocumentController.deleteDocument);

export { documentWorker };
