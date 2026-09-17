export interface CalibrationCertificate {
  id: string;
  certificateNumber: string;
  certificateDate: string;
  requestId: string;
  requestNumber: string;
  requestItemId: string;
  clientName: string;
  clientAddress: string;
  itemName: string;
  itemCode: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  calibrationDate: string;
  calibrationFrequencyMonths: number;
  nextDueDate: string;
  environmentalConditions: {
    temperature: string;
    humidity: string;
  };
  standardsUsed: string[];
  calibrationResult: 'PASS' | 'FAIL';
  calibratedBy: string;
  authorizedSignatory: string;
  documentUrl?: string;
}
