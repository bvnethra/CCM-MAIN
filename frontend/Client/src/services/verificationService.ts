import { VerificationFormData } from '../types/verification';
import { CalibrationRequest } from '../types/request';
import { mockStore } from '../mock/initialStore';
import { documentService } from './documentService';

export const verificationService = {
  async submitVerification(data: VerificationFormData): Promise<CalibrationRequest> {
    await new Promise((res) => setTimeout(res, 250));

    // Mandatory document check blocker
    const docCheck = await documentService.checkMandatoryDocuments(data.requestId);
    if (!docCheck.valid) {
      throw new Error(`Verification blocked: Mandatory documents missing (${docCheck.missing.join(', ')}). Please upload proof documents before verifying.`);
    }

    const req = mockStore.data.requests.find((r) => r.id === data.requestId || r.requestNumber === data.requestId);
    if (!req) throw new Error('Request not found');

    const item = req.items.find((i) => i.id === data.requestItemId);
    if (!item) throw new Error('Item not found in request');

    item.itemMatchStatus = data.itemMatchStatus;
    item.serialMatchStatus = data.serialMatchStatus;
    item.receivedQuantity = data.receivedQuantity;
    item.quantityStatus = data.quantityStatus;
    item.condition = data.condition;
    item.verificationResult = data.verificationResult;
    item.verificationRemarks = data.remarks || data.discrepancyReason;
    item.itemStatus = data.verificationResult === 'VERIFIED' ? 'VERIFIED' : 'PENDING';

    req.verificationDate = new Date().toISOString().split('T')[0];

    // Check if all items in request are verified
    const allVerified = req.items.every((i) => i.itemStatus === 'VERIFIED');
    const hasDiscrepancy = req.items.some((i) => i.verificationResult === 'DISCREPANCY' || i.verificationResult === 'SHORT');

    if (hasDiscrepancy) {
      req.status = 'DISCREPANCY';
    } else if (allVerified) {
      req.status = 'CALIBRATION'; // ready for calibration
    }

    req.updatedAt = new Date().toISOString();
    return { ...req };
  },
};
