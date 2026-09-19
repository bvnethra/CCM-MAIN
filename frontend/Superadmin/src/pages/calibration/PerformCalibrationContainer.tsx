import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalibrationOutcome } from '../../types/calibration';
import { useRequests } from '../../hooks';
import { useVendors } from '../../hooks';
import { useSubmitCalibration } from '../../hooks';
import { useNotification } from '../../context/NotificationContext';
import { PerformCalibrationPresenter } from './PerformCalibrationPresenter';

export const PerformCalibrationContainer: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [searchParams] = useSearchParams();

  const urlReqId = searchParams.get('reqId') ?? '';
  const urlItemId = searchParams.get('itemId') ?? '';

  // ── TanStack Query data ───────────────────────────────────────────────────
  const { data: requests, isLoading: isLoadingRequests } = useRequests();
  const { data: vendors, isLoading: isLoadingVendors } = useVendors();
  const submitCalibration = useSubmitCalibration();

  if (requests === null || requests === undefined) {
    // Will be undefined while loading; explicit null indicates an unexpected state
    if (!isLoadingRequests && requests === null) {
      throw new Error('No active user profile found');
    }
  }

  const requestList = requests ?? [];
  const vendorList = vendors ?? [];

  // ── Form state ────────────────────────────────────────────────────────────
  const [requestId, setRequestId] = useState('');
  const [requestItemId, setRequestItemId] = useState('');

  const [calibrationResult, setCalibrationResult] = useState<CalibrationOutcome>('CALIBRATED');
  const [measurementData, setMeasurementData] = useState(
    'Measured standard error within ±0.01mm tolerance across 5 test points. Passed.'
  );
  const [calibrationFrequencyMonths, setCalibrationFrequencyMonths] = useState(12);
  const [remarks, setRemarks] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [serviceRequired, setServiceRequired] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [vendorId, setVendorId] = useState('');
  const [outsourcingReason, setOutsourcingReason] = useState('');

  // ── Seed IDs from URL params once data loads ──────────────────────────────
  useEffect(() => {
    if (requestList.length === 0) return;

    if (urlReqId) {
      const found = requestList.find((r) => r.id === urlReqId);
      if (found) {
        setRequestId(found.id);
        const item = urlItemId
          ? found.items.find((i) => i.id === urlItemId)
          : found.items[0];
        setRequestItemId(item?.id ?? found.items[0]?.id ?? '');
        return;
      }
    }

    // Fallback: first request / first item
    setRequestId(requestList[0].id);
    setRequestItemId(requestList[0].items[0]?.id ?? '');
  }, [requestList, urlReqId, urlItemId]);

  useEffect(() => {
    if (vendorList.length > 0 && !vendorId) {
      setVendorId(vendorList[0].id);
    }
  }, [vendorList, vendorId]);

  // ── Request change handler ────────────────────────────────────────────────
  const handleRequestIdChange = (id: string) => {
    setRequestId(id);
    const req = requestList.find((r) => r.id === id);
    if (req && req.items.length > 0) {
      setRequestItemId(req.items[0].id);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestId || !requestItemId) {
      showToast('Please select a calibration request and instrument', 'warning');
      return;
    }

    const vendorObj = vendorList.find((v) => v.id === vendorId);
    const selectedReq = requestList.find((r) => r.id === requestId);
    const selectedItem = selectedReq?.items.find((i) => i.id === requestItemId);

    try {
      await submitCalibration.mutateAsync({
        requestId,
        requestItemId,
        measurementData,
        calibrationResult,
        calibrationDate: new Date().toISOString().split('T')[0],
        calibrationFrequencyMonths,
        nextDueDate: new Date(Date.now() + calibrationFrequencyMonths * 30 * 86400000)
          .toISOString()
          .split('T')[0],
        remarks,
        faultDescription,
        serviceRequired,
        estimatedCost,
        vendorId,
        vendorName: vendorObj?.vendorName,
        outsourcingReason,
      });

      showToast(
        `Calibration record submitted for ${selectedItem?.itemName || 'Instrument'}`,
        'success'
      );
      navigate('/lab/queue');
    } catch {
      showToast('Failed to record calibration test', 'error');
    }
  };

  const isLoading = isLoadingRequests || isLoadingVendors;

  return (
    <PerformCalibrationPresenter
      isLoading={isLoading}
      requests={requestList}
      vendors={vendorList}
      requestId={requestId}
      requestItemId={requestItemId}
      calibrationResult={calibrationResult}
      measurementData={measurementData}
      calibrationFrequencyMonths={calibrationFrequencyMonths}
      remarks={remarks}
      faultDescription={faultDescription}
      serviceRequired={serviceRequired}
      estimatedCost={estimatedCost}
      vendorId={vendorId}
      outsourcingReason={outsourcingReason}
      submitting={submitCalibration.isPending}
      onRequestIdChange={handleRequestIdChange}
      onRequestItemIdChange={setRequestItemId}
      onCalibrationResultChange={setCalibrationResult}
      onMeasurementDataChange={setMeasurementData}
      onCalibrationFrequencyMonthsChange={setCalibrationFrequencyMonths}
      onRemarksChange={setRemarks}
      onFaultDescriptionChange={setFaultDescription}
      onServiceRequiredChange={setServiceRequired}
      onEstimatedCostChange={setEstimatedCost}
      onVendorIdChange={setVendorId}
      onOutsourcingReasonChange={setOutsourcingReason}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/lab/queue')}
      onBack={() => navigate('/lab/queue')}
    />
  );
};
