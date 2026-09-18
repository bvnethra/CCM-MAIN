import { Context } from 'hono';
import { queryOne, query } from '../db/client';
import { UserSecurityContext } from '../types/context';
import { PdfGeneratorService } from './pdf-generator.service';
import { R2StorageService } from '../utils/r2';
import { DocumentRepository } from '../repositories/document.repository';
import { DocumentService } from './document.service';
import { createAuditLog } from '../db/audit';
import { renderCalibrationCertificateHtml } from '../templates/certificate.template';
import { renderQuotationHtml } from '../templates/quotation.template';
import { renderInvoiceHtml } from '../templates/invoice.template';
import { renderPurchaseOrderHtml } from '../templates/purchase-order.template';

export class PdfDocumentService {
    // 1. CALIBRATION CERTIFICATE PDF GENERATION
    static async generateCalibrationCertificatePdf(ctx: UserSecurityContext, c: Context | null, certificateId: string) {
        // Fetch Certificate + Calibration + Item + Measurements data from DB
        const cert = await queryOne(
            `SELECT cert.*,
                    c.calibration_number, c.calibration_date, c.result as calibration_result, c.remarks as cal_remarks, c.calibration_frequency, c.next_due_date,
                    cr.request_number, cr.id as request_id,
                    ri.id as request_item_id, im.serial_number,
                    im.item_name, im.item_code,
                    cl.client_name, cl.email as client_email,
                    org.name as org_name, org.address as org_address, org.phone as org_phone, org.email as org_email
             FROM certificates cert
             JOIN calibrations c ON cert.calibration_id = c.id
             JOIN request_items ri ON c.request_item_id = ri.id
             JOIN item_masters im ON ri.item_master_id = im.id
             JOIN calibration_requests cr ON c.request_id = cr.id
             JOIN clients cl ON cr.client_id = cl.id
             JOIN organizations org ON cert.organization_id = org.id
             WHERE cert.tenant_id = $1 AND cert.organization_id = $2 AND cert.id = $3`,
            [ctx.tenantId, ctx.organizationId, certificateId]
        );

        if (!cert) throw new Error('RESOURCE_NOT_FOUND: Calibration certificate record not found');

        const measurements = await query(
            `SELECT * FROM calibration_measurements WHERE calibration_id = $1 ORDER BY created_at ASC`,
            [cert.calibration_id]
        );

        const certData = {
            organizationName: cert.org_name,
            organizationAddress: cert.org_address,
            organizationPhone: cert.org_phone,
            organizationEmail: cert.org_email,
            certificateNumber: cert.certificate_number,
            certificateDate: cert.issued_date || cert.created_at,
            clientName: cert.client_name,
            clientEmail: cert.client_email,
            requestNumber: cert.request_number,
            itemName: cert.item_name,
            itemCode: cert.item_code,
            serialNumber: cert.serial_number,
            calibrationDate: cert.calibration_date,
            calibrationResult: cert.calibration_result,
            calibrationFrequencyDays: cert.calibration_frequency,
            nextDueDate: cert.next_due_date,
            measurements: measurements.map(m => ({
                parameterName: m.parameter_name,
                nominalValue: Number(m.nominal_value),
                measuredValue: Number(m.measured_value),
                unit: m.unit,
                toleranceMin: m.tolerance_min !== null ? Number(m.tolerance_min) : undefined,
                toleranceMax: m.tolerance_max !== null ? Number(m.tolerance_max) : undefined,
                result: m.result
            })),
            remarks: cert.remarks || cert.cal_remarks
        };

        const html = renderCalibrationCertificateHtml(certData);
        const pdfBuffer = await PdfGeneratorService.generatePdfFromHtml(html);

        const fileName = `CAL-CERT-${cert.certificate_number}.pdf`;
        return this.saveGeneratedPdfToR2AndDb(
            ctx,
            c,
            cert.request_id,
            cert.request_item_id,
            'CALIBRATION_CERTIFICATE',
            fileName,
            pdfBuffer,
            `Calibration Certificate PDF for ${cert.certificate_number}`
        );
    }

    // 2. COMMERCIAL QUOTATION PDF GENERATION
    static async generateQuotationPdf(ctx: UserSecurityContext, c: Context | null, quotationId: string) {
        const q = await queryOne(
            `SELECT q.*,
                    cr.request_number, cr.id as request_id,
                    cl.client_name, cl.email as client_email,
                    org.name as org_name, org.address as org_address, org.phone as org_phone, org.email as org_email
             FROM quotations q
             JOIN calibration_requests cr ON q.request_id = cr.id
             JOIN clients cl ON q.client_id = cl.id
             JOIN organizations org ON q.organization_id = org.id
             WHERE q.tenant_id = $1 AND q.organization_id = $2 AND q.id = $3`,
            [ctx.tenantId, ctx.organizationId, quotationId]
        );

        if (!q) throw new Error('RESOURCE_NOT_FOUND: Quotation record not found');

        const items = await query(
            `SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY created_at ASC`,
            [quotationId]
        );

        const quotData = {
            organizationName: q.org_name,
            organizationAddress: q.org_address,
            organizationPhone: q.org_phone,
            organizationEmail: q.org_email,
            quotationNumber: q.quotation_number,
            quotationStatus: q.quotation_status,
            quotationDate: q.created_at,
            validUntil: q.valid_until,
            clientName: q.client_name,
            clientEmail: q.client_email,
            requestNumber: q.request_number,
            items: items.map(i => ({
                description: i.description,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unit_price),
                taxRate: Number(i.tax_rate),
                taxAmount: Number(i.tax_amount),
                lineTotal: Number(i.line_total)
            })),
            subtotal: Number(q.subtotal),
            taxAmount: Number(q.tax_amount),
            discountAmount: Number(q.discount_amount),
            totalAmount: Number(q.total_amount),
            termsAndConditions: q.terms_and_conditions,
            notes: q.notes
        };

        const html = renderQuotationHtml(quotData);
        const pdfBuffer = await PdfGeneratorService.generatePdfFromHtml(html);

        const fileName = `QUOTATION-${q.quotation_number}.pdf`;
        return this.saveGeneratedPdfToR2AndDb(
            ctx,
            c,
            q.request_id,
            null,
            'QUOTATION_DOCUMENT',
            fileName,
            pdfBuffer,
            `Commercial Quotation PDF for ${q.quotation_number}`
        );
    }

    // 3. COMMERCIAL INVOICE PDF GENERATION
    static async generateInvoicePdf(ctx: UserSecurityContext, c: Context | null, invoiceId: string) {
        const inv = await queryOne(
            `SELECT i.*,
                    cr.request_number, cr.id as request_id,
                    q.quotation_number,
                    cl.client_name, cl.email as client_email,
                    org.name as org_name, org.address as org_address, org.phone as org_phone, org.email as org_email
             FROM invoices i
             JOIN calibration_requests cr ON i.request_id = cr.id
             LEFT JOIN quotations q ON i.quotation_id = q.id
             JOIN clients cl ON i.client_id = cl.id
             JOIN organizations org ON i.organization_id = org.id
             WHERE i.tenant_id = $1 AND i.organization_id = $2 AND i.id = $3`,
            [ctx.tenantId, ctx.organizationId, invoiceId]
        );

        if (!inv) throw new Error('RESOURCE_NOT_FOUND: Invoice record not found');

        const items = await query(
            `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at ASC`,
            [invoiceId]
        );

        const invData = {
            organizationName: inv.org_name,
            organizationAddress: inv.org_address,
            organizationPhone: inv.org_phone,
            organizationEmail: inv.org_email,
            invoiceNumber: inv.invoice_number,
            invoiceStatus: inv.invoice_status,
            invoiceDate: inv.invoice_date || inv.created_at,
            dueDate: inv.due_date,
            clientName: inv.client_name,
            clientEmail: inv.client_email,
            requestNumber: inv.request_number,
            quotationNumber: inv.quotation_number,
            items: items.map(i => ({
                description: i.description,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unit_price),
                taxRate: Number(i.tax_rate),
                taxAmount: Number(i.tax_amount),
                lineTotal: Number(i.line_total)
            })),
            subtotal: Number(inv.subtotal),
            taxAmount: Number(inv.tax_amount),
            discountAmount: Number(inv.discount_amount),
            totalAmount: Number(inv.total_amount),
            paidAmount: Number(inv.paid_amount || 0),
            balanceAmount: Number(inv.balance_amount || inv.total_amount),
            notes: inv.notes
        };

        const html = renderInvoiceHtml(invData);
        const pdfBuffer = await PdfGeneratorService.generatePdfFromHtml(html);

        const fileName = `INVOICE-${inv.invoice_number}.pdf`;
        return this.saveGeneratedPdfToR2AndDb(
            ctx,
            c,
            inv.request_id,
            null,
            'INVOICE_DOCUMENT',
            fileName,
            pdfBuffer,
            `Commercial Invoice PDF for ${inv.invoice_number}`
        );
    }

    // 4. PURCHASE ORDER PDF GENERATION
    static async generatePurchaseOrderPdf(ctx: UserSecurityContext, c: Context | null, poId: string) {
        const po = await queryOne(
            `SELECT po.*,
                    cr.request_number, cr.id as request_id,
                    q.quotation_number,
                    cl.client_name, cl.email as client_email,
                    org.name as org_name, org.address as org_address, org.phone as org_phone, org.email as org_email
             FROM purchase_orders po
             JOIN calibration_requests cr ON po.request_id = cr.id
             LEFT JOIN quotations q ON po.quotation_id = q.id
             JOIN clients cl ON po.client_id = cl.id
             JOIN organizations org ON po.organization_id = org.id
             WHERE po.tenant_id = $1 AND po.organization_id = $2 AND po.id = $3`,
            [ctx.tenantId, ctx.organizationId, poId]
        );

        if (!po) throw new Error('RESOURCE_NOT_FOUND: Purchase Order record not found');

        const items = await query(
            `SELECT * FROM po_items WHERE purchase_order_id = $1 ORDER BY created_at ASC`,
            [poId]
        );

        const poData = {
            organizationName: po.org_name,
            organizationAddress: po.org_address,
            organizationPhone: po.org_phone,
            organizationEmail: po.org_email,
            poNumber: po.po_number,
            poStatus: po.po_status,
            poDate: po.po_date || po.created_at,
            expectedDeliveryDate: po.expected_delivery_date,
            clientName: po.client_name,
            clientEmail: po.client_email,
            requestNumber: po.request_number,
            quotationNumber: po.quotation_number,
            items: items.map(i => ({
                description: i.description,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unit_price),
                taxRate: Number(i.tax_rate),
                taxAmount: Number(i.tax_amount),
                lineTotal: Number(i.line_total)
            })),
            subtotal: Number(po.subtotal),
            taxAmount: Number(po.tax_amount),
            discountAmount: Number(po.discount_amount),
            totalAmount: Number(po.total_amount),
            notes: po.notes
        };

        const html = renderPurchaseOrderHtml(poData);
        const pdfBuffer = await PdfGeneratorService.generatePdfFromHtml(html);

        const fileName = `PO-${po.po_number}.pdf`;
        return this.saveGeneratedPdfToR2AndDb(
            ctx,
            c,
            po.request_id,
            null,
            'PURCHASE_ORDER_DOCUMENT',
            fileName,
            pdfBuffer,
            `Purchase Order PDF for ${po.po_number}`
        );
    }

    // HELPER: Save compiled PDF to Cloudflare R2 and update PostgreSQL document versioning
    private static async saveGeneratedPdfToR2AndDb(
        ctx: UserSecurityContext,
        c: Context | null,
        requestId: string,
        requestItemId: string | null,
        documentType: string,
        fileName: string,
        pdfBuffer: Buffer,
        description: string
    ) {
        // Check if an existing version of this document exists
        const existingDocs = await DocumentRepository.getDocuments(
            ctx.tenantId,
            ctx.organizationId,
            { requestId: requestId || undefined, requestItemId: requestItemId || undefined, documentType },
            1,
            0
        );

        const existingDoc = existingDocs.data?.[0];

        if (existingDoc && existingDoc.is_current) {
            // Version Replacement Flow (regenerates PDF as Version N+1)
            const input = {
                fileName,
                mimeType: 'application/pdf',
                fileSize: pdfBuffer.length,
                fileContentBase64: pdfBuffer.toString('base64'),
                description: `${description} (v${existingDoc.version + 1})`
            };
            return DocumentService.replaceDocument(ctx, c, existingDoc.id, input);
        } else {
            // Initial Generation Flow
            const input = {
                requestId,
                requestItemId: requestItemId || undefined,
                documentType,
                fileName,
                mimeType: 'application/pdf',
                fileSize: pdfBuffer.length,
                fileContentBase64: pdfBuffer.toString('base64'),
                description
            };
            return DocumentService.uploadDocument(ctx, c, input);
        }
    }
}
