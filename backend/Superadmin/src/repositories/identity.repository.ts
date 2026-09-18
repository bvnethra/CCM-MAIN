import { query, queryOne } from '../db/client';

export class IdentityRepository {
    static async getUsers(tenantId: string, orgId: string, limit: number, offset: number) {
        const rows = await query(
            `SELECT id, tenant_id, organization_id, auth_user_id, full_name, email, phone, status, created_at
             FROM user_profiles
             WHERE tenant_id = $1 AND organization_id = $2
             ORDER BY created_at DESC
             LIMIT $3 OFFSET $4`,
            [tenantId, orgId, limit, offset]
        );
        const countRow = await queryOne<{ count: string }>(
            `SELECT count(*) FROM user_profiles WHERE tenant_id = $1 AND organization_id = $2`,
            [tenantId, orgId]
        );
        return { data: rows, total: parseInt(countRow?.count || '0', 10) };
    }

    static async getRoles(tenantId: string) {
        return query(
            `SELECT id, name, code, description, is_system_role FROM roles WHERE tenant_id = $1 ORDER BY name`,
            [tenantId]
        );
    }

    static async getPermissions() {
        return query(
            `SELECT id, code, name, description, module FROM permissions ORDER BY module, code`
        );
    }
}
