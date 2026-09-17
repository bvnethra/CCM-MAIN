import { z } from 'zod';

export const createClientSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    code: z.string().min(2, 'Code must be at least 2 characters'),
    contactPerson: z.string().optional().or(z.literal('')),
    email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    gstin: z.string().optional().or(z.literal('')),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE')
});

export const updateClientSchema = createClientSchema.partial();

export const createVendorSchema = z.object({
    name: z.string().min(2, 'Vendor name must be at least 2 characters'),
    code: z.string().min(2, 'Vendor code must be at least 2 characters'),
    contactPerson: z.string().optional().or(z.literal('')),
    email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    gstin: z.string().optional().or(z.literal('')),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE')
});

export const updateVendorSchema = createVendorSchema.partial();

export const createItemMasterSchema = z.object({
    name: z.string().min(2, 'Item name must be at least 2 characters'),
    code: z.string().min(2, 'Item code must be at least 2 characters'),
    category: z.string().min(2, 'Category is required'),
    make: z.string().optional().or(z.literal('')),
    model: z.string().optional().or(z.literal('')),
    serialNumber: z.string().optional().or(z.literal('')),
    rangeCapacity: z.string().optional().or(z.literal('')),
    accuracy: z.string().optional().or(z.literal('')),
    calibrationFrequencyDays: z.number().int().positive().optional().default(365),
    status: z.enum(['ACTIVE', 'INACTIVE', 'RETIRED']).optional().default('ACTIVE')
});

export const updateItemMasterSchema = createItemMasterSchema.partial();
