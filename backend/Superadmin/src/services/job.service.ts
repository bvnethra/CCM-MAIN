import { Context } from 'hono';
import { UserSecurityContext } from '../types/context';
import { JobRepository } from '../repositories/job.repository';
import { JobQuerySchema, AsyncJobMessageSchema, AsyncJobMessage } from '../schemas/job.schema';
import { createAuditLog } from '../db/audit';
import { QueueConsumer } from '../consumers/queue.consumer';

export class JobService {
    static async getJobById(ctx: UserSecurityContext, id: string) {
        const job = await JobRepository.getJobById(ctx.tenantId, ctx.organizationId, id);
        if (!job) {
            throw new Error(`RESOURCE_NOT_FOUND: Async job with ID '${id}' not found`);
        }
        return this.formatJobResponse(job);
    }

    static async getJobs(ctx: UserSecurityContext, queryParams: any) {
        const validated = JobQuerySchema.parse(queryParams);
        const page = parseInt(validated.page || '1', 10);
        const limit = parseInt(validated.limit || '20', 10);
        const offset = (page - 1) * limit;

        const filters = {
            status: validated.status,
            jobType: validated.jobType,
            entityType: validated.entityType,
            entityId: validated.entityId
        };

        const { data, total } = await JobRepository.getJobs(
            ctx.tenantId,
            ctx.organizationId,
            filters,
            limit,
            offset
        );

        return {
            items: data.map(j => this.formatJobResponse(j)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async cancelJob(ctx: UserSecurityContext, c: Context | null, id: string) {
        const job = await JobRepository.getJobById(ctx.tenantId, ctx.organizationId, id);
        if (!job) {
            throw new Error(`RESOURCE_NOT_FOUND: Async job with ID '${id}' not found`);
        }

        if (job.status === 'COMPLETED') {
            throw new Error('BUSINESS_VALIDATION_ERROR: Cannot cancel an async job that has already completed');
        }

        if (job.status !== 'QUEUED') {
            throw new Error(`BUSINESS_VALIDATION_ERROR: Only jobs in QUEUED status can be cancelled. Current status is '${job.status}'`);
        }

        const cancelledJob = await JobRepository.cancelJob(ctx.tenantId, ctx.organizationId, id);

        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'ASYNC_JOB_CANCELLED',
            entityType: job.entity_type,
            entityId: job.entity_id,
            newData: { jobId: id, previousStatus: job.status, newStatus: 'CANCELLED' }
        });

        return this.formatJobResponse(cancelledJob);
    }

    static async retryJob(ctx: UserSecurityContext, c: Context | null, id: string) {
        const job = await JobRepository.getJobById(ctx.tenantId, ctx.organizationId, id);
        if (!job) {
            throw new Error(`RESOURCE_NOT_FOUND: Async job with ID '${id}' not found`);
        }

        if (job.status === 'COMPLETED') {
            throw new Error('BUSINESS_VALIDATION_ERROR: Cannot retry a completed job. Use specific document generation endpoint for regeneration.');
        }

        if (job.status !== 'FAILED') {
            throw new Error(`BUSINESS_VALIDATION_ERROR: Only jobs in FAILED status can be retried. Current status is '${job.status}'`);
        }

        const retriedJob = await JobRepository.retryJob(ctx.tenantId, ctx.organizationId, id);

        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'ASYNC_JOB_RETRIED',
            entityType: job.entity_type,
            entityId: job.entity_id,
            newData: { jobId: id, previousStatus: 'FAILED', newStatus: 'QUEUED' }
        });

        // Re-dispatch queue payload
        const createdAtStr = retriedJob.created_at instanceof Date ? retriedJob.created_at.toISOString() : String(retriedJob.created_at);
        const payload: AsyncJobMessage = AsyncJobMessageSchema.parse({
            jobId: retriedJob.id,
            jobType: retriedJob.job_type,
            tenantId: retriedJob.tenant_id,
            organizationId: retriedJob.organization_id,
            entityId: retriedJob.entity_id,
            requestedBy: ctx.userId,
            createdAt: createdAtStr
        });

        if (c?.env?.CALIBRATION_JOBS_QUEUE && typeof c.env.CALIBRATION_JOBS_QUEUE.send === 'function') {
            await c.env.CALIBRATION_JOBS_QUEUE.send(payload);
        } else {
            setTimeout(() => {
                QueueConsumer.processQueueMessage(payload).catch((err: any) => {
                    console.error(`[QueueConsumer] Retry background processing error for job ${retriedJob.id}:`, err);
                });
            }, 50);
        }

        return this.formatJobResponse(retriedJob);
    }

    private static formatJobResponse(job: any) {
        return {
            jobId: job.id,
            jobType: job.job_type,
            entityType: job.entity_type,
            entityId: job.entity_id,
            status: job.status,
            attemptCount: job.attempt_count,
            maxAttempts: job.max_attempts,
            requestedBy: job.requested_by,
            requestedByName: job.requested_by_name || null,
            startedAt: job.started_at,
            completedAt: job.completed_at,
            failedAt: job.failed_at,
            errorCode: job.error_code || null,
            errorMessage: job.error_message || null,
            resultMetadata: job.result_metadata || null,
            createdAt: job.created_at,
            updatedAt: job.updated_at
        };
    }
}
