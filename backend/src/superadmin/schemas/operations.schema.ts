import { z } from 'zod';

export const createRequestItemInputSchema = z.object({
    itemMasterId: z.string().uuid('Invalid item master UUID'),
    quantity: z.number().int().positive('Quantity must be at least 1').default(1),
    serialNumber: z.string().optional(),
    visualCondition: z.string().optional(),
    documentRequired: z.boolean().optional().default(true),
    remarks: z.string().optional()
});

export const createRequestSchema = z.object({
    clientId: z.string().uuid('Invalid client UUID'),
    collectionAgentId: z.string().uuid('Invalid collection agent UUID').optional(),
    collectionDate: z.string().optional(),
    priority: z.enum(['NORMAL', 'URGENT']).optional().default('NORMAL'),
    remarks: z.string().optional(),
    items: z.array(createRequestItemInputSchema).min(1, 'At least one item is required in calibration request')
});

export const updateRequestSchema = z.object({
    clientId: z.string().uuid().optional(),
    collectionAgentId: z.string().uuid().optional(),
    priority: z.enum(['NORMAL', 'URGENT']).optional(),
    remarks: z.string().optional()
});

export const verifyItemSchema = z.object({
    receivedQuantity: z.number().int().min(0, 'Received quantity cannot be negative'),
    verificationCondition: z.enum(['GOOD', 'DAMAGED', 'INCOMPLETE', 'OTHER']),
    verificationResult: z.enum(['VERIFIED', 'DISCREPANCY', 'SHORT', 'REJECTED', 'ON_HOLD']),
    remarks: z.string().optional()
});

export const createCalibrationSchema = z.object({
    requestItemId: z.string().uuid('Invalid request item UUID'),
    itemMasterId: z.string().uuid('Invalid item master UUID'),
    calibratedBy: z.string().uuid('Invalid user UUID').optional(),
    calibrationDate: z.string().optional(),
    ambientTemperature: z.number().optional(),
    relativeHumidity: z.number().optional(),
    remarks: z.string().optional()
});

export const updateCalibrationMeasurementSchema = z.object({
    parameterName: z.string().min(1, 'Parameter name is required'),
    nominalValue: z.number(),
    observedValue: z.number(),
    unit: z.string().min(1, 'Unit is required'),
    toleranceMin: z.number().optional(),
    toleranceMax: z.number().optional(),
    remarks: z.string().optional()
});

export const completeCalibrationSchema = z.object({
    calibrationResult: z.enum(['PASSED', 'FAILED', 'CALIBRATED_WITH_LIMITATION']),
    remarks: z.string().optional()
});

export const createFaultyServiceSchema = z.object({
    requestItemId: z.string().uuid('Invalid request item UUID'),
    itemMasterId: z.string().uuid('Invalid item master UUID'),
    calibrationId: z.string().uuid('Invalid calibration UUID').optional(),
    faultDescription: z.string().min(2, 'Fault description is required'),
    actionProposed: z.string().optional(),
    estimatedCost: z.number().min(0).optional(),
    remarks: z.string().optional()
});

export const completeFaultyServiceSchema = z.object({
    serviceStatus: z.enum(['SERVICE_COMPLETED', 'RETURNED_TO_CALIBRATION', 'CANCELLED']),
    workDone: z.string().optional(),
    costIncurred: z.number().min(0).optional(),
    remarks: z.string().optional()
});

export const createVendorOutsourcingSchema = z.object({
    requestItemId: z.string().uuid('Invalid request item UUID'),
    itemMasterId: z.string().uuid('Invalid item master UUID'),
    vendorId: z.string().uuid('Invalid vendor UUID'),
    outsourcingReason: z.string().optional(),
    estimatedDays: z.number().int().positive().optional(),
    quotedPrice: z.number().min(0).optional(),
    remarks: z.string().optional()
});

export const returnVendorOutsourcingSchema = z.object({
    outsourcingStatus: z.enum(['RETURNED', 'VERIFIED', 'REJECTED']),
    vendorCertificateNumber: z.string().optional(),
    returnCondition: z.string().optional(),
    actualCost: z.number().min(0).optional(),
    remarks: z.string().optional()
});
