import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Edit3,
  Power,
  ShieldCheck,
  Calendar,
  User,
  Clock,
  History,
  Tag,
  Loader2,
} from 'lucide-react';
import { Vendor, VendorHistoryRollup } from '../../../types/vendor';
import { vendorService } from '../../../services/vendorService';
import { VendorHistory } from '../components/VendorHistory';
import { VendorStatusModal } from '../components/VendorStatusModal';
import { useNotification } from '../../../context/NotificationContext';
import { usePermission } from '../../../context/PermissionContext';
import { PERMISSION_CODES } from '../../../constants/permissions';

export const VendorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { hasPermission } = usePermission();

  const canEdit = hasPermission(PERMISSION_CODES.VENDOR_UPDATE);
  const canChangeStatus = hasPermission(PERMISSION_CODES.VENDOR_STATUS_UPDATE) || hasPermission(PERMISSION_CODES.VENDOR_UPDATE);
  const canViewHistory = hasPermission(PERMISSION_CODES.VENDOR_HISTORY_VIEW);

  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [history, setHistory] = useState<VendorHistoryRollup | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Load Vendor
  useEffect(() => {
    async function loadVendor() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await vendorService.getById(id, false);
        if (!data) {
          showToast('Vendor not found.', 'error');
          navigate('/vendors');
          return;
        }
        setVendor(data);
      } catch (err) {
        showToast('Error loading vendor profile.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadVendor();
  }, [id, navigate, showToast]);

  // Load History when history tab is active
  useEffect(() => {
    async function loadHistory() {
      if (activeTab === 'history' && id && !history) {
        setHistoryLoading(true);
        try {
          const hist = await vendorService.getVendorHistory(id);
          setHistory(hist);
        } catch (err) {
          console.warn('Failed to load history roll-up:', err);
        } finally {
          setHistoryLoading(false);
        }
      }
    }
    loadHistory();
  }, [activeTab, id, history]);

  const handleConfirmStatusToggle = async () => {
    if (!vendor) return;
    setStatusUpdating(true);
    const newStatus = vendor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await vendorService.updateStatus(vendor.id, newStatus);
      setVendor(updated);
      showToast(
        newStatus === 'ACTIVE'
          ? 'Vendor activated successfully.'
          : 'Vendor deactivated successfully.',
        'success'
      );
      setStatusModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Status update failed.', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading vendor profile...</p>
      </div>
    );
  }

  if (!vendor) return null;

  const code = vendor.vendor_code || vendor.vendorCode;
  const name = vendor.vendor_name || vendor.vendorName;
  const gstin = vendor.gstin_tax_id || vendor.gstNumber;
  const contact = vendor.contact_person || vendor.contactPersonName;
  const phone = vendor.phone || vendor.phoneNumber;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/vendors')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vendor Master
        </button>

        <div className="flex items-center space-x-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => navigate(`/vendors/edit/${vendor.id}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 rounded-lg text-xs font-semibold transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Vendor
            </button>
          )}

          {canChangeStatus && (
            <button
              type="button"
              onClick={() => setStatusModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                vendor.status === 'ACTIVE'
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {vendor.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </button>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 bg-purple-100 text-purple-700 rounded-2xl">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="font-mono text-xs font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                  {code}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    vendor.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      vendor.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  {vendor.status}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                External Calibration & Service Partner
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-3 pt-6 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'details'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Details
          </button>

          {canViewHistory && (
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'history'
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              History & Roll-Up
            </button>
          )}
        </div>

        {/* Tab 1: Details */}
        {activeTab === 'details' && (
          <div className="pt-6 space-y-8">
            {/* Primary Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Vendor Code */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Vendor Code
                </span>
                <span className="font-mono text-sm font-bold text-purple-900 mt-1 block">
                  {code}
                </span>
              </div>

              {/* GSTIN / Tax ID */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  GSTIN / Tax ID
                </span>
                <span className="font-mono text-sm font-bold text-slate-800 mt-1 block">
                  {gstin}
                </span>
              </div>

              {/* Status */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Account Status
                </span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">
                  {vendor.status}
                </span>
              </div>

              {/* Contact Person */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Contact Person
                </span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">
                  {contact}
                </span>
              </div>

              {/* Phone */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Phone
                </span>
                <span className="font-mono text-sm font-semibold text-slate-800 mt-1 block">
                  {phone}
                </span>
              </div>

              {/* Email */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Email
                </span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block break-all">
                  {vendor.email}
                </span>
              </div>
            </div>

            {/* Address Details */}
            <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-purple-600" />
                Physical Address & Location
              </span>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                {vendor.address}
              </p>
              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">City</span>
                  <strong className="text-slate-800">{vendor.city}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">State</span>
                  <strong className="text-slate-800">{vendor.state}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">PIN Code</span>
                  <strong className="font-mono text-slate-800">{vendor.pin || vendor.pincode}</strong>
                </div>
              </div>
            </div>

            {/* Serviced Item Categories */}
            <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-purple-600" />
                Item Categories Serviced
              </span>
              {vendor.categories && vendor.categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {vendor.categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="px-3 py-1 bg-purple-100 text-purple-800 border border-purple-200 rounded-full text-xs font-semibold shadow-xs"
                    >
                      {cat.category_name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No specific item categories mapped for this vendor.
                </p>
              )}
            </div>

            {/* Audit Information */}
            <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 text-xs text-slate-500 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  <strong>Created:</strong>{' '}
                  {new Date(vendor.created_at || vendor.createdAt || '').toLocaleString()}
                  {vendor.created_by_name && ` by ${vendor.created_by_name}`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  <strong>Last Modified:</strong>{' '}
                  {vendor.modified_at
                    ? `${new Date(vendor.modified_at).toLocaleString()}${
                        vendor.modified_by_name ? ` by ${vendor.modified_by_name}` : ''
                      }`
                    : 'Never modified'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: History Roll-Up */}
        {activeTab === 'history' && (
          <div className="pt-6">
            <VendorHistory history={history} loading={historyLoading} />
          </div>
        )}
      </div>

      {/* Deactivate/Activate Status Modal */}
      <VendorStatusModal
        isOpen={statusModalOpen}
        vendor={vendor}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={handleConfirmStatusToggle}
        isLoading={statusUpdating}
      />
    </div>
  );
};
