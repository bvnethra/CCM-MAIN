import { Context } from 'hono';
import { DocumentRepository } from '../repositories/document.repository';
import { R2StorageService } from '../utils/r2';
import { UserSecurityContext } from '../types/context';
import { createAuditLog } from '../db/audit';
import { queryOne } from '../db/client';

export class DocumentService {
    static async uploadDocument(ctx: UserSecurityContext, c: Context | null, input: any) {
        // 1. Parent relationship validation
        if (input.requestId) {
            const req = await queryOne(
                `SELECT id FROM calibration_requests WHERE tenant_id = $1 AND organization_id = $2 AND id = $3`,
                [ctx.tenantId, ctx.organizationId, input.requestId]
            );
            if (!req) throw new Error('RESOURCE_NOT_FOUND: Referenced calibration request not found');
        }

        if (input.requestItemId) {
            const item = await queryOne(
                `SELECT id FROM request_items WHERE tenant_id = $1 AND organization_id = $2 AND id = $3`,
                [ctx.tenantId, ctx.organizationId, input.requestItemId]
            );
            if (!item) throw new Error('RESOURCE_NOT_FOUND: Referenced request item not found');
        }

        // 2. Prepare Storage Key
        const docId = crypto.randomUUID();
        const storageKey = R2StorageService.buildStorageKey(
            ctx.tenantId,
            ctx.organizationId,
            input.requestId,
            input.requestItemId,
            docId,
            input.fileName
        );

        // 3. Convert Base64 to Buffer
        const fileBuffer = Buffer.from(input.fileContentBase64, 'base64');

        // 4. Upload to Cloudflare R2 / Object Store
        await R2StorageService.putObject(c, storageKey, fileBuffer, input.mimeType);

        // 5. Create PostgreSQL Metadata with compensation cleanup if DB write fails
        let metadata;
        try {
            metadata = await DocumentRepository.createDocumentMetadata(ctx.tenantId, ctx.organizationId, ctx.userId, {
                ...input,
                storageKey
            });
        } catch (dbErr) {
            // Cleanup orphaned object in R2 if DB transaction fails
            await R2StorageService.deleteObject(c, storageKey);
            throw dbErr;
        }

        // 6. Record Audit Log
        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'DOCUMENT_UPLOADED',
            entityType: 'documents',
            entityId: metadata.id,
            newData: { id: metadata.id, fileName: metadata.file_name, documentType: metadata.document_type, storageKey }
        });

        return metadata;
    }

    static async getDocuments(
        ctx: UserSecurityContext,
        filters: { requestId?: string; requestItemId?: string; documentType?: string; documentStatus?: string },
        limit: number,
        offset: number
    ) {
        return DocumentRepository.getDocuments(ctx.tenantId, ctx.organizationId, filters, limit, offset);
    }

    static async getDocumentById(ctx: UserSecurityContext, id: string) {
        const doc = await DocumentRepository.getDocumentById(ctx.tenantId, ctx.organizationId, id);
        if (!doc) throw new Error('RESOURCE_NOT_FOUND: Document record not found');
        return doc;
    }

    static async generateSignedUrl(ctx: UserSecurityContext, baseUrl: string, id: string) {
        const doc = await this.getDocumentById(ctx, id);

        if (doc.document_status === 'DELETED') {
            throw new Error('BUSINESS_RULE_FAILED: Cannot generate download URL for a deleted document');
        }

        const signedInfo = await R2StorageService.generateSignedDownloadUrl(
            baseUrl,
            doc.id,
            ctx.tenantId,
            ctx.organizationId,
            ctx.userId,
            300 // 5 minutes TTL
        );

        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'DOCUMENT_SIGNED_URL_GENERATED',
            entityType: 'documents',
            entityId: doc.id,
            newData: { signedUrl: signedInfo.signedUrl, expiresAt: signedInfo.expiresAt }
        });

        return {
            documentId: doc.id,
            fileName: doc.file_name,
            mimeType: doc.mime_type,
            fileSize: doc.file_size,
            ...signedInfo
        };
    }

    static async downloadDocumentContent(c: Context | null, token: string, docIdFromPath: string) {
        const payload = await R2StorageService.verifySignedDownloadToken(token);
        if (!payload || payload.docId !== docIdFromPath) {
            throw new Error('AUTHENTICATION_FAILED: Invalid or expired document download token');
        }

        const doc = await DocumentRepository.getDocumentById(payload.tenantId, payload.orgId, payload.docId);
        if (!doc) throw new Error('RESOURCE_NOT_FOUND: Document not found');

        const objectData = await R2StorageService.getObject(c, doc.storage_key);
        if (!objectData) throw new Error('RESOURCE_NOT_FOUND: Document file object not found in R2 storage');

        await createAuditLog({
            tenantId: payload.tenantId,
            organizationId: payload.orgId,
            userId: payload.userId,
            action: 'DOCUMENT_DOWNLOAD_REQUESTED',
            entityType: 'documents',
            entityId: doc.id,
            newData: { fileName: doc.file_name }
        });

        return {
            body: objectData.body,
            mimeType: doc.mime_type || objectData.mimeType,
            fileName: doc.file_name
        };
    }

    static async replaceDocument(ctx: UserSecurityContext, c: Context | null, oldDocId: string, input: any) {
        const existingDoc = await this.getDocumentById(ctx, oldDocId);

        if (existingDoc.document_status === 'DELETED') {
            throw new Error('INVALID_STATE: Cannot replace a deleted document');
        }

        const newDocId = crypto.randomUUID();
        const newStorageKey = R2StorageService.buildStorageKey(
            ctx.tenantId,
            ctx.organizationId,
            existingDoc.request_id,
            existingDoc.request_item_id,
            newDocId,
            input.fileName
        );

        const fileBuffer = Buffer.from(input.fileContentBase64, 'base64');
        await R2StorageService.putObject(c, newStorageKey, fileBuffer, input.mimeType);

        let updatedDoc;
        try {
            updatedDoc = await DocumentRepository.replaceDocumentMetadata(
                ctx.tenantId,
                ctx.organizationId,
                ctx.userId,
                existingDoc,
                newStorageKey,
                input
            );
        } catch (err) {
            await R2StorageService.deleteObject(c, newStorageKey);
            throw err;
        }

        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'DOCUMENT_REPLACED',
            entityType: 'documents',
            entityId: updatedDoc.id,
            oldData: { id: existingDoc.id, version: existingDoc.version },
            newData: { id: updatedDoc.id, version: updatedDoc.version, storageKey: newStorageKey }
        });

        return updatedDoc;
    }

    static async deleteDocument(ctx: UserSecurityContext, c: Context | null, id: string) {
        const doc = await this.getDocumentById(ctx, id);

        const deletedDoc = await DocumentRepository.deleteDocumentMetadata(ctx.tenantId, ctx.organizationId, id);
        await R2StorageService.deleteObject(c, doc.storage_key);

        await createAuditLog({
            tenantId: ctx.tenantId,
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            action: 'DOCUMENT_DELETED',
            entityType: 'documents',
            entityId: id,
            oldData: doc,
            newData: deletedDoc
        });

        return deletedDoc;
    }
}
