import { query, queryOne, withTransaction } from '../db/client';

export class DocumentRepository {
    static async getDocuments(
        tenantId: string,
        orgId: string,
        filters: { requestId?: string; requestItemId?: string; documentType?: string; documentStatus?: string },
        limit: number,
        offset: number
    ) {
        let sql = `SELECT d.*, u.full_name as uploader_name
                   FROM documents d
                   LEFT JOIN user_profiles u ON d.uploaded_by = u.id
                   WHERE d.tenant_id = $1 AND d.organization_id = $2`;
        const params: any[] = [tenantId, orgId];

        if (filters.requestId) {
            params.push(filters.requestId);
            sql += ` AND d.request_id = $${params.length}`;
        }
        if (filters.requestItemId) {
            params.push(filters.requestItemId);
            sql += ` AND d.request_item_id = $${params.length}`;
        }
        if (filters.documentType) {
            params.push(filters.documentType);
            sql += ` AND d.document_type = $${params.length}`;
        }
        if (filters.documentStatus) {
            params.push(filters.documentStatus);
            sql += ` AND d.document_status = $${params.length}`;
        } else {
            // By default, exclude DELETED documents unless explicitly asked
            sql += ` AND d.document_status != 'DELETED'`;
        }

        sql += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const rows = await query(sql, params);

        let countSql = `SELECT count(*) FROM documents WHERE tenant_id = $1 AND organization_id = $2`;
        const countParams: any[] = [tenantId, orgId];
        if (filters.requestId) {
            countParams.push(filters.requestId);
            countSql += ` AND request_id = $${countParams.length}`;
        }
        if (filters.requestItemId) {
            countParams.push(filters.requestItemId);
            countSql += ` AND request_item_id = $${countParams.length}`;
        }
        if (filters.documentType) {
            countParams.push(filters.documentType);
            countSql += ` AND document_type = $${countParams.length}`;
        }
        if (filters.documentStatus) {
            countParams.push(filters.documentStatus);
            countSql += ` AND document_status = $${countParams.length}`;
        } else {
            countSql += ` AND document_status != 'DELETED'`;
        }

        const countRow = await queryOne<{ count: string }>(countSql, countParams);
        return { data: rows, total: parseInt(countRow?.count || '0', 10) };
    }

    static async getDocumentById(tenantId: string, orgId: string, id: string) {
        return queryOne(
            `SELECT d.*, u.full_name as uploader_name
             FROM documents d
             LEFT JOIN user_profiles u ON d.uploaded_by = u.id
             WHERE d.tenant_id = $1 AND d.organization_id = $2 AND d.id = $3`,
            [tenantId, orgId, id]
        );
    }

    static async createDocumentMetadata(tenantId: string, orgId: string, userId: string, data: any) {
        const ext = data.fileName.includes('.') ? data.fileName.split('.').pop() : null;

        return queryOne(
            `INSERT INTO documents (
                tenant_id, organization_id, request_id, request_item_id,
                document_type, file_name, file_extension, mime_type, file_size,
                storage_provider, storage_bucket, storage_key, document_status,
                uploaded_by, version, is_current, description
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
             RETURNING *`,
            [
                tenantId, orgId, data.requestId || null, data.requestItemId || null,
                data.documentType, data.fileName, ext, data.mimeType, data.fileSize,
                'CLOUDFLARE_R2', data.bucket || 'ccm-documents', data.storageKey,
                'ACTIVE', userId, data.version || 1, true, data.description || null
            ]
        );
    }

    static async replaceDocumentMetadata(
        tenantId: string,
        orgId: string,
        userId: string,
        existingDoc: any,
        newStorageKey: string,
        newDocData: any
    ) {
        return withTransaction(async (client) => {
            // 1. Mark existing document version as REPLACED and is_current = false
            await client.query(
                `UPDATE documents
                 SET document_status = 'REPLACED', is_current = false, updated_at = NOW()
                 WHERE tenant_id = $1 AND organization_id = $2 AND id = $3`,
                [tenantId, orgId, existingDoc.id]
            );

            // 2. Insert new version
            const newVersion = existingDoc.version + 1;
            const ext = newDocData.fileName.includes('.') ? newDocData.fileName.split('.').pop() : null;

            const res = await client.query(
                `INSERT INTO documents (
                    tenant_id, organization_id, request_id, request_item_id,
                    document_type, file_name, file_extension, mime_type, file_size,
                    storage_provider, storage_bucket, storage_key, document_status,
                    uploaded_by, version, is_current, description
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                 RETURNING *`,
                [
                    tenantId, orgId, existingDoc.request_id, existingDoc.request_item_id,
                    existingDoc.document_type, newDocData.fileName, ext, newDocData.mimeType, newDocData.fileSize,
                    'CLOUDFLARE_R2', 'ccm-documents', newStorageKey,
                    'ACTIVE', userId, newVersion, true, newDocData.description || existingDoc.description
                ]
            );

            return res.rows[0];
        });
    }

    static async updateDocumentStatus(tenantId: string, orgId: string, id: string, status: string, isCurrent?: boolean) {
        return queryOne(
            `UPDATE documents
             SET document_status = $4,
                 is_current = COALESCE($5, is_current),
                 updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *`,
            [tenantId, orgId, id, status, isCurrent ?? null]
        );
    }

    static async deleteDocumentMetadata(tenantId: string, orgId: string, id: string) {
        return queryOne(
            `UPDATE documents
             SET document_status = 'DELETED', is_current = false, updated_at = NOW()
             WHERE tenant_id = $1 AND organization_id = $2 AND id = $3
             RETURNING *`,
            [tenantId, orgId, id]
        );
    }
}
