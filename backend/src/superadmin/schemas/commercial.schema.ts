import { z } from 'zod';

export const createQuotationItemSchema = z.object({
    requestItemId: z.string().uuid('Invalid request item UUID').optional(),
    itemMasterId: z.string().uuid('Invalid item master UUID').optional(),
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().int().positive().default(1),
    unitPrice: z.number().min(0, 'Unit price cannot be negative'),
    taxRatePercentage: z.number().min(0).default(18.00),
    remarks: z.string().optional()
});

export const createQuotationSchema = z.object({
    requestId: z.string().uuid('Invalid request UUID'),
    clientId: z.string().uuid('Invalid client UUID'),
    validUntil: z.string().optional(),
    discountAmount: z.number().min(0).optional().default(0),
    termsAndConditions: z.string().optional(),
    remarks: z.string().optional(),
    items: z.array(createQuotationItemSchema).min(1, 'At least one item is required in quotation')
});

export const updateQuotationSchema = z.object({
    discountAmount: z.number().min(0).optional(),
    termsAndConditions: z.string().optional(),
    remarks: z.string().optional()
});

export const approveQuotationSchema = z.object({
    approvalAction: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().optional(),
    remarks: z.string().optional()
}).refine(data => data.approvalAction !== 'REJECTED' || (data.rejectionReason && data.rejectionReason.trim().length > 0), {
    message: 'Rejection reason is required when rejecting a quotation',
    path: ['rejectionReason']
});

export const createInvoiceItemSchema = z.object({
    requestItemId: z.string().uuid().optional(),
    description: z.string().min(1),
    quantity: z.number().int().positive().default(1),
    unitPrice: z.number().min(0),
    taxRatePercentage: z.number().min(0).default(18.00),
    remarks: z.string().optional()
});

export const createInvoiceSchema = z.object({
    requestId: z.string().uuid('Invalid request UUID'),
    quotationId: z.string().uuid('Invalid quotation UUID').optional(),
    clientId: z.string().uuid('Invalid client UUID'),
    dueDate: z.string().optional(),
    discountAmount: z.number().min(0).optional().default(0),
    remarks: z.string().optional(),
    items: z.array(createInvoiceItemSchema).min(1, 'At least one invoice item is required')
});

export const createPurchaseOrderItemSchema = z.object({
    requestItemId: z.string().uuid().optional(),
    description: z.string().min(1),
    quantity: z.number().int().positive().default(1),
    unitPrice: z.number().min(0),
    taxRatePercentage: z.number().min(0).default(18.00),
    remarks: z.string().optional()
});

export const createPurchaseOrderSchema = z.object({
    requestId: z.string().uuid('Invalid request UUID'),
    quotationId: z.string().uuid('Invalid quotation UUID').optional(),
    clientId: z.string().uuid('Invalid client UUID'),
    clientPoNumber: z.string().min(1, 'Client PO number is required'),
    poDate: z.string().optional(),
    discountAmount: z.number().min(0).optional().default(0),
    remarks: z.string().optional(),
    items: z.array(createPurchaseOrderItemSchema).min(1, 'At least one PO item is required')
});
