import { queryOne } from './client';

export interface AuditLogInput {
    tenantId: string;
    organizationId: string;
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldData?: any;
    newData?: any;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
    try {
        await queryOne(
            `INSERT INTO audit_logs (
                tenant_id, organization_id, user_id, action, entity_type, entity_id, old_data, new_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                input.tenantId,
                input.organizationId,
                input.userId || null,
                input.action,
                input.entityType,
                input.entityId || null,
                input.oldData ? JSON.stringify(input.oldData) : null,
                input.newData ? JSON.stringify(input.newData) : null
            ]
        );
    } catch (err: any) {
        console.error('Audit log creation failed:', err.message);
    }
}
