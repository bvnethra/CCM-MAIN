export type CalibrationOutcome = 'CALIBRATED' | 'FAULTY' | 'OUTSOURCE';

export interface CalibrationEntryFormData {
  requestId: string;
  requestItemId: string;
  measurementData: string;
  calibrationResult: CalibrationOutcome;
  calibrationDate: string;
  calibrationFrequencyMonths: number;
  nextDueDate: string;
  certificateNumber?: string;
  remarks?: string;

  // If FAULTY
  faultDescription?: string;
  serviceRequired?: string;
  estimatedCost?: number;

  // If OUTSOURCE
  vendorId?: string;
  vendorName?: string;
  outsourcingReason?: string;
  expectedReturnDate?: string;
}

export interface CalibrationDueItem {
  id: string;
  certificateNumber: string;
  clientName: string;
  itemName: string;
  serialNumber: string;
  calibrationDate: string;
  nextDueDate: string;
  daysRemaining: number;
  status: 'DUE_TODAY' | 'DUE_THIS_WEEK' | 'DUE_THIS_MONTH' | 'OVERDUE' | 'VALID';
}
