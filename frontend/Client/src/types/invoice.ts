export type ApprovalActionType = 'APPROVE' | 'REJECT' | 'REVISE';

export interface ApprovalRecord {
  id: string;
  quotationId: string;
  quotationNumber: string;
  clientName: string;
  totalAmount: number;
  currency: string;
  createdBy: string;
  createdDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED';
  itemsCount: number;
  approverComments?: string;
  reviewedBy?: string;
  reviewedDate?: string;
}

export interface PurchaseOrderItem {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  serialNumber?: string;
  quantity: number;
  unitRate: number;
  totalAmount: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  requestId?: string;
  requestNumber?: string;
  poDate: string;
  expectedDate: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'ISSUED' | 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED';
  remarks?: string;
  documentUrl?: string;
}

export type InvoiceType = 'FULL_REQUEST' | 'PARTIAL' | 'INVOICE_ONLY';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'SIGNED' | 'PAID' | 'CANCELLED';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  clientId: string;
  clientName: string;
  requestId?: string;
  requestNumber?: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  isSigned: boolean;
  signatureDate?: string;
  notes?: string;
}
