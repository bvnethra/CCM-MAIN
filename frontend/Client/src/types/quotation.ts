export interface QuotationItem {
  id: string;
  clientId?: string;
  clientName?: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  description?: string;
  standardCost: number;
  overrideCost?: number;
  overrideReason?: string;
  quantity: number;
  taxRate: number; // e.g. 18%
  totalAmount: number;
}

export type QuotationStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED' | 'SENT_TO_CLIENT';

export interface Quotation {
  id: string;
  quotationNumber: string;
  requestId?: string;
  requestNumber?: string;
  clientId: string;
  clientName: string;
  quotationDate: string;
  validUntil: string;
  currency: string;
  status: QuotationStatus;
  items: QuotationItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  remarks?: string;
  createdBy: string;
  createdAt: string;
  approvalRemarks?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface QuotationFormData {
  clientId: string;
  requestId?: string;
  validUntil: string;
  currency: string;
  discountAmount: number;
  remarks?: string;
  items: {
    itemId: string;
    itemName: string;
    itemCode: string;
    description?: string;
    standardCost: number;
    overrideCost?: number;
    overrideReason?: string;
    quantity: number;
    taxRate: number;
  }[];
}
