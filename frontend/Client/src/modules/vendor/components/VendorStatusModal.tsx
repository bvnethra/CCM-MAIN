import React from 'react';
import { AlertTriangle, Power, Loader2, X } from 'lucide-react';
import { Vendor } from '../../../types/vendor';

interface VendorStatusModalProps {
  isOpen: boolean;
  vendor: Vendor | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export const VendorStatusModal: React.FC<VendorStatusModalProps> = ({
  isOpen,
  vendor,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen || !vendor) return null;

  const isDeactivating = vendor.status === 'ACTIVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div
              className={`p-3 rounded-xl ${
                isDeactivating
                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}
            >
              {isDeactivating ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Power className="w-6 h-6" />
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isDeactivating
                ? 'Are you sure you want to deactivate this vendor?'
                : 'Activate Vendor Partner?'}
            </h3>
            <div className="mt-2 text-xs text-slate-600 space-y-1.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80">
              <p>
                <strong className="text-slate-800">Vendor:</strong>{' '}
                {vendor.vendor_name || vendor.vendorName} (
                <span className="font-mono text-purple-700">
                  {vendor.vendor_code || vendor.vendorCode}
                </span>
                )
              </p>
              {isDeactivating ? (
                <p className="text-rose-700 font-medium">
                  Once deactivated, this vendor will remain in the database for historical reporting, but will NOT be selectable for new outsourcing calibration work or Purchase Orders.
                </p>
              ) : (
                <p className="text-emerald-700 font-medium">
                  Activating this vendor allows lab and commercial users to select them for outsourcing calibrations.
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-md transition-all ${
                isDeactivating
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-500/20'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : isDeactivating ? (
                'Deactivate Vendor'
              ) : (
                'Activate Vendor'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
