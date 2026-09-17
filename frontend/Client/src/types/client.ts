export type ClientAccountStatus = 'Active' | 'Inactive' | 'Pending' | 'Suspended';

export interface Client {
  id: string;
  tenantId: string;
  organizationId: string;

  // 1. Client Info
  clientName: string;
  clientCode: string;
  businessType: string;
  gstNumber?: string;
  contactPersonName: string;

  // 2. Address Details
  email: string;
  phone?: string;
  phoneNumber?: string; // alias for backwards compatibility
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  currency: string;

  // System & Metadata
  accountStatus: ClientAccountStatus;
  activeRequestsCount?: number;
  createdAt: string;

  // Optional extended attributes
  contactPersonContactNumber?: string;
  numberOfBranches?: number;
  numberOfWarehouses?: number;
  onboardingDate?: string;
  msmeNumber?: string;
}

export interface ClientFormData {
  // 1. Client Info
  clientName: string;
  clientCode: string;
  businessType: string;
  gstNumber?: string;
  contactPersonName: string;

  // 2. Address Details
  email: string;
  phone: string;
  phoneNumber?: string; // alias for compatibility
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  currency: string;

  // Optional metadata
  accountStatus?: ClientAccountStatus;
  contactPersonContactNumber?: string;
  numberOfBranches?: number;
  numberOfWarehouses?: number;
  onboardingDate?: string;
  msmeNumber?: string;
}
