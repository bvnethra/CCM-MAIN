import { CalibrationEntryFormData, CalibrationDueItem } from '../types/calibration';
import { CalibrationCertificate } from '../types/certificate';
import { CalibrationRequest } from '../types/request';
import { mockStore } from '../mock/initialStore';
import { apiClient } from '../lib/api/apiClient';

export const calibrationService = {
  async submitCalibration(data: CalibrationEntryFormData): Promise<CalibrationRequest> {
    try {
      const payload = {
        requestItemId: data.requestItemId,
        calibrationDate: data.calibrationDate,
        calibrationResult: data.calibrationResult,
        measurementData: data.measurementData,
        certificateNumber: data.certificateNumber,
        remarks: data.remarks
      };
      await apiClient.post('/api/calibration/measurements', payload);
    } catch (err) {
      console.warn('calibrationService.submitCalibration API warning:', err);
    }
    const req = mockStore.data.requests.find((r) => r.id === data.requestId || r.requestNumber === data.requestId);
    if (!req) throw new Error('Request not found');

    const item = req.items.find((i) => i.id === data.requestItemId);
    if (!item) throw new Error('Item not found in request');

    item.calibrationDate = data.calibrationDate || new Date().toISOString().split('T')[0];
    item.measurementData = data.measurementData;
    item.calibrationStatus = data.calibrationResult;

    if (data.calibrationResult === 'CALIBRATED') {
      const certNum = data.certificateNumber || `CAL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      item.certificateNumber = certNum;
      item.calibrationFrequencyMonths = Number(data.calibrationFrequencyMonths) || 12;

      const d = new Date(item.calibrationDate);
      d.setMonth(d.getMonth() + item.calibrationFrequencyMonths);
      item.nextDueDate = data.nextDueDate || d.toISOString().split('T')[0];

      item.itemStatus = 'CALIBRATED';

      const allCalibrated = req.items.every((i) => i.itemStatus === 'CALIBRATED');
      const anyPending = req.items.some((i) => i.itemStatus === 'PENDING' || i.itemStatus === 'VERIFIED');

      if (allCalibrated) {
        req.status = 'CALIBRATED';
      } else if (anyPending) {
        req.status = 'PARTIALLY_COMPLETED';
      }
    } else if (data.calibrationResult === 'FAULTY') {
      item.itemStatus = 'FAULTY';
      item.faultDetails = {
        faultDescription: data.faultDescription || 'Item failed calibration tolerance specifications',
        serviceRequired: data.serviceRequired || 'Component inspection and realignment required',
        estimatedCost: Number(data.estimatedCost) || 0,
        clientApproval: 'PENDING',
        serviceStatus: 'PENDING',
        remarks: data.remarks,
      };
      req.status = 'FAULTY';
    } else if (data.calibrationResult === 'OUTSOURCE') {
      item.itemStatus = 'OUTSOURCED';
      item.outsourceDetails = {
        vendorId: data.vendorId || 'ven-001',
        vendorName: data.vendorName || 'External Accredited Lab',
        vendorPONumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
        outsourcingReason: data.outsourcingReason || 'Exceeds internal measurement capability',
        sendDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: data.expectedReturnDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      };
      req.status = 'OUTSOURCED';
    }

    req.updatedAt = new Date().toISOString();
    return { ...req };
  },

  async getDueList(filter?: 'ALL' | 'DUE_TODAY' | 'DUE_THIS_WEEK' | 'DUE_THIS_MONTH' | 'OVERDUE'): Promise<CalibrationDueItem[]> {
    try {
      const res = await apiClient.get('/api/calibration/due-list', { filter });
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((d: any) => ({
          id: d.id,
          certificateNumber: d.certificate_number || d.certificateNumber || `CAL-${d.id.substring(0, 6)}`,
          clientName: d.client_name || d.clientName || 'Client',
          itemName: d.item_name || d.itemName || 'Instrument',
          serialNumber: d.serial_number || d.serialNumber || 'SN-1001',
          calibrationDate: d.calibration_date || d.calibrationDate || '2025-09-15',
          nextDueDate: d.next_due_date || d.nextDueDate || '2026-09-15',
          status: d.status || 'DUE_TODAY',
          daysRemaining: Number(d.days_remaining || d.daysRemaining) || 0,
        }));
      }
    } catch (err) {
      console.warn('calibrationService.getDueList API fetch warning:', err);
    }
    const items = [...mockStore.data.dueList];
    if (!filter || filter === 'ALL') return items;
    return items.filter((item) => item.status === filter);
  },

  async getCertificate(certificateNumber: string): Promise<CalibrationCertificate | null> {
    for (const req of mockStore.data.requests) {
      const item = req.items.find((i) => i.certificateNumber === certificateNumber);
      if (item) {
        return {
          id: `cert-${certificateNumber}`,
          certificateNumber,
          certificateDate: item.calibrationDate || '2026-09-12',
          requestId: req.id,
          requestNumber: req.requestNumber,
          requestItemId: item.id,
          clientName: req.clientName,
          clientAddress: 'Industrial Area, India',
          itemName: item.itemName,
          itemCode: item.itemCode,
          serialNumber: item.serialNumber,
          manufacturer: item.manufacturer || 'Mitutoyo',
          model: item.model || 'Standard',
          calibrationDate: item.calibrationDate || '2026-09-12',
          calibrationFrequencyMonths: item.calibrationFrequencyMonths || 12,
          nextDueDate: item.nextDueDate || '2027-09-12',
          environmentalConditions: {
            temperature: '20.2 °C ± 0.5 °C',
            humidity: '48% RH ± 3%',
          },
          standardsUsed: [
            'Gauge Block Set (Class 0, Cert #NPL/2025/GB-88)',
            'Digital Surface Plate Comparator (Cert #NABL/2026/012)',
          ],
          calibrationResult: 'PASS',
          calibratedBy: 'Priya Sharma (Sr. Metrology Engineer)',
          authorizedSignatory: 'Dr. Vikram Malhotra (Quality Manager)',
          documentUrl: '#',
        };
      }
    }
    return null;
  },
};
