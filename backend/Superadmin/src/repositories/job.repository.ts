import { query, queryOne } from '../db/client';

export interface CreateJobDTO {
    jobType: string;
    entityType: string;
    entityId: string;
    maxAttempts?: number;
}

export class JobRepository {
    static async createJob(tenantId: string, orgId: string, userId: string, data: CreateJobDTO) {
        return queryOne(
            `INSERT INTO async_jobs (
                tenant_id, organization_id, job_type, entity_type, entity_id,
                status, max_attempts, requested_by
             ) VALUES ($1, $2, $3, $4, $5, 'QUEUED', $6, $7)
             RETURNING *`,
            [
                tenantId,
                orgId,
                data.jobType,
                data.entityType,
                data.entityId,
                data.maxAttempts || 3,
                userId
            ]
        );
    }

    static async getJobById(tenantId: string, orgId: string, id: string) {
        return queryOne(
            `SELECT j.*, u.full_name as requested_by_name
             FROM async_jobs j
             LEFT JOIN user_profiles u ON j.requested_by = u.id
             WHERE j.tenant_id = $1 AND j.organization_id = $2 AND j.id = $3`,
            [tenantId, orgId, id]
        );
    }

    static async getJobByIdUnscoped(id: string) {
        return queryOne(
            `SELECT j.*, u.full_name as requested_by_name
             FROM async_jobs j
             LEFT JOIN user_profiles u ON j.requested_by = u.id
             WHERE j.id = $1`,
            [id]
        );
    }

    static async getJobs(
        tenantId: string,
        orgId: string,
        filters: { status?: string; jobType?: string; entityType?: string; entityId?: string },
        limit: number,
        offset: number
    ) {
        let sql = `SELECT j.*, u.full_name as requested_by_name
                   FROM async_jobs j
                   LEFT JOIN user_profiles u ON j.requested_by = u.id
                   WHERE j.tenant_id = $1 AND j.organization_id = $2`;
        const params: any[] = [tenantId, orgId];

        if (filters.status) {
            params.push(filters.status);
            sql += ` AND j.status = $${params.length}`;
        }
        if (filters.jobType) {
            params.push(filters.jobType);
            sql += ` AND j.job_type = $${params.length}`;
        }
        if (filters.entityType) {
            params.push(filters.entityType);
            sql += ` AND j.entity_type = $${params.length}`;
        }
        if (filters.entityId) {
            params.push(filters.entityId);
            sql += ` AND j.entity_id = $${params.length}`;
        }

        sql += ` ORDER BY j.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const rows = await query(sql, params);

        let countSql = `SELECT count(*) FROM async_jobs WHERE tenant_id = $1 AND organization_id = $2`;
        const countParams: any[] = [tenantId, orgId];
        if (filters.status) {
            countParams.push(filters.status);
            countSql += ` AND status = $${countParams.length}`;
        }
        if (filters.jobType) {
            countParams.push(filters.jobType);
            countSql += ` AND job_type = $${countParams.length}`;
        }
        if (filters.entityType) {
            countParams.push(filters.entityType);
            countSql += ` AND entity_type = $${countParams.length}`;
        }
        if (filters.entityId) {
            countParams.push(filters.entityId);
            countSql += ` AND entity_id = $${countParams.length}`;
        }

        const countRow = await queryOne<{ count: string }>(countSql, countParams);
        return { data: rows, total: parseInt(countRow?.count || '0', 10) };
    }

    static async updateJobStatus(
        id: string,
        status: string,
        details: {
            startedAt?: Date;
            completedAt?: Date;
            failedAt?: Date;
            errorCode?: string;
            errorMessage?: string;
            resultMetadata?: any;
            attemptCount?: number;
        } = {}
    ) {
        return queryOne(
            `UPDATE async_jobs
             SET status = $2,
                 started_at = COALESCE($3, started_at),
                 completed_at = COALESCE($4, completed_at),
                 failed_at = COALESCE($5, failed_at),
                 error_code = COALESCE($6, error_code),
                 error_message = COALESCE($7, error_message),
                 result_metadata = COALESCE($8, result_metadata),
                 attempt_count = COALESCE($9, attempt_count),
                 updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [
                id,
                status,
                details.startedAt || null,
                details.completedAt || null,
                details.failedAt || null,
                details.errorCode || null,
                details.errorMessage || null,
                details.resultMetadata ? JSON.stringify(details.resultMetadata) : null,
                details.attemptCount ?? null
            ]
        );
    }

    static async cancelJob(tenantId: string, orgId: string, id: string) {
        return queryOne(
            `UPDATE async_jobs
             SET status = 'CANCELLED', updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3 AND status = 'QUEUED'
             RETURNING *`,
            [tenantId, orgId, id]
        );
    }

    static async retryJob(tenantId: string, orgId: string, id: string) {
        return queryOne(
            `UPDATE async_jobs
             SET status = 'QUEUED',
                 started_at = NULL,
                 completed_at = NULL,
                 failed_at = NULL,
                 error_code = NULL,
                 error_message = NULL,
                 updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3 AND status = 'FAILED'
             RETURNING *`,
            [tenantId, orgId, id]
        );
    }
}
