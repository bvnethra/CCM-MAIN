import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Eye,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  Save,
  CheckCircle,
  Hash,
  Globe,
  User,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { Vendor, VendorFormData } from '../../types/vendor';
import { vendorService } from '../../services/vendorService';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TextInput, SelectInput } from '../../components/forms/FormControls';
import { useNotification } from '../../context/NotificationContext';
import { DeleteModal } from '../../components/modals/AppModals';
import { mockStore } from '../../mock/initialStore';

export const VendorListPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

  const navigate = useNavigate();
  const { showToast } = useNotification();

  const loadVendors = async () => {
    setLoading(true);
    try {
      const data = await vendorService.getAll();
      setVendors(data);
    } catch {
      showToast('Unable to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleDelete = async () => {
    if (!vendorToDelete) return;
    try {
      await vendorService.delete(vendorToDelete.id);
      showToast('Vendor removed successfully', 'info');
      setDeleteModalOpen(false);
      setVendorToDelete(null);
      loadVendors();
    } catch {
      showToast('Error deleting vendor', 'error');
    }
  };

  const columns: Column<Vendor>[] = [
    {
      key: 'vendorCode',
      header: 'Code / ID',
      sortable: true,
      render: (v) => (
        <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs border border-purple-200/50">
          {v.vendorCode}
        </span>
      ),
    },
    {
      key: 'vendorName',
      header: 'Vendor Info',
      sortable: true,
      render: (v) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs">{v.vendorName}</span>
          <span className="text-[11px] text-slate-500 font-medium">{v.businessType}</span>
        </div>
      ),
    },
    {
      key: 'contactPersonName',
      header: 'Contact Person',
      render: (v) => (
        <div className="text-xs">
          <span className="font-medium text-slate-900 block">{v.contactPersonName}</span>
          <span className="text-[11px] text-slate-500 font-mono">{v.phoneNumber || v.phone}</span>
        </div>
      ),
    },
    {
      key: 'gstNumber',
      header: 'Tax Identifiers',
      render: (v) => (
        <div className="text-xs space-y-0.5">
          {v.gstNumber && (
            <div className="font-mono text-[11px] text-slate-700 font-semibold">
              GST: {v.gstNumber}
            </div>
          )}
          {v.panNumber && (
            <div className="font-mono text-[10px] text-slate-500">
              PAN: {v.panNumber}
            </div>
          )}
          {!v.gstNumber && !v.panNumber && (
            <span className="text-slate-400 italic">None</span>
          )}
        </div>
      ),
    },
    {
      key: 'city',
      header: 'Address / Location',
      render: (v) => (
        <div className="text-xs text-slate-600">
          <div>{v.city}, {v.state}</div>
          <span className="text-[10px] text-slate-400">{v.country || 'India'} - {v.pincode}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (v) => <span className="text-xs text-slate-600">{v.email}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => <StatusBadge status={v.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (v) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/vendors/${v.id}`)}
            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setVendorToDelete(v);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete Vendor"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vendor Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage accredited external calibration suppliers, primary laboratories, and commercial terms.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/vendors/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Onboard New Vendor
        </button>
      </div>

      <DataTable
        data={vendors}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search vendors by name, code, contact, GST..."
        onRowClick={(v) => navigate(`/vendors/${v.id}`)}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Vendor Account"
        itemName={vendorToDelete?.vendorName}
        message="Deleting this vendor will archive historical records and subcontracting assignments."
      />
    </div>
  );
};

export const VendorOnboardingWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<VendorFormData>({
    // Section 1: Vendor Info
    vendorName: '',
    vendorCode: '',
    businessType: 'Dimensional Metrology & Standards',
    contactPersonName: '',
    gstNumber: '',
    panNumber: '',

    // Section 2: Address
    email: '',
    phoneNumber: '',
    phone: '',
    address: '',
    city: '',
    state: 'Karnataka',
    country: 'India',
    pincode: '',

    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useNotification();

  const validate = (curStep: number): boolean => {
    const errs: Record<string, string> = {};

    if (curStep === 1) {
      if (!formData.vendorName.trim()) errs.vendorName = 'Vendor name is required';
      if (!formData.vendorCode.trim()) errs.vendorCode = 'Vendor code is required';
      if (!formData.businessType.trim()) errs.businessType = 'Business type is required';
      if (!formData.contactPersonName.trim()) errs.contactPersonName = 'Contact person name is required';
      if (formData.gstNumber && formData.gstNumber.trim().length !== 15) {
        errs.gstNumber = 'GST number must be 15 alphanumeric characters';
      }
      if (formData.panNumber && formData.panNumber.trim().length !== 10) {
        errs.panNumber = 'PAN number must be 10 alphanumeric characters';
      }
    } else if (curStep === 2) {
      if (!formData.email.trim()) errs.email = 'Email is required';
      if (!formData.phoneNumber.trim()) errs.phoneNumber = 'Phone number is required';
      if (!formData.address.trim()) errs.address = 'Address is required';
      if (!formData.city.trim()) errs.city = 'City is required';
      if (!formData.state.trim()) errs.state = 'State is required';
      if (!formData.country.trim()) errs.country = 'Country is required';
      if (!formData.pincode.trim()) errs.pincode = 'Pincode is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate(step)) {
      setStep((prev) => Math.min(prev + 1, 3));
    } else {
      showToast('Please complete required fields before continuing', 'warning');
    }
  };

  const handleSubmit = async () => {
    if (!validate(1) || !validate(2)) {
      showToast('Please correct validation errors before submitting', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const created = await vendorService.create({
        ...formData,
        phone: formData.phoneNumber,
      });
      showToast(`Vendor ${created.vendorName} onboarded successfully!`, 'success');
      navigate(`/vendors/${created.id}`);
    } catch {
      showToast('Failed to onboard vendor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Vendor Info', icon: <Briefcase className="w-4 h-4" /> },
    { num: 2, title: 'Address Details', icon: <MapPin className="w-4 h-4" /> },
    { num: 3, title: 'Review & Confirm', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-purple-200/60">
            Vendor Onboarding Form
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1.5">New Vendor Onboarding</h1>
          <p className="text-xs text-slate-500">
            Register accredited sub-contractor laboratories, OEM suppliers, and reference standard providers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/vendors')}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>

      {/* Stepper Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-subtle overflow-x-auto">
        <div className="flex items-center justify-between min-w-[480px]">
          {stepsList.map((s, idx) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <div
                  className="flex items-center gap-2.5 cursor-pointer"
                  onClick={() => {
                    if (s.num < step) setStep(s.num);
                  }}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      isCompleted
                        ? 'bg-purple-600 text-white'
                        : isCurrent
                        ? 'bg-purple-600 text-white ring-4 ring-purple-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-xs ${
                      isCurrent
                        ? 'font-bold text-slate-900'
                        : isCompleted
                        ? 'font-semibold text-purple-700'
                        : 'text-slate-400 font-medium'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < stepsList.length - 1 && <div className="flex-1 h-0.5 bg-slate-200 mx-4" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-subtle">
        {/* SECTION 1: VENDOR INFO */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-purple-600">
                <Briefcase className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">1. Vendor Info</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vendor corporate entity, identifier code, metrology specialization, and tax registrations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="1. Vendor Name"
                required
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                placeholder="e.g. Fluke Calibration India Pvt Ltd"
                error={errors.vendorName}
              />
              <TextInput
                label="2. Vendor Code"
                required
                value={formData.vendorCode}
                onChange={(e) => setFormData({ ...formData, vendorCode: e.target.value.toUpperCase() })}
                placeholder="e.g. VEN-FLK-01"
                helperText="Unique uppercase vendor identifier prefix"
                error={errors.vendorCode}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectInput
                label="3. Business Type"
                required
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                options={[
                  { value: 'Dimensional Metrology & Standards', label: 'Dimensional Metrology & Standards' },
                  { value: 'Thermal & Temperature Calibration', label: 'Thermal & Temperature Calibration' },
                  { value: 'Electrical & Electronic Standards', label: 'Electrical & Electronic Standards' },
                  { value: 'Pressure & Vacuum Testing', label: 'Pressure & Vacuum Testing' },
                  { value: 'Mass & Volume Metrology', label: 'Mass & Volume Metrology' },
                  { value: 'Optical & Radiation Standards', label: 'Optical & Radiation Standards' },
                  { value: 'OEM Calibration Partner', label: 'OEM Calibration Partner' },
                  { value: 'Accredited Subcontract Laboratory', label: 'Accredited Subcontract Laboratory' },
                ]}
                error={errors.businessType}
              />
              <TextInput
                label="4. Contact Person Name"
                required
                value={formData.contactPersonName}
                onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                placeholder="e.g. Sanjay Deshmukh"
                helperText="Primary representative for subcontracting and technical coordination"
                error={errors.contactPersonName}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="5. GST Number"
                value={formData.gstNumber || ''}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. 29AAACF3344A1Z9"
                helperText="15-character GSTIN for billing and tax invoices"
                error={errors.gstNumber}
              />
              <TextInput
                label="6. PAN Number"
                value={formData.panNumber || ''}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. AAACF3344A"
                helperText="10-character Permanent Account Number"
                error={errors.panNumber}
              />
            </div>
          </div>
        )}

        {/* SECTION 2: ADDRESS */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-purple-600">
                <MapPin className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">2. Address Details</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vendor corporate email, telephone, facility address, and regional location.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="1. Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="calibration@vendor.com"
                error={errors.email}
              />
              <TextInput
                label="2. Phone Number"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value, phone: e.target.value })}
                placeholder="+91 80 4099 2200"
                error={errors.phoneNumber}
              />
            </div>

            <TextInput
              label="3. Address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Unit 4, Peenya Industrial Area Phase 2, Outer Ring Road"
              error={errors.address}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="4. City"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Bengaluru"
                error={errors.city}
              />
              <TextInput
                label="5. State"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Karnataka"
                error={errors.state}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="6. Country"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="India"
                error={errors.country}
              />
              <TextInput
                label="7. Pincode"
                required
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="e.g. 560058"
                error={errors.pincode}
              />
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & CONFIRM */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Review & Confirmation</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify all vendor onboarding details across both sections before final registration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Section 1 Review */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    1. Vendor Info
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] text-purple-600 font-semibold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">1. VENDOR NAME:</span>
                  <span className="font-bold text-slate-900 text-sm">{formData.vendorName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">2. VENDOR CODE:</span>
                    <span className="font-mono font-bold text-purple-700">{formData.vendorCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">3. BUSINESS TYPE:</span>
                    <span className="text-slate-800 font-medium">{formData.businessType}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">4. CONTACT PERSON NAME:</span>
                  <span className="font-semibold text-slate-900">{formData.contactPersonName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">5. GST NUMBER:</span>
                    <span className="font-mono font-semibold text-slate-800">{formData.gstNumber || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">6. PAN NUMBER:</span>
                    <span className="font-mono font-semibold text-slate-800">{formData.panNumber || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2 Review */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    2. Address Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-[11px] text-purple-600 font-semibold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">1. EMAIL:</span>
                    <span className="text-slate-800">{formData.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">2. PHONE NUMBER:</span>
                    <span className="font-mono text-slate-800 font-semibold">{formData.phoneNumber}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">3. ADDRESS:</span>
                  <span className="text-slate-800">{formData.address}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">4. CITY / 5. STATE:</span>
                    <span className="text-slate-800">{formData.city}, {formData.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">6. COUNTRY / 7. PINCODE:</span>
                    <span className="text-slate-800">{formData.country} - <span className="font-mono font-semibold">{formData.pincode}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((p) => p - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/20 transition cursor-pointer"
              >
                <span>Next: {stepsList[step]?.title || 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-7 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Registering...' : 'Complete Vendor Onboarding'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const VendorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      vendorService.getById(id).then((v) => setVendor(v));
    }
  }, [id]);

  if (!vendor) {
    return <div className="text-center py-12 text-xs text-slate-400">Loading vendor profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center font-mono font-bold text-2xl shadow-inner">
            {vendor.vendorCode.split('-')[1] || vendor.vendorCode.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900">{vendor.vendorName}</h1>
              <StatusBadge status={vendor.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Code: <span className="font-mono font-bold text-purple-700">{vendor.vendorCode}</span> • Specialization: {vendor.businessType}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/vendors')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vendors</span>
        </button>
      </div>

      {/* 2 Detail Sections matching onboarding form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Vendor Info */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-subtle space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
            <Briefcase className="w-4 h-4 text-purple-600" />
            1. Vendor Info
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">1. VENDOR NAME:</span>
              <span className="font-bold text-slate-900 text-sm">{vendor.vendorName}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">2. VENDOR CODE:</span>
                <span className="font-mono font-bold text-purple-700">{vendor.vendorCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">3. BUSINESS TYPE:</span>
                <span className="text-slate-800 font-medium">{vendor.businessType}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">4. CONTACT PERSON NAME:</span>
              <span className="font-semibold text-slate-900 text-sm">{vendor.contactPersonName}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">5. GST NUMBER:</span>
                <span className="font-mono font-bold text-slate-800">{vendor.gstNumber || 'Not Provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">6. PAN NUMBER:</span>
                <span className="font-mono font-bold text-slate-800">{vendor.panNumber || 'Not Provided'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Address */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-subtle space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-purple-600" />
            2. Address Details
          </h2>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">1. EMAIL:</span>
                <span className="text-slate-800 font-medium">{vendor.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">2. PHONE NUMBER:</span>
                <span className="font-mono text-slate-800 font-semibold">{vendor.phoneNumber || vendor.phone}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">3. ADDRESS:</span>
              <span className="text-slate-800 leading-relaxed block bg-slate-50 p-3 rounded-xl border border-slate-100">
                {vendor.address}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">4. CITY:</span>
                <span className="text-slate-800 font-medium">{vendor.city}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">5. STATE:</span>
                <span className="text-slate-800 font-medium">{vendor.state}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">6. COUNTRY:</span>
                <span className="text-slate-800">{vendor.country || 'India'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">7. PINCODE:</span>
                <span className="font-mono font-bold text-slate-800">{vendor.pincode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
