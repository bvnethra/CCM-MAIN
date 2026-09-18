import { JobRepository } from '../repositories/job.repository';
import { AsyncJobMessage } from '../schemas/job.schema';
import { createAuditLog } from '../db/audit';

export class QueueConsumer {
    static async processQueueMessage(payload: AsyncJobMessage): Promise<void> {
        const { jobId, tenantId, organizationId, requestedBy, jobType, entityId } = payload;
        const entityType = jobType.replace('GENERATE_', '').replace('_PDF', '');
        
        try {
            // Mark job as PROCESSING
            await JobRepository.updateJobStatus(jobId, 'PROCESSING', {
                startedAt: new Date(),
                attemptCount: 1
            });

            // Simulate execution of job based on jobType
            await new Promise(resolve => setTimeout(resolve, 100));

            // Mark job as COMPLETED
            await JobRepository.updateJobStatus(jobId, 'COMPLETED', {
                completedAt: new Date(),
                resultMetadata: { message: `Job ${jobType} completed successfully`, entityType, entityId }
            });

            await createAuditLog({
                tenantId,
                organizationId,
                userId: requestedBy,
                action: 'ASYNC_JOB_COMPLETED',
                entityType,
                entityId,
                newData: { jobId, jobType, status: 'COMPLETED' }
            });
        } catch (err: any) {
            console.error(`[QueueConsumer] Failed to process job ${jobId}:`, err);
            await JobRepository.updateJobStatus(jobId, 'FAILED', {
                failedAt: new Date(),
                errorCode: 'PROCESSING_ERROR',
                errorMessage: err.message || 'Unknown processing error'
            });

            await createAuditLog({
                tenantId,
                organizationId,
                userId: requestedBy,
                action: 'ASYNC_JOB_FAILED',
                entityType,
                entityId,
                newData: { jobId, jobType, status: 'FAILED', error: err.message }
            });
        }
    }
}
