import { Context } from 'hono';
import { QueueProducerService } from '../services/queue-producer.service';
import { getUserContext } from '../middleware/auth.middleware';
import { queryOne } from '../db/client';

export class PdfGenerationController {
    static async generateCalibrationCertificatePdf(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;

        // Verify entity exists within caller's tenant boundary before enqueueing job
        const cert = await queryOne(
            `SELECT id FROM certificates WHERE tenant_id = $1 AND organization_id = $2 AND id = $3`,
            [userCtx.tenantId, userCtx.organizationId, id]
        );
        if (!cert) {
            throw new Error(`RESOURCE_NOT_FOUND: Calibration certificate '${id}' not found`);
        }

        const jobResult = await QueueProducerService.enqueueJob(
            userCtx,
            c,
            'GENERATE_CALIBRATION_CERTIFICATE',
            'CERTIFICATE',
            id
        );
        return c.json({
            success: true,
            data: {
                jobId: jobResult.jobId,
                status: jobResult.status
            }
        }, 202);
    }

    static async generateQuotationPdf(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;

        const q = await queryOne(
            `SELECT id FROM quotations WHERE tenant_id = $1 AND organization_id = $2 AND id = $3`,
            [userCtx.tenantId, userCtx.organizationId, id]
        );
        if (!q) {
            throw new Error(`RESOURCE_NOT_FOUND: Quotation '${id}' not found`);
        }

        const jobResult = await QueueProducerService.enqueueJob(
            userCtx,
            c,
            'GENERATE_QUOTATION_PDF',
            'QUOTATION',
            id
        );
        return c.json({
            success: true,
            data: {
                jobId: jobResult.jobId,
                status: jobResult.status
            }
        }, 202);
    }

    static async generateInvoicePdf(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;

        const inv = await queryOne(
            `SELECT id FROM invoices WHERE tenant_id = $1 AND organization_id = $2 AND id = $3`,
            [userCtx.tenantId, userCtx.organizationId, id]
        );
        if (!inv) {
            throw new Error(`RESOURCE_NOT_FOUND: Invoice '${id}' not found`);
        }

        const jobResult = await QueueProducerService.enqueueJob(
            userCtx,
            c,
            'GENERATE_INVOICE_PDF',
            'INVOICE',
            id
        );
        return c.json({
            success: true,
            data: {
                jobId: jobResult.jobId,
                status: jobResult.status
            }
        }, 202);
    }

    static async generatePurchaseOrderPdf(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;

        const po = await queryOne(
            `SELECT id FROM purchase_orders WHERE tenant_id = $1 AND organization_id = $2 AND id = $3`,
            [userCtx.tenantId, userCtx.organizationId, id]
        );
        if (!po) {
            throw new Error(`RESOURCE_NOT_FOUND: Purchase Order '${id}' not found`);
        }

        const jobResult = await QueueProducerService.enqueueJob(
            userCtx,
            c,
            'GENERATE_PURCHASE_ORDER_PDF',
            'PURCHASE_ORDER',
            id
        );
        return c.json({
            success: true,
            data: {
                jobId: jobResult.jobId,
                status: jobResult.status
            }
        }, 202);
    }
}
