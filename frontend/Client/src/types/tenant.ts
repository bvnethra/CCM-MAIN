export type StatusType = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type TenantType =
  | 'Enterprise'
  | 'Calibration Laboratory Network'
  | 'Private Limited'
  | 'Public Limited'
  | 'Partnership'
  | 'Proprietorship'
  | 'OEM Group'
  | 'Subcontract Partner';

export interface Tenant {
  id: string;
  // 1. Tenant Info
  name: string;
  code: string;
  tenantType?: TenantType | string;
  registrationNumber?: string;
  gstNumber?: string;
  contactEmail: string;
  contactPhone: string;

  // 2. Address Details
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  timezone?: string;
  currency?: string;

  // 3. Inventory Setup
  numberOfBranches?: number;

  // 4. Administration
  adminName?: string;
  adminEmail?: string;
  adminDesignation?: string;

  // System & Lifecycle Metadata
  status: StatusType;
  organizationsCount: number;
  usersCount: number;
  createdDate: string;
  updatedDate: string;
  description?: string;
}

export interface TenantFormData {
  // 1. Tenant Info
  name: string;
  code: string;
  tenantType: TenantType | string;
  registrationNumber: string;
  gstNumber: string;
  contactEmail: string;
  contactPhone: string;

  // 2. Address Details
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  timezone: string;
  currency: string;

  // 3. Inventory Setup
  numberOfBranches: number;

  // 4. Administration
  adminName: string;
  adminEmail: string;
  adminDesignation?: string;
  adminPassword?: string;

  status: StatusType;
  description?: string;
  organizations?: any[];
}
