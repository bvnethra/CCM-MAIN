// ============================================================================
// CLIENT MASTER VALIDATION SCHEMA (Zod)
// ============================================================================
// Frontend validation schema for Client Master form
// Matches database constraints and business rules
// ============================================================================

import { z } from 'zod';

// ===========================================
// VALIDATION REGEX PATTERNS
// ===========================================

// Indian GSTIN format: 22AAAAA0000A1Z5
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Indian PIN code: 6 digits
const PIN_CODE_REGEX = /^[0-9]{6}$/;

// Indian mobile number: starts with 6-9, then 9 more digits
const PHONE_REGEX = /^[6-9][0-9]{9}$/;

// ===========================================
// CLIENT FORM SCHEMA
// ===========================================

export const clientFormSchema = z.object({
  // Client Name
  clientName: z.string()
    .min(1, 'Client name is required')
    .max(255, 'Client name must not exceed 255 characters')
    .transform(val => val.trim()),
  
  // Registered Address
  registeredAddress: z.string()
    .min(1, 'Registered address is required')
    .transform(val => val.trim()),
  
  // Billing Address (optional)
  billingAddress: z.string()
    .optional()
    .transform(val => val?.trim() || ''),
  
  // Helper field for UI (not sent to backend)
  useSameAddress: z.boolean().optional(),
  
  // City
  city: z.string()
    .min(1, 'City is required')
    .max(100, 'City must not exceed 100 characters')
    .transform(val => val.trim()),
  
  // State
  state: z.string()
    .min(1, 'State is required')
    .max(100, 'State must not exceed 100 characters')
    .transform(val => val.trim()),
  
  // PIN Code
  pinCode: z.string()
    .regex(PIN_CODE_REGEX, 'PIN code must be exactly 6 digits')
    .length(6, 'PIN code must be exactly 6 digits'),
  
  // GSTIN / Tax ID
  gstinTaxId: z.string()
    .regex(GSTIN_REGEX, 'Invalid GSTIN format (e.g., 29AAACA1234F1Z5)')
    .transform(val => val.toUpperCase()),
  
  // Contact Person
  contactPerson: z.string()
    .min(1, 'Contact person is required')
    .max(255, 'Contact person must not exceed 255 characters')
    .transform(val => val.trim()),
  
  // Phone
  phone: z.string()
    .regex(PHONE_REGEX, 'Phone must be a valid 10-digit Indian mobile number starting with 6-9'),
  
  // Email
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters')
    .transform(val => val.toLowerCase().trim()),
  
  // Status (required, with default)
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' })
  }),
  
  // Payment Terms (required, with default)
  paymentTerms: z.enum(['IMMEDIATE', '30_DAYS', '60_DAYS'], {
    errorMap: () => ({ message: 'Invalid payment terms' })
  })
});

// Export type for TypeScript
export type ClientFormData = z.infer<typeof clientFormSchema>;

// ===========================================
// UPDATE SCHEMA (Partial)
// ===========================================

export const updateClientSchema = clientFormSchema.partial().omit({
  useSameAddress: true
});

export type UpdateClientFormData = z.infer<typeof updateClientSchema>;

// ===========================================
// VALIDATION HELPER FUNCTIONS
// ===========================================

/**
 * Validate GSTIN format
 */
export function isValidGSTIN(gstin: string): boolean {
  return GSTIN_REGEX.test(gstin.toUpperCase());
}

/**
 * Validate PIN code format
 */
export function isValidPINCode(pinCode: string): boolean {
  return PIN_CODE_REGEX.test(pinCode);
}

/**
 * Validate Indian mobile number format
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

/**
 * Format payment terms for display
 */
export function formatPaymentTerms(terms: 'IMMEDIATE' | '30_DAYS' | '60_DAYS'): string {
  switch (terms) {
    case 'IMMEDIATE':
      return 'Immediate';
    case '30_DAYS':
      return '30 Days';
    case '60_DAYS':
      return '60 Days';
    default:
      return terms;
  }
}

/**
 * Format status for display
 */
export function formatStatus(status: 'ACTIVE' | 'INACTIVE'): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
