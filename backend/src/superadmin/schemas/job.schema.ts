import { z } from 'zod';

export const ALLOWED_JOB_TYPES = [
    'GENERATE_CALIBRATION_CERTIFICATE',
    'GENERATE_QUOTATION_PDF',
    'GENERATE_INVOICE_PDF',
    'GENERATE_PURCHASE_ORDER_PDF'
] as const;

export const ALLOWED_ENTITY_TYPES = [
    'CERTIFICATE',
    'QUOTATION',
    'INVOICE',
    'PURCHASE_ORDER'
] as const;

export const ALLOWED_JOB_STATUSES = [
    'QUEUED',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
] as const;

export const AsyncJobMessageSchema = z.object({
    jobId: z.string().uuid('Invalid jobId UUID'),
    jobType: z.enum(ALLOWED_JOB_TYPES),
    tenantId: z.string().uuid('Invalid tenantId UUID'),
    organizationId: z.string().uuid('Invalid organizationId UUID'),
    entityId: z.string().uuid('Invalid entityId UUID'),
    requestedBy: z.string().uuid('Invalid requestedBy user UUID'),
    createdAt: z.string()
});

export type AsyncJobMessage = z.infer<typeof AsyncJobMessageSchema>;

export const JobQuerySchema = z.object({
    status: z.enum(ALLOWED_JOB_STATUSES).optional(),
    jobType: z.enum(ALLOWED_JOB_TYPES).optional(),
    entityType: z.enum(ALLOWED_ENTITY_TYPES).optional(),
    entityId: z.string().uuid().optional(),
    page: z.string().optional(),
    limit: z.string().optional()
});

export const CancelJobSchema = z.object({
    reason: z.string().optional()
});

export const RetryJobSchema = z.object({
    force: z.boolean().optional()
});
