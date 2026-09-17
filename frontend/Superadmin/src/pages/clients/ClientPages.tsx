import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Contact2,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  Eye,
  Trash2,
  Edit2,
  Save,
  CheckCircle,
  Hash,
  Globe,
  DollarSign,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Client, ClientFormData, ClientAccountStatus } from '../../types/client';
import { clientService } from '../../services/clientService';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TextInput, SelectInput } from '../../components/forms/FormControls';
import { useNotification } from '../../context/NotificationContext';
import { DeleteModal } from '../../components/modals/AppModals';
import { mockStore } from '../../mock/initialStore';

export const ClientListPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const navigate = useNavigate();
  const { showToast } = useNotification();

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await clientService.getAll();
      setClients(data);
    } catch {
      showToast('Unable to load clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleDelete = async () => {
    if (!clientToDelete) return;
    try {
      await clientService.delete(clientToDelete.id);
      showToast('Client removed successfully', 'info');
      setDeleteModalOpen(false);
      setClientToDelete(null);
      loadClients();
    } catch {
      showToast('Error deleting client', 'error');
    }
  };

  const columns: Column<Client>[] = [
    {
      key: 'clientCode',
      header: 'Code / ID',
      sortable: true,
      render: (c) => (
        <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-xs border border-teal-200/50">
          {c.clientCode}
        </span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client Info',
      sortable: true,
      render: (c) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs">{c.clientName}</span>
          <span className="text-[11px] text-slate-500 font-medium">{c.businessType}</span>
        </div>
      ),
    },
    {
      key: 'gstNumber',
      header: 'GST Number',
      render: (c) => (
        <span className="font-mono text-xs text-slate-700 font-semibold">
          {c.gstNumber || <span className="text-slate-400 font-normal italic">N/A</span>}
        </span>
      ),
    },
    {
      key: 'contactPersonName',
      header: 'Contact Person',
      render: (c) => (
        <div className="text-xs">
          <span className="font-medium text-slate-900 block">{c.contactPersonName}</span>
          <span className="text-[11px] text-slate-500 font-mono">{c.phone || c.phoneNumber}</span>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'Address / Location',
      render: (c) => (
        <div className="text-xs text-slate-600">
          <div>{c.city}, {c.state}</div>
          <span className="text-[10px] text-slate-400">{c.country || 'India'} - {c.pincode}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (c) => (
        <span className="text-xs text-slate-600">{c.email}</span>
      ),
    },
    {
      key: 'currency',
      header: 'Currency',
      render: (c) => (
        <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {c.currency || 'INR (₹)'}
        </span>
      ),
    },
    {
      key: 'accountStatus',
      header: 'Status',
      render: (c) => <StatusBadge status={c.accountStatus || 'Active'} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/clients/${c.id}`)}
            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setClientToDelete(c);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete Client"
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Client Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain industrial customer accounts, site locations, GST profiles, and commercial agreements.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/clients/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Onboard New Client
        </button>
      </div>

      <DataTable
        data={clients}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search clients by name, code, contact, GST..."
        onRowClick={(c) => navigate(`/clients/${c.id}`)}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Client Account"
        itemName={clientToDelete?.clientName}
        message="Deleting this client will archive historical records and disable incoming calibration requests."
      />
    </div>
  );
};

export const ClientOnboardingWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ClientFormData>({
    // Section 1: Client Info
    clientName: '',
    clientCode: '',
    businessType: 'Automotive Manufacturing',
    gstNumber: '',
    contactPersonName: '',

    // Section 2: Address
    email: '',
    phone: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: 'Karnataka',
    country: 'India',
    pincode: '',
    currency: 'INR (₹)',

    accountStatus: 'Active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useNotification();

  const validate = (curStep: number): boolean => {
    const errs: Record<string, string> = {};

    if (curStep === 1) {
      if (!formData.clientName.trim()) errs.clientName = 'Client name is required';
      if (!formData.clientCode.trim()) errs.clientCode = 'Client code is required';
      if (!formData.businessType.trim()) errs.businessType = 'Business type is required';
      if (!formData.contactPersonName.trim()) errs.contactPersonName = 'Contact person name is required';
      if (formData.gstNumber && formData.gstNumber.trim().length !== 15) {
        errs.gstNumber = 'GST number must be 15 alphanumeric characters';
      }
    } else if (curStep === 2) {
      if (!formData.email.trim()) errs.email = 'Email is required';
      if (!formData.phone.trim()) errs.phone = 'Phone number is required';
      if (!formData.address.trim()) errs.address = 'Address is required';
      if (!formData.city.trim()) errs.city = 'City is required';
      if (!formData.state.trim()) errs.state = 'State is required';
      if (!formData.country.trim()) errs.country = 'Country is required';
      if (!formData.pincode.trim()) errs.pincode = 'Pincode is required';
      if (!formData.currency.trim()) errs.currency = 'Currency is required';
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
      const created = await clientService.create({
        ...formData,
        phoneNumber: formData.phone,
      });
      showToast(`Client ${created.clientName} onboarded successfully!`, 'success');
      navigate(`/clients/${created.id}`);
    } catch {
      showToast('Failed to onboard client', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Client Info', icon: <Contact2 className="w-4 h-4" /> },
    { num: 2, title: 'Address Details', icon: <MapPin className="w-4 h-4" /> },
    { num: 3, title: 'Review & Confirm', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-teal-200/60">
            Client Onboarding Form
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1.5">New Client Onboarding</h1>
          <p className="text-xs text-slate-500">
            Register an industrial customer account with corporate client info and physical billing address.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/clients')}
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
                        ? 'bg-teal-600 text-white'
                        : isCurrent
                        ? 'bg-teal-600 text-white ring-4 ring-teal-100'
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
                        ? 'font-semibold text-teal-700'
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

      {/* Form Content */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-subtle">
        {/* SECTION 1: CLIENT INFO */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-teal-600">
                <Contact2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">1. Client Info</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Primary corporate details, unique customer identifier code, and authorized representative.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="1. Client Name"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="e.g. Tata Motors Limited"
                error={errors.clientName}
              />
              <TextInput
                label="2. Client Code"
                required
                value={formData.clientCode}
                onChange={(e) => setFormData({ ...formData, clientCode: e.target.value.toUpperCase() })}
                placeholder="e.g. CLI-TATA-01"
                helperText="Unique uppercase client identifier prefix"
                error={errors.clientCode}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectInput
                label="3. Business Type"
                required
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                options={[
                  { value: 'Automotive Manufacturing', label: 'Automotive Manufacturing' },
                  { value: 'Aerospace & Defence', label: 'Aerospace & Defence' },
                  { value: 'Precision Engineering', label: 'Precision Engineering' },
                  { value: 'Pharmaceuticals & Biotech', label: 'Pharmaceuticals & Biotech' },
                  { value: 'Oil, Gas & Energy', label: 'Oil, Gas & Energy' },
                  { value: 'Electronics & Semiconductors', label: 'Electronics & Semiconductors' },
                  { value: 'Heavy Machinery & Metals', label: 'Heavy Machinery & Metals' },
                  { value: 'Other Commercial Industry', label: 'Other Commercial Industry' },
                ]}
                error={errors.businessType}
              />
              <TextInput
                label="4. GST Number"
                value={formData.gstNumber || ''}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. 27AAACT2727Q1ZW"
                helperText="15-character GSTIN for billing and tax invoices"
                error={errors.gstNumber}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="5. Contact Person Name"
                required
                value={formData.contactPersonName}
                onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                placeholder="e.g. Anand Kulkarni"
                helperText="Authorized point of contact for calibration deliveries and quotations"
                error={errors.contactPersonName}
              />
              <SelectInput
                label="Account Status"
                value={formData.accountStatus || 'Active'}
                onChange={(e) => setFormData({ ...formData, accountStatus: e.target.value as ClientAccountStatus })}
                options={[
                  { value: 'Active', label: 'Active (Approved for Calibration)' },
                  { value: 'Inactive', label: 'Inactive' },
                  { value: 'Pending', label: 'Pending Compliance Review' },
                  { value: 'Suspended', label: 'Suspended' },
                ]}
              />
            </div>
          </div>
        )}

        {/* SECTION 2: ADDRESS */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-teal-600">
                <MapPin className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">2. Address & Regional Details</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Contact channels, physical facility address, location, and billing currency.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="1. Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="quality@client.com"
                error={errors.email}
              />
              <TextInput
                label="2. Phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value, phoneNumber: e.target.value })}
                placeholder="+91 20 6613 2000"
                error={errors.phone}
              />
            </div>

            <TextInput
              label="3. Address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Plot 12, Pimpri Works, Mumbai-Pune Highway"
              error={errors.address}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="4. City"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Pune"
                error={errors.city}
              />
              <TextInput
                label="5. State"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Maharashtra"
                error={errors.state}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                placeholder="e.g. 411018"
                error={errors.pincode}
              />
              <SelectInput
                label="8. Currency"
                required
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                options={[
                  { value: 'INR (₹)', label: 'INR (₹) - Indian Rupee' },
                  { value: 'USD ($)', label: 'USD ($) - US Dollar' },
                  { value: 'EUR (€)', label: 'EUR (€) - Euro' },
                  { value: 'GBP (£)', label: 'GBP (£) - British Pound' },
                  { value: 'AED (د.إ)', label: 'AED (د.إ) - UAE Dirham' },
                  { value: 'SGD ($)', label: 'SGD ($) - Singapore Dollar' },
                ]}
                error={errors.currency}
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
                Verify all client onboarding information across both sections before final registration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Section 1 Review */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Contact2 className="w-4 h-4 text-teal-600" />
                    1. Client Info
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] text-teal-600 font-semibold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">1. CLIENT NAME:</span>
                  <span className="font-bold text-slate-900 text-sm">{formData.clientName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">2. CLIENT CODE:</span>
                    <span className="font-mono font-bold text-teal-700">{formData.clientCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold">3. BUSINESS TYPE:</span>
                    <span className="text-slate-800 font-medium">{formData.businessType}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">4. GST NUMBER:</span>
                  <span className="font-mono font-semibold text-slate-800">{formData.gstNumber || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">5. CONTACT PERSON NAME:</span>
                  <span className="font-semibold text-slate-900">{formData.contactPersonName}</span>
                </div>
              </div>

              {/* Section 2 Review */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    2. Address Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-[11px] text-teal-600 font-semibold hover:underline cursor-pointer"
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
                    <span className="text-slate-400 block text-[10px] font-semibold">2. PHONE:</span>
                    <span className="font-mono text-slate-800 font-semibold">{formData.phone}</span>
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
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">8. CURRENCY:</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-200/60 px-2 py-0.5 rounded inline-block">
                    {formData.currency}
                  </span>
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
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition cursor-pointer"
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
                <span>{submitting ? 'Registering...' : 'Complete Client Onboarding'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      clientService.getById(id).then((c) => setClient(c));
    }
  }, [id]);

  if (!client) {
    return <div className="text-center py-12 text-xs text-slate-400">Loading client profile...</div>;
  }

  const clientRequests = mockStore.data.requests.filter((r) => r.clientId === client.id);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-mono font-bold text-2xl shadow-inner">
            {client.clientCode.split('-')[1] || client.clientCode.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900">{client.clientName}</h1>
              <StatusBadge status={client.accountStatus || 'Active'} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Code: <span className="font-mono font-bold text-teal-700">{client.clientCode}</span> • Business Type: {client.businessType}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/clients')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clients</span>
        </button>
      </div>

      {/* 2 Clean Detail Sections matching onboarding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Client Info */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-subtle space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
            <Contact2 className="w-4 h-4 text-teal-600" />
            1. Client Info
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">1. CLIENT NAME:</span>
              <span className="font-bold text-slate-900 text-sm">{client.clientName}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">2. CLIENT CODE:</span>
                <span className="font-mono font-bold text-teal-700">{client.clientCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">3. BUSINESS TYPE:</span>
                <span className="text-slate-800 font-medium">{client.businessType}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">4. GST NUMBER:</span>
              <span className="font-mono font-bold text-slate-800">
                {client.gstNumber || 'Not Provided'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">5. CONTACT PERSON NAME:</span>
              <span className="font-semibold text-slate-900 text-sm">{client.contactPersonName}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Address */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-subtle space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-teal-600" />
            2. Address & Regional Details
          </h2>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">1. EMAIL:</span>
                <span className="text-slate-800 font-medium">{client.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">2. PHONE:</span>
                <span className="font-mono text-slate-800 font-semibold">{client.phone || client.phoneNumber}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">3. ADDRESS:</span>
              <span className="text-slate-800 leading-relaxed block bg-slate-50 p-3 rounded-xl border border-slate-100">
                {client.address}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">4. CITY:</span>
                <span className="text-slate-800 font-medium">{client.city}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">5. STATE:</span>
                <span className="text-slate-800 font-medium">{client.state}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">6. COUNTRY:</span>
                <span className="text-slate-800">{client.country || 'India'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">7. PINCODE:</span>
                <span className="font-mono font-bold text-slate-800">{client.pincode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">8. CURRENCY:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded inline-block">
                  {client.currency || 'INR (₹)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Linked Calibration Orders */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-subtle space-y-3 text-xs">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>Active Calibration Requests ({clientRequests.length})</span>
          <button
            type="button"
            onClick={() => navigate('/collection')}
            className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Request</span>
          </button>
        </h3>
        {clientRequests.length === 0 ? (
          <div className="text-slate-400 py-6 text-center italic">
            No calibration requests currently active for this client account.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {clientRequests.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate(`/requests/${r.id}`)}
                className="py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-xl px-3 transition"
              >
                <div>
                  <span className="font-mono font-bold text-teal-700 block">{r.requestNumber}</span>
                  <span className="text-[10px] text-slate-400">{r.items.length} equipment items</span>
                </div>
                <StatusBadge status={r.status} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
