import { z } from 'zod';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PIN_REGEX = /^[0-9]{6}$/;
const PHONE_REGEX = /^[6-9][0-9]{9}$/;

const vendorFormSchema = z.object({
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
  item_category_ids: z.array(z.string()).default([]),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

console.log('==================================================');
console.log('🧪 RUNNING VENDOR MASTER VALIDATION TEST SUITE');
console.log('==================================================\n');

let passed = 0;
let failed = 0;

function assertTest(name, condition, errorDetail = '') {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name} ${errorDetail ? `(${errorDetail})` : ''}`);
    failed++;
  }
}

// 1. Create valid Vendor
const validVendor = {
  vendor_name: 'ABC Calibration Services Pvt Ltd',
  address: '123 Industrial Area, Phase II',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pin: '600001',
  gstin_tax_id: '33AAACB1234P1Z5',
  contact_person: 'Ramesh Kumar',
  phone: '9876543210',
  email: 'ramesh@abccalibration.com',
  item_category_ids: ['cat-uuid-1', 'cat-uuid-2'],
  status: 'ACTIVE',
};

const validRes = vendorFormSchema.safeParse(validVendor);
assertTest('1. Create valid Vendor', validRes.success);

// 2. Empty Vendor Name
const resEmptyName = vendorFormSchema.safeParse({ ...validVendor, vendor_name: '' });
assertTest('2. Empty Vendor Name rejected', !resEmptyName.success);

// 3. Empty Address
const resEmptyAddress = vendorFormSchema.safeParse({ ...validVendor, address: '   ' });
assertTest('3. Empty Address rejected', !resEmptyAddress.success);

// 4. Empty City
const resEmptyCity = vendorFormSchema.safeParse({ ...validVendor, city: '' });
assertTest('4. Empty City rejected', !resEmptyCity.success);

// 5. Empty State
const resEmptyState = vendorFormSchema.safeParse({ ...validVendor, state: '' });
assertTest('5. Empty State rejected', !resEmptyState.success);

// 6. Invalid PIN (5 digits or letters)
const resPin5 = vendorFormSchema.safeParse({ ...validVendor, pin: '60000' });
const resPinAlpha = vendorFormSchema.safeParse({ ...validVendor, pin: '60000A' });
assertTest('6. Invalid PIN format rejected (5 digits / alphanumeric)', !resPin5.success && !resPinAlpha.success);

// 7. Invalid GSTIN
const resInvalidGstin = vendorFormSchema.safeParse({ ...validVendor, gstin_tax_id: 'INVALID_GST_123' });
assertTest('7. Invalid GSTIN format rejected', !resInvalidGstin.success);

// 8. Valid GSTIN accepted
const resValidGstin = vendorFormSchema.safeParse({ ...validVendor, gstin_tax_id: '29AAACA1234F1Z5' });
assertTest('8. Valid Indian GSTIN format accepted', resValidGstin.success);

// 9. Empty Contact Person
const resEmptyContact = vendorFormSchema.safeParse({ ...validVendor, contact_person: '' });
assertTest('9. Empty Contact Person rejected', !resEmptyContact.success);

// 10. Invalid Phone (starts with 1 or less than 10 digits)
const resPhoneShort = vendorFormSchema.safeParse({ ...validVendor, phone: '987654321' });
const resPhoneBadPrefix = vendorFormSchema.safeParse({ ...validVendor, phone: '1234567890' });
assertTest('10. Invalid Phone format rejected', !resPhoneShort.success && !resPhoneBadPrefix.success);

// 11. Invalid Email
const resEmailBad = vendorFormSchema.safeParse({ ...validVendor, email: 'not-an-email' });
assertTest('11. Invalid Email format rejected', !resEmailBad.success);

// 12. Multiple Item Categories & Empty Categories allowed (optional)
const resWithCategories = vendorFormSchema.safeParse({
  ...validVendor,
  item_category_ids: ['uuid-1', 'uuid-2', 'uuid-3'],
});
const resEmptyCategories = vendorFormSchema.safeParse({
  ...validVendor,
  item_category_ids: [],
});
assertTest('12. Item Categories handled properly (multi-select & optional)', resWithCategories.success && resEmptyCategories.success);

// 13. Status ACTIVE / INACTIVE validation
const resStatusActive = vendorFormSchema.safeParse({ ...validVendor, status: 'ACTIVE' });
const resStatusInactive = vendorFormSchema.safeParse({ ...validVendor, status: 'INACTIVE' });
const resStatusInvalid = vendorFormSchema.safeParse({ ...validVendor, status: 'UNKNOWN' });
assertTest('13. Status ACTIVE / INACTIVE strictly validated', resStatusActive.success && resStatusInactive.success && !resStatusInvalid.success);

console.log('\n==================================================');
console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
console.log('==================================================');

if (failed > 0) process.exit(1);
