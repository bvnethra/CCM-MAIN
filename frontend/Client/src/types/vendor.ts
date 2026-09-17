export type CreditLevel = 'Excellent' | 'Good' | 'Average' | 'High Risk';

export interface Vendor {
  id: string;
  tenantId: string;
  organizationId: string;

  // 1. Vendor Info
  vendorName: string;
  vendorCode: string;
  businessType: string;
  contactPersonName: string;
  gstNumber?: string;
  panNumber?: string;

  // 2. Address Details
  email: string;
  phoneNumber: string;
  phone?: string; // alias for compatibility
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;

  // System & Commercial Metadata
  creditScore?: number;
  creditLevel?: CreditLevel;
  paymentDetails?: string;
  termsAndConditions?: string;
  status: 'ACTIVE' | 'INACTIVE';
  activePOCount?: number;
  createdAt: string;
}

export interface VendorFormData {
  // 1. Vendor Info
  vendorName: string;
  vendorCode: string;
  businessType: string;
  contactPersonName: string;
  gstNumber?: string;
  panNumber?: string;

  // 2. Address Details
  email: string;
  phoneNumber: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;

  // Optional extended attributes
  creditScore?: number;
  creditLevel?: CreditLevel;
  paymentDetails?: string;
  termsAndConditions?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}
