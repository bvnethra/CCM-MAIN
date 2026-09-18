import { Context } from 'hono';
import { UserSecurityContext } from '../types/context';
import { JobRepository } from '../repositories/job.repository';
import { AsyncJobMessageSchema, AsyncJobMessage } from '../schemas/job.schema';
import { createAuditLog } from '../db/audit';
import { QueueConsumer } from '../consumers/queue.consumer';

export class QueueProducerService {
    static async enqueueJob(
        ctx: UserSecurityContext,
        c: Context | null,
        jobType: string,
        entityType: string,
        entityId: string
    ) {
        // 1. Create async_jobs database record
        const job = await JobRepository.createJob(
            ctx.tenantId,
            ctx.organizationId,
            ctx.userId,
            { jobType, entityType, entityId }
        );

        if (!job) {
            throw new Error('DATABASE_ERROR: Failed to create async job record');
        }

        // 2. Build and validate queue payload
        const createdAtStr = job.created_at instanceof Date ? job.created_at.toISOString() : String(job.created_at);
        const payload: AsyncJobMessage = AsyncJobMessageSchema.parse({
            jobId: job.id,
            jobType: job.job_type,
            tenantId: job.tenant_id,
            organizationId: job.organization_id,
            entityId: job.entity_id,
            requestedBy: job.requested_by,
            createdAt: createdAtStr
        });

        // 3. Log Audit Trail event for job creation
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'ASYNC_JOB_CREATED',
            entityType,
            entityId,
            newData: { jobId: job.id, jobType: job.job_type, status: job.status }
        });

        // 4. Publish message to Cloudflare Queue (or async background dispatcher)
        if (c?.env?.CALIBRATION_JOBS_QUEUE && typeof c.env.CALIBRATION_JOBS_QUEUE.send === 'function') {
            await c.env.CALIBRATION_JOBS_QUEUE.send(payload);
        } else {
            // Local dev / Node.js test async execution
            setTimeout(() => {
                QueueConsumer.processQueueMessage(payload).catch((err: any) => {
                    console.error(`[QueueConsumer] Background processing error for job ${job.id}:`, err);
                });
            }, 50);
        }

        return {
            jobId: job.id,
            status: job.status
        };
    }
}
