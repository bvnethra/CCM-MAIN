import { z } from 'zod';

export const createSignatureSchema = z.object({
    requestId: z.string().uuid('Invalid request UUID'),
    signatureType: z.enum(['CLIENT_INVOICE', 'CLIENT_DELIVERY']),
    signedByName: z.string().min(2, 'Signer name is required'),
    signatureReference: z.string().optional(),
    remarks: z.string().optional()
});

export const updateSignatureStatusSchema = z.object({
    signatureStatus: z.enum(['SIGNED', 'REJECTED', 'CANCELLED']),
    remarks: z.string().optional()
});

export const createDispatchItemInputSchema = z.object({
    requestItemId: z.string().uuid('Invalid request item UUID'),
    itemMasterId: z.string().uuid('Invalid item master UUID'),
    quantity: z.number().int().positive().default(1),
    remarks: z.string().optional()
});

export const createDispatchSchema = z.object({
    requestId: z.string().uuid('Invalid request UUID'),
    dispatchDate: z.string().optional(),
    courierName: z.string().optional(),
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().optional(),
    expectedDeliveryDate: z.string().optional(),
    remarks: z.string().optional(),
    items: z.array(createDispatchItemInputSchema).min(1, 'At least one dispatch item is required')
});

export const updateDispatchSchema = z.object({
    courierName: z.string().optional(),
    trackingNumber: z.string().optional(),
    trackingUrl: z.string().optional(),
    expectedDeliveryDate: z.string().optional(),
    remarks: z.string().optional()
});

export const createDeliverySchema = z.object({
    requestId: z.string().uuid('Invalid request UUID'),
    dispatchId: z.string().uuid('Invalid dispatch UUID'),
    deliveryDate: z.string().optional(),
    receivedByName: z.string().optional(),
    receivedByContact: z.string().optional(),
    deliveryRemarks: z.string().optional()
});

export const receiveDeliverySchema = z.object({
    receivedByName: z.string().min(2, 'Recipient name is required'),
    receivedByContact: z.string().optional(),
    deliveryRemarks: z.string().optional()
});

export const signDeliverySchema = z.object({
    signedByName: z.string().min(2, 'Signer name is required'),
    signatureReference: z.string().optional(),
    remarks: z.string().optional()
});
