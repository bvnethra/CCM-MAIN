export interface DocumentRecord {
  id: string;
  requestId: string;
  requestItemId?: string;
  documentType: 'COLLECTION_PROOF' | 'RECEIPT_PROOF' | 'PREVIOUS_CERTIFICATE' | 'VERIFICATION_PROOF' | 'CALIBRATION_CERTIFICATE' | 'DISPATCH_PROOF' | 'DELIVERY_PROOF' | 'OTHER';
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  uploadedDate: string;
  isMandatory: boolean;
  status: 'UPLOADED' | 'MISSING' | 'PENDING';
  url?: string;
}

export interface VerificationFormData {
  requestId: string;
  requestItemId: string;
  itemMatchStatus: 'MATCHED' | 'NOT_MATCHED';
  serialMatchStatus: 'MATCHED' | 'NOT_MATCHED' | 'NOT_APPLICABLE';
  expectedQuantity: number;
  receivedQuantity: number;
  quantityStatus: 'MATCHED' | 'SHORT' | 'EXCESS';
  condition: 'GOOD' | 'DAMAGED' | 'FAULTY' | 'OTHER';
  verificationResult: 'VERIFIED' | 'DISCREPANCY' | 'SHORT' | 'EXCEPTION';
  discrepancyReason?: string;
  remarks?: string;
  documents: DocumentRecord[];
}
