import { AsyncJobMessage } from '../schemas/job.schema';
import { JobRepository } from '../repositories/job.repository';
import { PdfDocumentService } from '../services/pdf-document.service';
import { UserSecurityContext } from '../types/context';
import { createAuditLog } from '../db/audit';

export class PdfGenerationWorkflow {
    static async executePdfGenerationWorkflow(message: AsyncJobMessage) {
        // 1. Retrieve job from PostgreSQL
        const job = await JobRepository.getJobByIdUnscoped(message.jobId);
        if (!job) {
            throw new Error(`ASYNC_JOB_NOT_FOUND: Job with ID ${message.jobId} does not exist`);
        }

        // 2. Idempotency Check: Do not re-process completed or cancelled jobs
        if (job.status === 'COMPLETED') {
            console.log(`[PdfGenerationWorkflow] Job ${job.id} is already COMPLETED. Skipping.`);
            return job;
        }

        if (job.status === 'CANCELLED') {
            console.log(`[PdfGenerationWorkflow] Job ${job.id} is CANCELLED. Skipping.`);
            return job;
        }

        // 3. Increment attempt count and mark status as PROCESSING
        const currentAttempt = (job.attempt_count || 0) + 1;
        await JobRepository.updateJobStatus(job.id, 'PROCESSING', {
            startedAt: new Date(),
            attemptCount: currentAttempt
        });

        await createAuditLog({
            tenantId: job.tenant_id,
            organizationId: job.organization_id,
            userId: job.requested_by,
            action: 'WORKFLOW_STARTED',
            entityType: job.entity_type,
            entityId: job.entity_id,
            newData: { jobId: job.id, jobType: job.job_type, attemptCount: currentAttempt }
        });

        // 4. Construct privileged system user context for workflow execution
        const userCtx: UserSecurityContext = {
            userId: job.requested_by,
            tenantId: job.tenant_id,
            organizationId: job.organization_id,
            roles: ['ADMIN'],
            permissions: [
                'DOCUMENT_CREATE',
                'CERTIFICATE_GENERATE',
                'QUOTATION_PDF_GENERATE',
                'INVOICE_PDF_GENERATE',
                'PURCHASE_ORDER_PDF_GENERATE'
            ]
        };

        try {
            let docResult: any;

            // 5. Execute document generation based on job_type
            switch (job.job_type) {
                case 'GENERATE_CALIBRATION_CERTIFICATE':
                    docResult = await PdfDocumentService.generateCalibrationCertificatePdf(userCtx, null, job.entity_id);
                    break;
                case 'GENERATE_QUOTATION_PDF':
                    docResult = await PdfDocumentService.generateQuotationPdf(userCtx, null, job.entity_id);
                    break;
                case 'GENERATE_INVOICE_PDF':
                    docResult = await PdfDocumentService.generateInvoicePdf(userCtx, null, job.entity_id);
                    break;
                case 'GENERATE_PURCHASE_ORDER_PDF':
                    docResult = await PdfDocumentService.generatePurchaseOrderPdf(userCtx, null, job.entity_id);
                    break;
                default:
                    throw new Error(`UNKNOWN_JOB_TYPE: Job type '${job.job_type}' is not supported`);
            }

            // 6. On success: Mark job as COMPLETED
            const completedJob = await JobRepository.updateJobStatus(job.id, 'COMPLETED', {
                completedAt: new Date(),
                resultMetadata: {
                    documentId: docResult.id,
                    fileName: docResult.file_name,
                    storageKey: docResult.storage_key,
                    version: docResult.version
                }
            });

            await createAuditLog({
                tenantId: job.tenant_id,
                organizationId: job.organization_id,
                userId: job.requested_by,
                action: 'WORKFLOW_COMPLETED',
                entityType: job.entity_type,
                entityId: job.entity_id,
                newData: { jobId: job.id, documentId: docResult.id, fileName: docResult.file_name }
            });

            await createAuditLog({
                tenantId: job.tenant_id,
                organizationId: job.organization_id,
                userId: job.requested_by,
                action: 'ASYNC_JOB_COMPLETED',
                entityType: job.entity_type,
                entityId: job.entity_id,
                newData: { jobId: job.id, status: 'COMPLETED' }
            });

            return completedJob;

        } catch (err: any) {
            console.error(`[PdfGenerationWorkflow] Error processing job ${job.id} (attempt ${currentAttempt}/${job.max_attempts}):`, err.message);

            const isMaxAttempts = currentAttempt >= job.max_attempts;
            const newStatus = isMaxAttempts ? 'FAILED' : 'QUEUED';

            const updatedJob = await JobRepository.updateJobStatus(job.id, newStatus, {
                failedAt: isMaxAttempts ? new Date() : undefined,
                errorCode: 'WORKFLOW_EXECUTION_FAILED',
                errorMessage: err.message || 'Unknown error occurred during PDF generation workflow'
            });

            await createAuditLog({
                tenantId: job.tenant_id,
                organizationId: job.organization_id,
                userId: job.requested_by,
                action: isMaxAttempts ? 'WORKFLOW_FAILED' : 'WORKFLOW_RETRYING',
                entityType: job.entity_type,
                entityId: job.entity_id,
                newData: { jobId: job.id, attemptCount: currentAttempt, maxAttempts: job.max_attempts, error: err.message }
            });

            if (isMaxAttempts) {
                await createAuditLog({
                    tenantId: job.tenant_id,
                    organizationId: job.organization_id,
                    userId: job.requested_by,
                    action: 'ASYNC_JOB_FAILED',
                    entityType: job.entity_type,
                    entityId: job.entity_id,
                    newData: { jobId: job.id, status: 'FAILED', error: err.message }
                });
            }

            if (!isMaxAttempts) {
                throw err;
            }

            return updatedJob;
        }
    }
}
