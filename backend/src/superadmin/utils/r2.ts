import { Context } from 'hono';
import { SignJWT, jwtVerify } from 'jose';

const DEFAULT_JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-calibration-commercial-module-testing';

// In-memory fallback object store for local node standalone testing
const localMockStorage = new Map<string, { content: Uint8Array; mimeType: string }>();

export class R2StorageService {
    static sanitizeFileName(fileName: string): string {
        // Remove path traversal & dangerous characters
        return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    }

    static buildStorageKey(
        tenantId: string,
        orgId: string,
        requestId: string | null | undefined,
        requestItemId: string | null | undefined,
        documentId: string,
        fileName: string
    ): string {
        const cleanName = this.sanitizeFileName(fileName);
        if (requestId && requestItemId) {
            return `tenant/${tenantId}/organization/${orgId}/requests/${requestId}/items/${requestItemId}/documents/${documentId}/${cleanName}`;
        } else if (requestId) {
            return `tenant/${tenantId}/organization/${orgId}/requests/${requestId}/documents/${documentId}/${cleanName}`;
        }
        return `tenant/${tenantId}/organization/${orgId}/documents/${documentId}/${cleanName}`;
    }

    static async putObject(c: Context | null, key: string, content: Uint8Array | Buffer, mimeType: string): Promise<void> {
        if (c && c.env && c.env.DOCUMENTS_BUCKET) {
            await c.env.DOCUMENTS_BUCKET.put(key, content, {
                httpMetadata: { contentType: mimeType }
            });
            return;
        }
        localMockStorage.set(key, { content: new Uint8Array(content), mimeType });
    }

    static async getObject(c: Context | null, key: string): Promise<{ body: Uint8Array; mimeType: string } | null> {
        if (c && c.env && c.env.DOCUMENTS_BUCKET) {
            const obj = await c.env.DOCUMENTS_BUCKET.get(key);
            if (!obj) return null;
            const arrayBuf = await obj.arrayBuffer();
            const mimeType = obj.httpMetadata?.contentType || 'application/octet-stream';
            return { body: new Uint8Array(arrayBuf), mimeType };
        }
        const found = localMockStorage.get(key);
        if (!found) return null;
        return { body: found.content, mimeType: found.mimeType };
    }

    static async deleteObject(c: Context | null, key: string): Promise<void> {
        if (c && c.env && c.env.DOCUMENTS_BUCKET) {
            await c.env.DOCUMENTS_BUCKET.delete(key);
            return;
        }
        localMockStorage.delete(key);
    }

    static async generateSignedDownloadUrl(
        baseUrl: string,
        documentId: string,
        tenantId: string,
        orgId: string,
        userId: string,
        ttlSeconds: number = 300
    ): Promise<{ signedUrl: string; expiresAt: string }> {
        const secret = new TextEncoder().encode(DEFAULT_JWT_SECRET);
        const expTime = Math.floor(Date.now() / 1000) + ttlSeconds;

        const token = await new SignJWT({
            docId: documentId,
            tenantId,
            organizationId: orgId,
            userId,
            action: 'DOCUMENT_DOWNLOAD'
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expTime)
        .sign(secret);

        const expiresAt = new Date(expTime * 1000).toISOString();
        const signedUrl = `${baseUrl}/api/documents/${documentId}/download?token=${encodeURIComponent(token)}`;

        return { signedUrl, expiresAt };
    }

    static async verifySignedDownloadToken(token: string): Promise<{ docId: string; tenantId: string; orgId: string; userId: string } | null> {
        try {
            const secret = new TextEncoder().encode(DEFAULT_JWT_SECRET);
            const { payload } = await jwtVerify(token, secret);
            if (payload.action !== 'DOCUMENT_DOWNLOAD' || !payload.docId) return null;

            return {
                docId: payload.docId as string,
                tenantId: payload.tenantId as string,
                orgId: payload.organizationId as string,
                userId: payload.userId as string
            };
        } catch {
            return null;
        }
    }
}
