import React from 'react';
import {
  Plus,
  Trash2,
  Send,
  Receipt,
} from 'lucide-react';
import { RequestPriority } from '../../types/request';
import { TextInput, SelectInput, Textarea } from '../../components/forms/FormControls';

interface RequestDraftItem {
  tempId: string;
  itemId: string;
  serialNumber: string;
  quantity: number;
  itemAvailable: 'YES' | 'NO';
  availabilityRemarks?: string;
}

export interface CollectionViewProps {
  // Data
  clientsList: any[];
  itemsList: any[];

  // Form state
  clientId: string;
  collectionDate: string;
  priority: RequestPriority;
  remarks: string;
  selectedItemId: string;
  serialNumber: string;
  quantity: number;
  itemAvailable: 'YES' | 'NO';
  availabilityRemarks: string;
  draftItems: RequestDraftItem[];
  submitting: boolean;

  // Setters
  onClientIdChange: (val: string) => void;
  onCollectionDateChange: (val: string) => void;
  onPriorityChange: (val: RequestPriority) => void;
  onRemarksChange: (val: string) => void;
  onSelectedItemIdChange: (val: string) => void;
  onSerialNumberChange: (val: string) => void;
  onQuantityChange: (val: number) => void;
  onItemAvailableChange: (val: 'YES' | 'NO') => void;
  onAvailabilityRemarksChange: (val: string) => void;

  // Handlers
  onAddItem: () => void;
  onRemoveItem: (tempId: string) => void;
  onSubmit: () => void;
  onRaiseQuotation: () => void;
  onCancel: () => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({
  clientsList,
  itemsList,
  clientId,
  collectionDate,
  priority,
  remarks,
  selectedItemId,
  serialNumber,
  quantity,
  itemAvailable,
  availabilityRemarks,
  draftItems,
  submitting,
  onClientIdChange,
  onCollectionDateChange,
  onPriorityChange,
  onRemarksChange,
  onSelectedItemIdChange,
  onSerialNumberChange,
  onQuantityChange,
  onItemAvailableChange,
  onAvailabilityRemarksChange,
  onAddItem,
  onRemoveItem,
  onSubmit,
  onRaiseQuotation,
  onCancel,
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Field Intake Workflow
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Collection Module</h1>
          <p className="text-xs text-slate-500">
            Log on-site pickup of industrial measurement instruments and initiate parent request.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Request Header Parameters */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-subtle space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Request Information
          </h3>

          <SelectInput
            label="Select Client Entity"
            required
            value={clientId}
            onChange={(e) => onClientIdChange(e.target.value)}
            options={clientsList.map((c) => ({
              value: c.id,
              label: `${c.clientName} (${c.clientCode})`,
            }))}
          />

          <TextInput
            type="date"
            label="Collection Date"
            required
            value={collectionDate}
            onChange={(e) => onCollectionDateChange(e.target.value)}
          />

          <SelectInput
            label="Job Priority"
            required
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value as RequestPriority)}
            options={[
              { value: 'NORMAL', label: 'Normal Standard SLA (5-7 Days)' },
              { value: 'URGENT', label: 'Urgent Express SLA (24-48 Hours)' },
            ]}
          />

          <Textarea
            label="General Remarks / Pickup Instructions"
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            placeholder="e.g. Received with special wooden carrying cases from Tool Room Bay 2"
          />

          {/* Quotation Generation Action Field */}
          <div className="p-4 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 border border-emerald-200/90 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                Quotation Generation
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Instant Action
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Click below to generate a commercial quotation with standard calibration rates and 18% GST immediately for this request.
            </p>
            <button
              type="button"
              id="raise-quotation-field-btn"
              onClick={onRaiseQuotation}
              disabled={submitting || draftItems.length === 0}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>{submitting ? 'Raising Quotation...' : 'Raise Quotation'}</span>
            </button>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
            <span className="font-bold block mb-1">Architectural Rule:</span>
            One Request contains multiple Request Items. The parent request serves as the central lifecycle workspace.
          </div>
        </div>

        {/* Right 2 Columns: Add Items & Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Item Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. Add Item to Collection
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectInput
                label="Master Item Specification"
                required
                value={selectedItemId}
                onChange={(e) => onSelectedItemIdChange(e.target.value)}
                options={itemsList.map((i) => ({
                  value: i.id,
                  label: `${i.itemName} (${i.manufacturer} - ${i.measurementRange})`,
                }))}
              />
              <TextInput
                label="Physical Serial Number (Tag)"
                required
                value={serialNumber}
                onChange={(e) => onSerialNumberChange(e.target.value.toUpperCase())}
                placeholder="e.g. SN-TM-CAL-9921"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextInput
                type="number"
                label="Quantity"
                min={1}
                value={String(quantity)}
                onChange={(e) => onQuantityChange(Number(e.target.value) || 1)}
              />
              <SelectInput
                label="Physical Availability"
                value={itemAvailable}
                onChange={(e) => onItemAvailableChange(e.target.value as 'YES' | 'NO')}
                options={[
                  { value: 'YES', label: 'YES - Physically Collected' },
                  { value: 'NO', label: 'NO - Client Holding' },
                ]}
              />
              {itemAvailable === 'NO' ? (
                <TextInput
                  label="Availability Remarks"
                  required
                  value={availabilityRemarks}
                  onChange={(e) => onAvailabilityRemarksChange(e.target.value)}
                  placeholder="Reason for missing physical unit"
                />
              ) : (
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={onAddItem}
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
              )}
            </div>

            {itemAvailable === 'NO' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onAddItem}
                  className="py-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Unavailable Item
                </button>
              </div>
            )}
          </div>

          {/* Selected Items Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Collected Equipment Checklist ({draftItems.length})
              </h3>
              <span className="text-xs text-slate-400 font-mono">Ready for Dispatch to Lab</span>
            </div>

            {draftItems.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No items added yet. Use the form above to add instruments.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="px-5 py-3">Equipment Specification</th>
                      <th className="px-4 py-3">Serial Number</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3">Availability</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draftItems.map((di) => {
                      const itemObj = itemsList.find((i) => i.id === di.itemId);
                      return (
                        <tr key={di.tempId} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-3">
                            <span className="font-semibold text-slate-900 block">{itemObj?.itemName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{itemObj?.itemCode}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                            {di.serialNumber}
                          </td>
                          <td className="px-4 py-3 text-center font-bold font-mono">
                            {di.quantity}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                                di.itemAvailable === 'YES'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {di.itemAvailable}
                            </span>
                            {di.availabilityRemarks && (
                              <span className="block text-[10px] text-slate-400 mt-0.5">
                                {di.availabilityRemarks}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => onRemoveItem(di.tempId)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Remove Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Total Instruments:{' '}
                <strong className="text-slate-800">
                  {draftItems.reduce((a, c) => a + c.quantity, 0)}
                </strong>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="raise-quotation-footer-btn"
                  onClick={onRaiseQuotation}
                  disabled={submitting || draftItems.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{submitting ? 'Raising Quotation...' : 'Raise Quotation'}</span>
                </button>
                <button
                  type="button"
                  id="submit-request-btn"
                  onClick={onSubmit}
                  disabled={submitting || draftItems.length === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Create Request & Submit to Lab Queue'}
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
