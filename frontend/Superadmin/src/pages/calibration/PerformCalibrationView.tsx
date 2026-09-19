import React from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { CalibrationOutcome } from '../../types/calibration';
import { CalibrationRequest } from '../../types/request';
import { Vendor } from '../../types/vendor';
import { TextInput, SelectInput, Textarea } from '../../components/forms/FormControls';

export interface PerformCalibrationViewProps {
  // Data
  requests: CalibrationRequest[];
  vendors: Vendor[];

  // URL-seeded / selected IDs
  requestId: string;
  requestItemId: string;

  // Form fields
  calibrationResult: CalibrationOutcome;
  measurementData: string;
  calibrationFrequencyMonths: number;
  remarks: string;
  faultDescription: string;
  serviceRequired: string;
  estimatedCost: number;
  vendorId: string;
  outsourcingReason: string;

  // Submission state
  submitting: boolean;

  // Handlers
  onRequestIdChange: (id: string) => void;
  onRequestItemIdChange: (id: string) => void;
  onCalibrationResultChange: (result: CalibrationOutcome) => void;
  onMeasurementDataChange: (value: string) => void;
  onCalibrationFrequencyMonthsChange: (value: number) => void;
  onRemarksChange: (value: string) => void;
  onFaultDescriptionChange: (value: string) => void;
  onServiceRequiredChange: (value: string) => void;
  onEstimatedCostChange: (value: number) => void;
  onVendorIdChange: (id: string) => void;
  onOutsourcingReasonChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onBack: () => void;
}

export const PerformCalibrationView: React.FC<PerformCalibrationViewProps> = ({
  requests,
  vendors,
  requestId,
  requestItemId,
  calibrationResult,
  measurementData,
  calibrationFrequencyMonths,
  remarks,
  faultDescription,
  serviceRequired,
  estimatedCost,
  vendorId,
  outsourcingReason,
  submitting,
  onRequestIdChange,
  onRequestItemIdChange,
  onCalibrationResultChange,
  onMeasurementDataChange,
  onCalibrationFrequencyMonthsChange,
  onRemarksChange,
  onFaultDescriptionChange,
  onServiceRequiredChange,
  onEstimatedCostChange,
  onVendorIdChange,
  onOutsourcingReasonChange,
  onSubmit,
  onCancel,
  onBack,
}) => {
  const selectedReq = requests.find((r) => r.id === requestId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Calibration Queue
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Record Calibration Test Sheet</h1>
          <p className="text-xs text-slate-500 mt-1">
            Log technical measurement data, evaluation outcome, NABL certificate details, or exceptions.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectInput
              label="Calibration Request Order"
              value={requestId}
              onChange={(e) => onRequestIdChange(e.target.value)}
              options={requests.map((r) => ({
                value: r.id,
                label: `${r.requestNumber} - ${r.clientName}`,
              }))}
            />

            {selectedReq && (
              <SelectInput
                label="Target Instrument / Equipment"
                value={requestItemId}
                onChange={(e) => onRequestItemIdChange(e.target.value)}
                options={selectedReq.items.map((i) => ({
                  value: i.id,
                  label: `${i.itemName} (SN: ${i.serialNumber || 'N/A'})`,
                }))}
              />
            )}
          </div>

          <SelectInput
            label="Calibration Outcome / Result"
            value={calibrationResult}
            onChange={(e) => onCalibrationResultChange(e.target.value as CalibrationOutcome)}
            options={[
              { value: 'CALIBRATED', label: '✅ Calibrated & Passed (Generate NABL Certificate)' },
              { value: 'FAULTY', label: '⚠️ Faulty / Repair Service Required' },
              { value: 'OUTSOURCE', label: '🚚 Outsource to Accredited Partner Vendor' },
            ]}
          />

          {calibrationResult === 'CALIBRATED' && (
            <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <Textarea
                label="Measurement Test Data & Observations"
                value={measurementData}
                onChange={(e) => onMeasurementDataChange(e.target.value)}
                placeholder="Log test point values, standard deviation, expanded uncertainty..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  type="number"
                  label="Calibration Cycle (Months)"
                  value={String(calibrationFrequencyMonths)}
                  onChange={(e) => onCalibrationFrequencyMonthsChange(Number(e.target.value) || 12)}
                />
                <Textarea
                  label="Calibration Certificate Remarks"
                  value={remarks}
                  onChange={(e) => onRemarksChange(e.target.value)}
                  placeholder="Environmental conditions: 20°C ± 1°C, RH 50% ± 5%..."
                />
              </div>
            </div>
          )}

          {calibrationResult === 'FAULTY' && (
            <div className="space-y-4 p-4 bg-rose-50/50 border border-rose-200 rounded-xl text-xs">
              <h3 className="font-bold text-rose-900">Faulty Equipment Incident Log</h3>
              <Textarea
                label="Fault Description"
                required
                value={faultDescription}
                onChange={(e) => onFaultDescriptionChange(e.target.value)}
                placeholder="Describe mechanical wear, zero error, damaged sensor, or calibration failure..."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  label="Required Repair Service"
                  value={serviceRequired}
                  onChange={(e) => onServiceRequiredChange(e.target.value)}
                  placeholder="e.g. Replace spindle screw & recalibrate"
                />
                <TextInput
                  type="number"
                  label="Estimated Repair Cost (₹)"
                  value={String(estimatedCost)}
                  onChange={(e) => onEstimatedCostChange(Number(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {calibrationResult === 'OUTSOURCE' && (
            <div className="space-y-4 p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-xs">
              <h3 className="font-bold text-amber-900">Outsourcing Dispatch Details</h3>
              <SelectInput
                label="Accredited Partner Vendor"
                value={vendorId}
                onChange={(e) => onVendorIdChange(e.target.value)}
                options={vendors.map((v) => ({
                  value: v.id,
                  label: `${v.vendorName} (${v.vendorCode})`,
                }))}
              />
              <Textarea
                label="Outsourcing Justification / Notes"
                value={outsourcingReason}
                onChange={(e) => onOutsourcingReasonChange(e.target.value)}
                placeholder="Range exceeds internal lab capability scope; sent to NABL external lab..."
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Record Test Result</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
