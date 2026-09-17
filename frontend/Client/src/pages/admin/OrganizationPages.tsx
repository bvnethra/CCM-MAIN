import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  Power,
  Trash2,
  Building2,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  MapPin,
  Warehouse,
  GitFork,
  Save,
} from 'lucide-react';
import { Organization, OrganizationFormData, CompanyType, BusinessType } from '../../types/organization';
import { organizationService } from '../../services/organizationService';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TextInput, SelectInput, NumberInput, PasswordInput, Textarea } from '../../components/forms/FormControls';
import { useNotification } from '../../context/NotificationContext';
import { DeleteModal } from '../../components/modals/AppModals';
import { mockStore } from '../../mock/initialStore';

export const OrganizationListPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);

  const navigate = useNavigate();
  const { showToast } = useNotification();

  const loadOrgs = async () => {
    setLoading(true);
    try {
      const data = await organizationService.getAll();
      setOrganizations(data);
    } catch {
      showToast('Unable to load organizations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const handleToggleStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await organizationService.toggleStatus(id);
      showToast(`Organization set to ${updated.status}`, 'info');
      loadOrgs();
    } catch {
      showToast('Error updating status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!orgToDelete) return;
    try {
      await organizationService.delete(orgToDelete.id);
      showToast('Organization deleted successfully', 'info');
      setDeleteModalOpen(false);
      setOrgToDelete(null);
      loadOrgs();
    } catch {
      showToast('Error deleting organization', 'error');
    }
  };

  const columns: Column<Organization>[] = [
    {
      key: 'companyCode',
      header: 'Code / ID',
      sortable: true,
      render: (o) => (
        <div>
          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
            {o.companyCode}
          </span>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{o.id}</div>
        </div>
      ),
    },
    {
      key: 'companyName',
      header: 'Organization / Company Name',
      sortable: true,
      render: (o) => (
        <div>
          <span className="font-semibold text-slate-900 block">{o.companyName}</span>
          <span className="text-[11px] text-slate-500">
            {o.companyType} • {o.businessType}
          </span>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'Location',
      render: (o) => (
        <span className="text-xs text-slate-700">
          {o.city}, {o.state}
        </span>
      ),
    },
    {
      key: 'gstNumber',
      header: 'GST Number',
      render: (o) => (
        <span className="font-mono text-xs font-semibold text-slate-600">{o.gstNumber || 'N/A'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <StatusBadge status={o.status} size="sm" />,
    },
    {
      key: 'usersCount',
      header: 'Staff',
      sortable: true,
      render: (o) => (
        <span className="font-mono text-xs font-semibold text-slate-700">{o.usersCount} Users</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (o) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/admin/organizations/${o.id}`)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => handleToggleStatus(o.id, e)}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition"
            title={o.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOrgToDelete(o);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete"
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Organization Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organizations are automatically provisioned and managed under each onboarded Enterprise Tenant.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/tenants/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Building2 className="w-4 h-4" />
          Onboard New Tenant
        </button>
      </div>

      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950">
          <span className="font-semibold block text-emerald-900 mb-0.5">Automatic Organization Provisioning</span>
          When you onboard a Tenant, an Organization is automatically created and populated with matching credentials and facility data. No separate onboarding form is required.
        </div>
      </div>

      <DataTable
        data={organizations}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search organizations by name, code, GST, city..."
        onRowClick={(o) => navigate(`/admin/organizations/${o.id}`)}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Organization"
        itemName={orgToDelete?.companyName}
        message="Deleting this organization will remove all associated user assignments and master data."
      />
    </div>
  );
};

export const OrganizationOnboardingWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OrganizationFormData>({
    tenantId: 'ten-001',
    // Step 1: Company Information
    companyName: '',
    companyCode: '',
    companyType: 'Private Limited',
    businessType: 'Calibration',
    registrationNumber: '',
    gstNumber: '',
    companyEmail: '',
    companyPhone: '',

    // Step 2: Address Details
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Karnataka',
    country: 'India',
    pincode: '',
    timezone: 'Asia/Kolkata (IST)',
    currency: 'INR (₹)',

    // Step 3: Inventory Setup
    numberOfBranches: 1,
    numberOfWarehouses: 1,
    msmeNumber: '',

    // Step 4: Administrator
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useNotification();

  // Password Strength Calculator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const pwdScore = getPasswordStrength(formData.password || '');

  // Step validation
  const validateStep = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.companyName.trim()) errs.companyName = 'Company name is required';
      if (!formData.companyCode.trim()) errs.companyCode = 'Company Code / ID is required';
      if (!formData.companyEmail.trim()) errs.companyEmail = 'Company email is required';
      if (!formData.companyPhone.trim()) errs.companyPhone = 'Phone number is required';
    } else if (currentStep === 2) {
      if (!formData.addressLine1.trim()) errs.addressLine1 = 'Address line 1 is required';
      if (!formData.city.trim()) errs.city = 'City is required';
      if (!formData.state.trim()) errs.state = 'State is required';
      if (!formData.pincode.trim()) errs.pincode = 'Pincode is required';
    } else if (currentStep === 4) {
      if (!formData.adminName.trim()) errs.adminName = 'Administrator name is required';
      if (!formData.adminEmail.trim()) errs.adminEmail = 'Administrator email is required';
      if (!formData.password || formData.password.length < 8)
        errs.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.confirmPassword)
        errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrevious = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSaveDraft = () => {
    showToast('Onboarding progress saved as local draft', 'info');
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setStep(4);
      return;
    }

    setSubmitting(true);
    try {
      const created = await organizationService.create(formData);
      showToast(`Organization ${created.companyName} onboarded successfully!`, 'success');
      navigate(`/admin/organizations/${created.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to onboard organization', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Company Information' },
    { num: 2, title: 'Address Details' },
    { num: 3, title: 'Inventory Setup' },
    { num: 4, title: 'Administrator' },
    { num: 5, title: 'Review & Submit' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Multi-Step Wizard
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Organization / Company Onboarding</h1>
          <p className="text-xs text-slate-500">
            Set up a calibration company entity and create initial administrator credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/organizations')}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Wizard Stepper Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-subtle overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px]">
          {stepsList.map((s, idx) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;

            return (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
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
                        ? 'font-semibold text-emerald-700'
                        : 'text-slate-400 font-medium'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {idx < stepsList.length - 1 && <div className="flex-1 h-0.5 bg-slate-200 mx-3" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-subtle">
        {/* STEP 1: SECTION A — COMPANY INFORMATION */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Section A — Company Information</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter legal registered name, business registration code, and corporate contact details.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Company Name"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. Apex Precision Labs Bangalore Pvt Ltd"
                error={errors.companyName}
              />
              <TextInput
                label="Company ID / Code"
                required
                value={formData.companyCode}
                onChange={(e) => setFormData({ ...formData, companyCode: e.target.value.toUpperCase() })}
                placeholder="e.g. APX-BLR"
                helperText="Short alphanumeric code used as prefix across certificates"
                error={errors.companyCode}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectInput
                label="Company Type"
                required
                value={formData.companyType}
                onChange={(e) => setFormData({ ...formData, companyType: e.target.value as CompanyType })}
                options={[
                  { value: 'Private Limited', label: 'Private Limited' },
                  { value: 'Public Limited', label: 'Public Limited' },
                  { value: 'Partnership', label: 'Partnership' },
                  { value: 'Proprietorship', label: 'Proprietorship' },
                  { value: 'LLP', label: 'LLP' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
              <SelectInput
                label="Business Type"
                required
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value as BusinessType })}
                options={[
                  { value: 'Calibration', label: 'Calibration Laboratory' },
                  { value: 'Laboratory', label: 'Testing & Calibration' },
                  { value: 'Manufacturing', label: 'Manufacturing' },
                  { value: 'Service', label: 'Metrology Services' },
                  { value: 'Trading', label: 'Trading & Distribution' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Registration Number (CIN / ROC)"
                value={formData.registrationNumber || ''}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="e.g. U74999KA2020PTC139822"
              />
              <TextInput
                label="GST Number"
                value={formData.gstNumber || ''}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. 29AAACA1234F1Z5"
                helperText="Captured once here and shared across commercial modules"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Company Email"
                type="email"
                required
                value={formData.companyEmail}
                onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                placeholder="bangalore.lab@apexmetrology.com"
                error={errors.companyEmail}
              />
              <TextInput
                label="Company Phone Number"
                required
                value={formData.companyPhone}
                onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                placeholder="+91 80 4123 7890"
                error={errors.companyPhone}
              />
            </div>
          </div>
        )}

        {/* STEP 2: SECTION B — ADDRESS DETAILS */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Section B — Address Details</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical premises and laboratory location for sample delivery & logistics.
              </p>
            </div>

            <TextInput
              label="Address Line 1"
              required
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              placeholder="e.g. Plot 42, Electronic City Phase 1"
              error={errors.addressLine1}
            />

            <TextInput
              label="Address Line 2 (Optional)"
              value={formData.addressLine2 || ''}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              placeholder="e.g. Hosur Road, Near Tech Park"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextInput
                label="City"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Bengaluru"
                error={errors.city}
              />
              <TextInput
                label="State"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Karnataka"
                error={errors.state}
              />
              <TextInput
                label="Pincode"
                required
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="e.g. 560100"
                error={errors.pincode}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextInput
                label="Country"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="India"
              />
              <TextInput
                label="Timezone"
                required
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                placeholder="Asia/Kolkata (IST)"
              />
              <TextInput
                label="Currency"
                required
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="INR (₹)"
              />
            </div>
          </div>
        )}

        {/* STEP 3: SECTION C — INVENTORY SETUP & MSME */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Section C — Inventory Setup & MSME</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure physical holding branches and equipment staging locations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                type="number"
                label="Number of Branches"
                min={1}
                value={String(formData.numberOfBranches)}
                onChange={(e) => setFormData({ ...formData, numberOfBranches: Number(e.target.value) || 1 })}
                helperText="Physical offices or collection centers operating under this entity"
              />
              <TextInput
                type="number"
                label="Number of Warehouses"
                min={1}
                value={String(formData.numberOfWarehouses)}
                onChange={(e) => setFormData({ ...formData, numberOfWarehouses: Number(e.target.value) || 1 })}
                helperText="Dedicated instrument holding vaults or pre-calibration storage facilities"
              />
            </div>

            <div className="pt-2">
              <TextInput
                label="MSME Number / Status (Optional)"
                value={formData.msmeNumber || ''}
                onChange={(e) => setFormData({ ...formData, msmeNumber: e.target.value })}
                placeholder="e.g. UDYAM-KR-03-0028192"
                helperText="Enter government Udyam registration if qualified as micro, small or medium enterprise"
              />
            </div>
          </div>
        )}

        {/* STEP 4: SECTION D — ADMINISTRATOR */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Section D — Initial Administrator</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Create primary administrative account for managing organization users, lab queue, and pricing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Administrator Full Name"
                required
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                placeholder="e.g. Nethra BV"
                error={errors.adminName}
              />
              <TextInput
                label="Administrator Corporate Email"
                type="email"
                required
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                placeholder="bvnethra2005@gmail.com"
                error={errors.adminEmail}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordInput
                label="Administrator Password"
                required
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••"
                error={errors.password}
                helperText="Minimum 8 characters with letters, numbers, and symbols"
              />
              <PasswordInput
                label="Confirm Password"
                required
                value={formData.confirmPassword || ''}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••••••"
                error={errors.confirmPassword}
              />
            </div>

            {/* Password strength meter */}
            {formData.password && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Password Strength:</span>
                  <span
                    className={`font-semibold ${
                      pwdScore >= 3 ? 'text-emerald-600' : pwdScore === 2 ? 'text-amber-600' : 'text-rose-600'
                    }`}
                  >
                    {pwdScore >= 4 ? 'Very Strong' : pwdScore === 3 ? 'Strong' : pwdScore === 2 ? 'Fair' : 'Weak'}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full flex-1 ${pwdScore >= 1 ? 'bg-rose-500' : 'bg-slate-200'}`} />
                  <div className={`h-full flex-1 ${pwdScore >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                  <div className={`h-full flex-1 ${pwdScore >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  <div className={`h-full flex-1 ${pwdScore >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Step 5: Review & Submit Organization</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify all sections before committing to the database.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Section A: Company Information
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-semibold text-slate-800">{formData.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Code / ID:</span>
                  <span className="font-mono font-bold text-emerald-700">{formData.companyCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="text-slate-800">{formData.companyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Business:</span>
                  <span className="text-slate-800">{formData.businessType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GST Number:</span>
                  <span className="font-mono text-slate-800">{formData.gstNumber || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Corporate Email:</span>
                  <span className="text-slate-800">{formData.companyEmail}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Section B: Address Details
                </span>
                <div className="text-slate-800 leading-relaxed">
                  {formData.addressLine1}
                  {formData.addressLine2 && `, ${formData.addressLine2}`}
                  <br />
                  {formData.city}, {formData.state} - {formData.pincode}
                  <br />
                  {formData.country} ({formData.timezone})
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex justify-between">
                  <span className="text-slate-500">Operating Currency:</span>
                  <span className="font-semibold text-slate-800">{formData.currency}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Section C: Inventory & MSME
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Operating Branches:</span>
                  <span className="font-bold text-slate-800 font-mono">{formData.numberOfBranches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Staging Warehouses:</span>
                  <span className="font-bold text-slate-800 font-mono">{formData.numberOfWarehouses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MSME Udyam:</span>
                  <span className="font-mono text-slate-800">{formData.msmeNumber || 'None'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Section D: Administrator
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-semibold text-slate-800">{formData.adminName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Login Email:</span>
                  <span className="font-mono text-slate-800">{formData.adminEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Initial Role:</span>
                  <span className="font-semibold text-indigo-700">Organization Admin</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Actions */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Step
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/admin/organizations')}
                className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Creating Organization...' : 'Submit & Onboard Organization'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const OrganizationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [org, setOrg] = useState<Organization | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      organizationService.getById(id).then((o) => setOrg(o));
    }
  }, [id]);

  if (!org) {
    return <div className="text-center py-12 text-xs text-slate-400">Loading organization details...</div>;
  }

  const assignedUsers = mockStore.data.users.filter((u) => u.organizationId === org.id);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-mono font-bold text-xl">
            {org.companyCode}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{org.companyName}</h1>
              <StatusBadge status={org.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Code: <span className="font-mono">{org.companyCode}</span> • {org.city}, {org.state}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/organizations')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-subtle space-y-3 text-xs">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Company Profile
          </h3>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Type:</span>
            <span className="font-medium text-slate-800">{org.companyType}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Business Domain:</span>
            <span className="font-medium text-slate-800">{org.businessType}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">GST Number:</span>
            <span className="font-mono font-semibold text-slate-800">{org.gstNumber || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">CIN Registration:</span>
            <span className="font-mono text-slate-800">{org.registrationNumber || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">MSME Udyam:</span>
            <span className="font-mono text-slate-800">{org.msmeNumber || 'None'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Onboarding Date:</span>
            <span className="font-mono text-slate-700">{org.createdDate}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-subtle space-y-3 text-xs">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Facility & Contact Details
          </h3>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Email:</span>
            <span className="font-medium text-slate-800">{org.companyEmail}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Phone:</span>
            <span className="font-medium text-slate-800">{org.companyPhone}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Branches Count:</span>
            <span className="font-mono font-bold text-slate-800">{org.numberOfBranches}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Warehouses Count:</span>
            <span className="font-mono font-bold text-slate-800">{org.numberOfWarehouses}</span>
          </div>
          <div className="py-2">
            <span className="text-slate-500 block mb-1">Registered Address:</span>
            <p className="text-slate-700 leading-relaxed font-medium">
              {org.addressLine1}
              {org.addressLine2 && `, ${org.addressLine2}`}
              <br />
              {org.city}, {org.state} - {org.pincode}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-subtle space-y-3 text-xs">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Assigned Personnel ({assignedUsers.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {assignedUsers.map((u) => (
              <div key={u.id} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">{u.fullName}</span>
                  <span className="text-[11px] text-slate-400">{u.email}</span>
                </div>
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                  {u.roleName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
