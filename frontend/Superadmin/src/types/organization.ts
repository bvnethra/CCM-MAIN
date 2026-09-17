export type CompanyType = 
  | 'Private Limited' 
  | 'Public Limited' 
  | 'Partnership' 
  | 'Proprietorship' 
  | 'LLP' 
  | 'Other';

export type BusinessType = 
  | 'Manufacturing' 
  | 'Service' 
  | 'Trading' 
  | 'Calibration' 
  | 'Laboratory' 
  | 'Other';

export interface Organization {
  id: string;
  tenantId: string;
  // Section A: Company Information
  companyName: string;
  companyCode: string;
  companyType: CompanyType;
  businessType: BusinessType;
  registrationNumber?: string;
  gstNumber?: string;
  companyEmail: string;
  companyPhone: string;
  
  // Section B: Address Details
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  timezone: string;
  currency: string;

  // Section C: Inventory Setup
  numberOfBranches: number;
  numberOfWarehouses: number;

  // Additional
  msmeNumber?: string;

  // Section D: Administrator Summary
  adminName: string;
  adminEmail: string;
  adminDesignation?: string;

  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdDate: string;
  usersCount: number;
}

export interface OrganizationFormData {
  tenantId: string;
  // Step 1: Company Information
  companyName: string;
  companyCode: string;
  companyType: CompanyType;
  businessType: BusinessType;
  registrationNumber?: string;
  gstNumber?: string;
  companyEmail: string;
  companyPhone: string;

  // Step 2: Address Details
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  timezone: string;
  currency: string;

  // Step 3: Inventory Setup
  numberOfBranches: number;
  numberOfWarehouses: number;
  msmeNumber?: string;

  // Step 4: Administrator
  adminName: string;
  adminEmail: string;
  adminDesignation?: string;
  password?: string;
  confirmPassword?: string;
}
