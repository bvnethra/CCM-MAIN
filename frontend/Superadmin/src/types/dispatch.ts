export type SignatureType = 'INVOICE' | 'DELIVERY';
export type SignatureStatus = 'PENDING' | 'SIGNED' | 'REJECTED';

export interface DigitalSignature {
  id: string;
  type: SignatureType;
  referenceId: string; // invoiceId or dispatchId / deliveryId
  referenceNumber: string; // e.g. INV-2026-001 or DEL-2026-001
  clientId: string;
  clientName: string;
  signatoryName: string;
  signatoryDesignation?: string;
  signatureData?: string; // Data URL or base64
  signedDate?: string;
  status: SignatureStatus;
  remarks?: string;
  ipAddress?: string;
}

export interface DispatchItem {
  id: string;
  requestItemId: string;
  itemName: string;
  serialNumber: string;
  quantity: number;
}

export interface DispatchRecord {
  id: string;
  dispatchNumber: string;
  requestId: string;
  requestNumber: string;
  clientId: string;
  clientName: string;
  dispatchDate: string;
  transportMode: 'COURIER' | 'HAND_DELIVERY' | 'LOGISTICS_PARTNER' | 'CLIENT_PICKUP';
  courierName?: string;
  trackingNumber?: string;
  contactPerson: string;
  deliveryAddress: string;
  items: DispatchItem[];
  totalPackages: number;
  proofDocumentUrl?: string;
  status: 'PACKED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
  remarks?: string;
}

export interface DeliveryRecord {
  id: string;
  deliveryNumber: string;
  dispatchId: string;
  dispatchNumber: string;
  requestId: string;
  requestNumber: string;
  clientId: string;
  clientName: string;
  dispatchDate: string;
  receivedDate?: string;
  recipientName?: string;
  recipientPhone?: string;
  status: 'IN_TRANSIT' | 'RECEIVED' | 'SIGNATURE_CAPTURED';
  signatureId?: string;
  deliveryProofUrl?: string;
  remarks?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  tenantId: string;
  organizationId: string;
  module: string;
  action: string;
  recordId: string;
  recordIdentifier: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  result: 'SUCCESS' | 'FAILURE';
}
