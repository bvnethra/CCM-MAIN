export type RequestWorkflowStatus = 
  | 'CREATED'
  | 'COLLECTED'
  | 'LAB_QUEUE'
  | 'VERIFICATION'
  | 'CALIBRATION'
  | 'CALIBRATED'
  | 'QUOTATION'
  | 'APPROVAL'
  | 'INVOICE'
  | 'CLIENT_SIGN'
  | 'READY_TO_DISPATCH'
  | 'DISPATCHED'
  | 'CLIENT_RECEIVED'
  | 'DELIVERY_SIGNED'
  | 'COMPLETED';

export type RequestExceptionStatus = 
  | 'ON_HOLD'
  | 'DISCREPANCY'
  | 'FAULTY'
  | 'OUTSOURCED'
  | 'PARTIALLY_COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type RequestStatus = RequestWorkflowStatus | RequestExceptionStatus;

export type RequestPriority = 'NORMAL' | 'URGENT';

export interface RequestItem {
  id: string;
  requestId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  manufacturer?: string;
  model?: string;
  serialNumber: string;
  requestedQuantity: number;
  receivedQuantity?: number;
  itemAvailable: 'YES' | 'NO';
  availabilityRemarks?: string;
  
  // Verification details
  itemMatchStatus?: 'MATCHED' | 'NOT_MATCHED';
  serialMatchStatus?: 'MATCHED' | 'NOT_MATCHED' | 'NOT_APPLICABLE';
  quantityStatus?: 'MATCHED' | 'SHORT' | 'EXCESS';
  condition?: 'GOOD' | 'DAMAGED' | 'FAULTY' | 'OTHER';
  verificationResult?: 'VERIFIED' | 'DISCREPANCY' | 'SHORT' | 'EXCEPTION';
  verificationRemarks?: string;

  // Calibration details
  calibrationStatus?: 'PENDING' | 'IN_PROGRESS' | 'CALIBRATED' | 'FAULTY' | 'OUTSOURCE';
  measurementData?: string;
  calibrationDate?: string;
  certificateNumber?: string;
  calibrationFrequencyMonths?: number;
  nextDueDate?: string;

  // Commercial
  standardCost: number;
  overrideCost?: number;
  overrideReason?: string;

  // Faulty / Outsource details
  faultDetails?: {
    faultDescription: string;
    serviceRequired: string;
    estimatedCost: number;
    clientApproval: 'PENDING' | 'APPROVED' | 'REJECTED';
    serviceStatus: 'PENDING' | 'IN_SERVICE' | 'COMPLETED';
    serviceCompletionDate?: string;
    remarks?: string;
  };
  outsourceDetails?: {
    vendorId: string;
    vendorName: string;
    vendorPONumber: string;
    outsourcingReason: string;
    sendDate: string;
    expectedReturnDate: string;
    actualReturnDate?: string;
    vendorResult?: string;
    certificateNumber?: string;
  };

  itemStatus: 'PENDING' | 'VERIFIED' | 'CALIBRATED' | 'FAULTY' | 'OUTSOURCED' | 'INVOICED' | 'DISPATCHED' | 'DELIVERED';
}

export interface CalibrationRequest {
  id: string;
  requestNumber: string;
  tenantId: string;
  organizationId: string;
  organizationName?: string;
  clientId: string;
  clientName: string;
  clientCode?: string;
  collectionAgentId: string;
  collectionAgentName: string;
  collectionDate: string;
  priority: RequestPriority;
  status: RequestStatus;
  remarks?: string;
  items: RequestItem[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  labReceivedDate?: string;
  verificationDate?: string;
  calibrationCompletedDate?: string;
  quotationId?: string;
  invoiceId?: string;
  dispatchId?: string;
}

export interface CreateRequestFormData {
  clientId: string;
  collectionDate: string;
  priority: RequestPriority;
  remarks?: string;
  items: {
    itemId: string;
    serialNumber: string;
    quantity: number;
    itemAvailable: 'YES' | 'NO';
    availabilityRemarks?: string;
  }[];
}
