export type VendorStatus = 'ACTIVE' | 'INACTIVE';
export type CreditLevel = 'Excellent' | 'Good' | 'Average' | 'High Risk';

export interface ItemCategory {
  id: string;
  category_code: string;
  category_name: string;
  description?: string;
  status?: string;
}

export interface VendorItemCategory {
  id?: string;
  vendor_id?: string;
  item_category_id: string;
  category_code?: string;
  category_name?: string;
}

export interface PurchaseOrderHistory {
  po_number: string;
  po_date: string;
  status: string;
  amount?: number | null;
  outstanding_received_status: 'RECEIVED' | 'OUTSTANDING' | 'PENDING_DISPATCH' | string;
}

export interface ItemServicedHistory {
  item: string;
  item_code: string;
  service_calibration: string;
  service_date: string;
  status: string;
}

export interface OutstandingReceivedHistory {
  po_number: string;
  item: string;
  status: string;
  received_date?: string | null;
}

export interface VendorHistoryRollup {
  purchase_orders: PurchaseOrderHistory[];
  items_serviced: ItemServicedHistory[];
  outstanding_received: OutstandingReceivedHistory[];
}

export interface Vendor {
  id: string;
  tenant_id?: string;
  tenantId?: string;
  organization_id?: string;
  organizationId?: string;

  // 12 Required Fields
  vendor_code: string;
  vendorCode?: string;
  vendor_name: string;
  vendorName?: string;
  businessType?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  pin: string;
  pincode?: string;
  gstin_tax_id: string;
  gstNumber?: string;
  panNumber?: string;
  contact_person: string;
  contactPersonName?: string;
  phone: string;
  phoneNumber?: string;
  email: string;
  status: VendorStatus;
  categories?: ItemCategory[];
  item_category_ids?: string[];

  // Extended optional attributes
  creditScore?: number;
  creditLevel?: CreditLevel | string;
  paymentDetails?: string;
  termsAndConditions?: string;
  activePOCount?: number;

  // Audit Fields
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  createdAt?: string;
  modified_by?: string;
  modified_by_name?: string;
  modified_at?: string;
}

export interface VendorFormData {
  vendor_code?: string;
  vendorCode?: string;
  vendor_name: string;
  vendorName?: string;
  businessType?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  pin: string;
  pincode?: string;
  gstin_tax_id: string;
  gstNumber?: string;
  panNumber?: string;
  contact_person: string;
  contactPersonName?: string;
  phone: string;
  phoneNumber?: string;
  email: string;
  item_category_ids?: string[];
  status: VendorStatus;
  creditScore?: number;
  creditLevel?: CreditLevel | string;
  paymentDetails?: string;
  termsAndConditions?: string;
}

export interface VendorFilterParams {
  search?: string;
  status?: string;
  state?: string;
  categoryId?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VendorPagination {
  page: number;
  size: number;
  total: number;
  total_pages: number;
}

export interface VendorListResponse {
  vendors: Vendor[];
  pagination: VendorPagination;
}
