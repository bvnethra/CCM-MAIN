import { Context } from 'hono';
import { DocumentService } from '../services/document.service';
import { getUserContext } from '../middleware/auth.middleware';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';

export class DocumentController {
    static async getDocuments(c: Context) {
        const userCtx = getUserContext(c);
        const queryParams = c.req.query();
        const pagination = parsePaginationParams(queryParams);

        const filters = {
            requestId: queryParams.requestId,
            requestItemId: queryParams.requestItemId,
            documentType: queryParams.documentType,
            documentStatus: queryParams.documentStatus
        };

        const { data, total } = await DocumentService.getDocuments(userCtx, filters, pagination.limit, pagination.offset);
        return sendSuccess(c, data, 'Documents retrieved successfully', buildPaginationMeta(pagination.page, pagination.limit, total));
    }

    static async getDocumentById(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const doc = await DocumentService.getDocumentById(userCtx, id);
        return sendSuccess(c, doc);
    }

    static async uploadDocument(c: Context) {
        const userCtx = getUserContext(c);
        const body = c.get('validatedBody');
        const doc = await DocumentService.uploadDocument(userCtx, c, body);
        return sendCreated(c, doc, 'Document uploaded successfully');
    }

    static async generateSignedUrl(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const reqUrl = c.req.url;
        const urlObj = new URL(reqUrl);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

        const signedData = await DocumentService.generateSignedUrl(userCtx, baseUrl, id);
        return sendSuccess(c, signedData, 'Signed URL generated successfully');
    }

    static async downloadDocumentContent(c: Context) {
        const id = c.req.param('id') as string;
        const token = c.req.query('token');

        if (!token) {
            return sendError(c, 'AUTHENTICATION_FAILED', 'Download token is required in query parameters', 401);
        }

        const { body, mimeType, fileName } = await DocumentService.downloadDocumentContent(c, token, id);

        return new Response(body as unknown as BodyInit, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `inline; filename="${fileName}"`,
                'Cache-Control': 'no-store, private'
            }
        });
    }

    static async replaceDocument(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const body = c.get('validatedBody');
        const updated = await DocumentService.replaceDocument(userCtx, c, id, body);
        return sendSuccess(c, updated, 'Document version updated successfully');
    }

    static async deleteDocument(c: Context) {
        const userCtx = getUserContext(c);
        const id = c.req.param('id') as string;
        const deleted = await DocumentService.deleteDocument(userCtx, c, id);
        return sendSuccess(c, deleted, 'Document deleted successfully');
    }
}
