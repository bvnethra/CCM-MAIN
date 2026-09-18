import { Hono } from 'hono';
import { CommercialController } from '../controllers/commercial.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validateBody, validateParams } from '../middleware/zod.middleware';
import { uuidParamSchema } from '../schemas/common.schema';
import {
    createQuotationSchema, approveQuotationSchema,
    createInvoiceSchema, createPurchaseOrderSchema
} from '../schemas/commercial.schema';

const commercialWorker = new Hono();

commercialWorker.use('*', authMiddleware, tenantMiddleware);

import { PdfGenerationController } from '../controllers/pdf-generation.controller';

// QUOTATIONS
commercialWorker.get('/quotations', requirePermission('QUOTATION_VIEW'), CommercialController.getQuotations);
commercialWorker.get('/quotations/:id', requirePermission('QUOTATION_VIEW'), validateParams(uuidParamSchema), CommercialController.getQuotationById);
commercialWorker.post('/quotations', requirePermission('QUOTATION_CREATE'), validateBody(createQuotationSchema), CommercialController.createQuotation);
commercialWorker.post('/quotations/:id/submit', requirePermission('QUOTATION_CREATE'), validateParams(uuidParamSchema), CommercialController.submitQuotation);
commercialWorker.post('/quotations/:id/approve', requirePermission('QUOTATION_APPROVE'), validateParams(uuidParamSchema), validateBody(approveQuotationSchema), CommercialController.approveQuotation);
commercialWorker.post('/quotations/:id/generate-pdf', requirePermission('QUOTATION_PDF_GENERATE'), validateParams(uuidParamSchema), PdfGenerationController.generateQuotationPdf);

// INVOICES
commercialWorker.get('/invoices', requirePermission('INVOICE_VIEW'), CommercialController.getInvoices);
commercialWorker.get('/invoices/:id', requirePermission('INVOICE_VIEW'), validateParams(uuidParamSchema), CommercialController.getInvoiceById);
commercialWorker.post('/invoices', requirePermission('INVOICE_CREATE'), validateBody(createInvoiceSchema), CommercialController.createInvoice);
commercialWorker.post('/invoices/:id/issue', requirePermission('INVOICE_ISSUE'), validateParams(uuidParamSchema), CommercialController.issueInvoice);
commercialWorker.post('/invoices/:id/generate-pdf', requirePermission('INVOICE_PDF_GENERATE'), validateParams(uuidParamSchema), PdfGenerationController.generateInvoicePdf);

// PURCHASE ORDERS
commercialWorker.get('/purchase-orders', requirePermission('PO_VIEW'), CommercialController.getPurchaseOrders);
commercialWorker.get('/purchase-orders/:id', requirePermission('PO_VIEW'), validateParams(uuidParamSchema), CommercialController.getPurchaseOrderById);
commercialWorker.post('/purchase-orders', requirePermission('PO_CREATE'), validateBody(createPurchaseOrderSchema), CommercialController.createPurchaseOrder);
commercialWorker.post('/purchase-orders/:id/issue', requirePermission('PO_ISSUE'), validateParams(uuidParamSchema), CommercialController.issuePurchaseOrder);
commercialWorker.post('/purchase-orders/:id/generate-pdf', requirePermission('PURCHASE_ORDER_PDF_GENERATE'), validateParams(uuidParamSchema), PdfGenerationController.generatePurchaseOrderPdf);

export { commercialWorker };
