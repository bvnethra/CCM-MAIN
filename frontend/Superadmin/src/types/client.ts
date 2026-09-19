// ============================================================================
// CLIENT MASTER TYPES - Enhanced for new requirements
// ============================================================================

// Status type
export type ClientStatus = 'ACTIVE' | 'INACTIVE';

// Payment terms type
export type PaymentTerms = 'IMMEDIATE' | '30_DAYS' | '60_DAYS';

// Main Client interface (matches database schema)
export interface Client {
  // Primary fields
  id: string;
  tenantId: string;
  organizationId: string;
  
  // Client identification
  clientCode: string;
  clientName: string;
  
  // Address information
  registeredAddress: string;
  billingAddress: string;
  city: string;
  state: string;
  pinCode: string;
  
  // Tax and contact
  gstinTaxId: string;
  contactPerson: string;
  phone: string;
  email: string;
  
  // Business fields
  status: ClientStatus;
  paymentTerms: PaymentTerms;
  
  // Audit fields
  createdBy: string;
  createdAt: string;
  modifiedBy?: string;
  modifiedAt?: string;
}

// Form data interface (for create/edit)
export interface ClientFormData {
  clientName: string;
  registeredAddress: string;
  billingAddress?: string;
  city: string;
  state: string;
  pinCode: string;
  gstinTaxId: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: ClientStatus;
  paymentTerms: PaymentTerms;
}

// Filters interface (for list page)
export interface ClientFilters {
  search?: string;
  status?: ClientStatus;
  city?: string;
  state?: string;
  paymentTerms?: PaymentTerms;
}

// List response interface (from RPC)
export interface ClientListResponse {
  clients: Client[];
  pagination: {
    page: number;
    size: number;
    total: number;
    total_pages: number;
  };
}

// Client details response (from RPC)
export interface ClientDetailsResponse {
  client: Client;
  history?: {
    requests: any[];
    quotations: any[];
    invoices: any[];
  };
}

// Duplicate check response
export interface GstinDuplicateResponse {
  is_duplicate: boolean;
  existing_client_id?: string;
  existing_client_name?: string;
  existing_client_code?: string;
}

export interface NameDuplicateResponse {
  is_duplicate: boolean;
  count: number;
}

// Create client RPC response
export interface CreateClientResponse {
  client: Client;
  has_name_duplicate_warning: boolean;
}

// ============================================================================
// LEGACY TYPES (for backward compatibility - can be removed later)
// ============================================================================

export type ClientAccountStatus = 'Active' | 'Inactive' | 'Pending' | 'Suspended';

export interface LegacyClient {
  id: string;
  tenantId: string;
  organizationId: string;
  clientName: string;
  clientCode: string;
  businessType: string;
  gstNumber?: string;
  contactPersonName: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  currency: string;
  accountStatus: ClientAccountStatus;
  activeRequestsCount?: number;
  createdAt: string;
  contactPersonContactNumber?: string;
  numberOfBranches?: number;
  numberOfWarehouses?: number;
  onboardingDate?: string;
  msmeNumber?: string;
}

export interface LegacyClientFormData {
  clientName: string;
  clientCode: string;
  businessType: string;
  gstNumber?: string;
  contactPersonName: string;
  email: string;
  phone: string;
  phoneNumber?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  currency: string;
  accountStatus?: ClientAccountStatus;
  contactPersonContactNumber?: string;
  numberOfBranches?: number;
  numberOfWarehouses?: number;
  onboardingDate?: string;
  msmeNumber?: string;
}
