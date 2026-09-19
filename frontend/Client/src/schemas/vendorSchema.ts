import { z } from 'zod';

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PIN_REGEX = /^[0-9]{6}$/;
export const PHONE_REGEX = /^[6-9][0-9]{9}$/;

export const vendorFormSchema = z.object({
  vendor_code: z.string().optional(),
  vendor_name: z
    .string()
    .trim()
    .min(1, 'Vendor name is required')
    .min(2, 'Vendor name must be at least 2 characters')
    .max(255, 'Vendor name cannot exceed 255 characters'),
  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .min(5, 'Please provide a complete address')
    .max(1000, 'Address cannot exceed 1000 characters'),
  city: z
    .string()
    .trim()
    .min(1, 'City is required')
    .max(100, 'City cannot exceed 100 characters'),
  state: z
    .string()
    .trim()
    .min(1, 'State is required')
    .max(100, 'State cannot exceed 100 characters'),
  pin: z
    .string()
    .trim()
    .regex(PIN_REGEX, 'PIN must contain exactly 6 digits'),
  gstin_tax_id: z
    .string()
    .trim()
    .regex(GSTIN_REGEX, 'Invalid GSTIN format (e.g., 29AAACA1234F1Z5)'),
  contact_person: z
    .string()
    .trim()
    .min(1, 'Contact person is required')
    .max(255, 'Contact person cannot exceed 255 characters'),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Phone must be a valid 10-digit Indian mobile number'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  item_category_ids: z.array(z.string()),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export type VendorFormValues = z.infer<typeof vendorFormSchema>;
