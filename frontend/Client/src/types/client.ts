export type ClientRole = 'CLIENT_ADMIN' | 'CLIENT_USER' | 'CLIENT_FINANCE';

export interface ClientUser {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  clientCode: string;
  role: ClientRole;
}

export interface ClientRequestItem {
  id: string;
  requestNumber: string;
  itemName: string;
  serialNumber: string;
  status: 'PENDING' | 'IN_LAB' | 'CALIBRATED' | 'DISPATCHED' | 'DELIVERED';
  submittedDate: string;
  expectedDeliveryDate: string;
  certificateUrl?: string;
}

export interface ClientInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  tax: number;
  total: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
}
