import { z } from 'zod';

export const ALLOWED_DOCUMENT_TYPES = [
    'VERIFICATION_PROOF',
    'CALIBRATION_DOCUMENT',
    'CALIBRATION_CERTIFICATE',
    'QUOTATION_DOCUMENT',
    'APPROVAL_DOCUMENT',
    'INVOICE_DOCUMENT',
    'PURCHASE_ORDER_DOCUMENT',
    'CLIENT_SIGNATURE',
    'DISPATCH_DOCUMENT',
    'DELIVERY_DOCUMENT',
    'OTHER'
] as const;

export const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain'
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export const createDocumentSchema = z.object({
    requestId: z.string().uuid('Invalid request UUID').optional(),
    requestItemId: z.string().uuid('Invalid request item UUID').optional(),
    documentType: z.enum([
        'VERIFICATION_PROOF',
        'CALIBRATION_DOCUMENT',
        'CALIBRATION_CERTIFICATE',
        'QUOTATION_DOCUMENT',
        'APPROVAL_DOCUMENT',
        'INVOICE_DOCUMENT',
        'PURCHASE_ORDER_DOCUMENT',
        'CLIENT_SIGNATURE',
        'DISPATCH_DOCUMENT',
        'DELIVERY_DOCUMENT',
        'OTHER'
    ]),
    fileName: z.string().min(1, 'File name is required').max(255, 'File name too long'),
    mimeType: z.enum([
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
        'text/plain'
    ]),
    fileSize: z.number().int().positive('File size must be positive').max(MAX_FILE_SIZE_BYTES, 'File size exceeds 10MB limit'),
    fileContentBase64: z.string().min(1, 'File content (base64) is required'),
    description: z.string().optional()
});

export const replaceDocumentSchema = z.object({
    fileName: z.string().min(1, 'File name is required').max(255, 'File name too long'),
    mimeType: z.enum([
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
        'text/plain'
    ]),
    fileSize: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
    fileContentBase64: z.string().min(1, 'File content (base64) is required'),
    description: z.string().optional()
});

export const documentQuerySchema = z.object({
    requestId: z.string().uuid().optional(),
    requestItemId: z.string().uuid().optional(),
    documentType: z.enum([
        'VERIFICATION_PROOF',
        'CALIBRATION_DOCUMENT',
        'CALIBRATION_CERTIFICATE',
        'QUOTATION_DOCUMENT',
        'APPROVAL_DOCUMENT',
        'INVOICE_DOCUMENT',
        'PURCHASE_ORDER_DOCUMENT',
        'CLIENT_SIGNATURE',
        'DISPATCH_DOCUMENT',
        'DELIVERY_DOCUMENT',
        'OTHER'
    ]).optional(),
    documentStatus: z.enum(['ACTIVE', 'REPLACED', 'ARCHIVED', 'DELETED']).optional(),
    page: z.string().optional(),
    limit: z.string().optional()
});
