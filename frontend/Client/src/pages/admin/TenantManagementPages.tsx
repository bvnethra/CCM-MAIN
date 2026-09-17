import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Building,
  Users,
  Shield,
  Activity,
  CheckCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Save,
  MapPin,
  Boxes,
  KeyRound,
  FileText,
  Lock,
  Globe,
  DollarSign,
  Clock,
  Phone,
  Mail,
  Hash,
  Power,
  Warehouse,
  Filter,
  ChevronsUpDown,
} from 'lucide-react';
import { Tenant, TenantFormData, TenantType } from '../../types/tenant';
import { Organization, CompanyType, BusinessType } from '../../types/organization';
import { tenantService } from '../../services/tenantService';
import { organizationService } from '../../services/organizationService';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DeleteModal, Modal } from '../../components/modals/AppModals';
import { TextInput, SelectInput, Textarea } from '../../components/forms/FormControls';
import { useNotification } from '../../context/NotificationContext';

export const TenantListPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);

  const navigate = useNavigate();
  const { showToast } = useNotification();

  const loadTenants = async () => {
    setLoading(true);
    try {
      const [tData, oData] = await Promise.all([
        tenantService.getAll(),
        organizationService.getAll(),
      ]);
      setTenants(tData);
      setOrganizations(oData);
    } catch {
      showToast('Unable to load tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleDelete = async () => {
    if (!tenantToDelete) return;
    try {
      await tenantService.delete(tenantToDelete.id);
      showToast('Tenant deleted successfully', 'info');
      setDeleteModalOpen(false);
      setTenantToDelete(null);
      loadTenants();
    } catch {
      showToast('Failed to delete tenant', 'error');
    }
  };

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: 'Tenant Entity',
      sortable: true,
      render: (t) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs">{t.name}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-indigo-700 font-mono font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200/50">
              {t.code}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {t.tenantType || 'Enterprise'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'organizations',
      header: 'Organisation',
      render: (t) => {
        const orgs = organizations.filter((o) => o.tenantId === t.id || o.tenantId === t.code);
        const count = orgs.length || t.organizationsCount || 0;
        return (
          <div className="text-xs space-y-1">
            <span className="font-semibold text-slate-900 block text-xs">
              {count} {count === 1 ? 'Organisation' : 'Organisations'}
            </span>
            {orgs.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {orgs.slice(0, 3).map((o) => (
                  <span
                    key={o.id}
                    className="inline-block text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200/70 rounded px-1.5 py-0.5 truncate max-w-[130px]"
                    title={`${o.companyName} (${o.companyCode})`}
                  >
                    {o.companyName}
                  </span>
                ))}
                {orgs.length > 3 && (
                  <span className="text-[10px] text-slate-400 font-medium self-center">
                    +{orgs.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 italic">No organisations</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'city',
      header: 'Address / Location',
      render: (t) => (
        <div className="text-xs text-slate-600">
          <div>{t.city ? `${t.city}, ${t.state}` : 'Headquarters'}</div>
          <span className="text-[10px] text-slate-400">{t.country || 'India'}</span>
        </div>
      ),
    },
    {
      key: 'contactEmail',
      header: 'Contact Info',
      render: (t) => (
        <div className="text-xs text-slate-600">
          <div>{t.contactEmail}</div>
          <span className="text-[10px] text-slate-400 font-mono">{t.contactPhone}</span>
        </div>
      ),
    },
    {
      key: 'numberOfBranches',
      header: 'Branches',
      render: (t) => (
        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded text-[11px] inline-block">
          {t.numberOfBranches || 1} {t.numberOfBranches === 1 ? 'Branch' : 'Branches'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <StatusBadge status={t.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/admin/tenants/${t.id}`)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="View Tenant Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/admin/tenants/edit/${t.id}`)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Edit Tenant"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setTenantToDelete(t);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete Tenant"
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Tenants</h1>
          <p className="text-xs text-slate-500 mt-1">
            Top-level multi-tenant enterprise isolation accounts managing laboratory networks and multi-facility organizations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/tenants/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Onboard New Tenant
        </button>
      </div>

      <DataTable
        data={tenants}
        columns={columns}
        loading={loading}
        onRowClick={(t) => navigate(`/admin/tenants/${t.id}`)}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Tenant Group"
        itemName={tenantToDelete?.name}
        message="Are you sure you want to permanently remove this enterprise tenant? All linked organizations will be affected."
      />
    </div>
  );
};

export const AddTenantPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<TenantFormData>({
    // 1. Tenant Info
    name: '',
    code: '',
    tenantType: 'Enterprise',
    registrationNumber: '',
    gstNumber: '',
    contactEmail: '',
    contactPhone: '',

    // 2. Address Details
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    timezone: 'Asia/Kolkata (IST)',
    currency: 'INR (₹)',

    // 3. Inventory Setup
    numberOfBranches: 1,

    // 4. Administration
    adminName: '',
    adminEmail: '',
    adminDesignation: 'Super Administrator',
    adminPassword: '',

    status: 'ACTIVE',
    description: '',
  });

  // Multiple Organizations configuration for this tenant
  const [orgList, setOrgList] = useState<Array<{
    companyName: string;
    companyCode: string;
    companyType: CompanyType;
    businessType: BusinessType;
    registrationNumber: string;
    gstNumber: string;
    adminName: string;
    adminEmail: string;
    adminDesignation?: string;
    companyPhone: string;
    companyEmail: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  }>>([
    {
      companyName: '',
      companyCode: '',
      companyType: 'Private Limited',
      businessType: 'Calibration',
      registrationNumber: '',
      gstNumber: '',
      adminName: '',
      adminEmail: '',
      adminDesignation: 'Quality Head',
      companyPhone: '',
      companyEmail: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
    },
  ]);

  const handleAddOrg = () => {
    setOrgList((prev) => [
      ...prev,
      {
        companyName: '',
        companyCode: `${formData.code || 'ORG'}-${prev.length + 1}`.toUpperCase(),
        companyType: 'Private Limited',
        businessType: 'Calibration',
        registrationNumber: '',
        gstNumber: '',
        adminName: formData.adminName || '',
        adminEmail: formData.adminEmail || '',
        adminDesignation: 'Facility Administrator',
        companyPhone: formData.contactPhone || '',
        companyEmail: formData.contactEmail || '',
        addressLine1: formData.addressLine1 || '',
        addressLine2: '',
        city: formData.city || 'Bangalore',
        state: formData.state || 'Karnataka',
        country: formData.country || 'India',
        pincode: formData.pincode || '',
      },
    ]);
  };

  const handleRemoveOrg = (index: number) => {
    if (orgList.length <= 1) return;
    setOrgList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateOrg = (index: number, field: string, value: any) => {
    setOrgList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  useEffect(() => {
    if (isEdit && id) {
      tenantService.getById(id).then((t) => {
        if (t) {
          setFormData({
            name: t.name,
            code: t.code,
            tenantType: t.tenantType || 'Enterprise',
            registrationNumber: t.registrationNumber || '',
            gstNumber: t.gstNumber || '',
            contactEmail: t.contactEmail,
            contactPhone: t.contactPhone,
            addressLine1: t.addressLine1 || '',
            addressLine2: t.addressLine2 || '',
            city: t.city || '',
            state: t.state || '',
            country: t.country || 'India',
            pincode: t.pincode || '',
            timezone: t.timezone || 'Asia/Kolkata (IST)',
            currency: t.currency || 'INR (₹)',
            numberOfBranches: t.numberOfBranches || 1,
            adminName: t.adminName || '',
            adminEmail: t.adminEmail || '',
            adminDesignation: t.adminDesignation || 'Super Administrator',
            adminPassword: '',
            status: t.status,
            description: t.description || '',
          });
        }
      });
      organizationService.getAll().then((all) => {
        const matching = all.filter((o) => o.tenantId === id);
        if (matching.length > 0) {
          setOrgList(
            matching.map((o) => ({
              companyName: o.companyName,
              companyCode: o.companyCode,
              companyType: o.companyType,
              businessType: o.businessType,
              registrationNumber: o.registrationNumber || '',
              gstNumber: o.gstNumber || '',
              adminName: o.adminName || '',
              adminEmail: o.adminEmail || '',
              adminDesignation: o.adminDesignation || 'Facility Administrator',
              companyPhone: o.companyPhone || '',
              companyEmail: o.companyEmail || '',
              addressLine1: o.addressLine1 || '',
              addressLine2: o.addressLine2 || '',
              city: o.city || '',
              state: o.state || '',
              country: o.country || 'India',
              pincode: o.pincode || '',
            }))
          );
        }
      });
    }
  }, [id, isEdit]);

  const stepsList = [
    { num: 1, title: 'Tenant Info', icon: <Building2 className="w-4 h-4" /> },
    { num: 2, title: 'Address Details', icon: <MapPin className="w-4 h-4" /> },
    { num: 3, title: 'Organisation Details', icon: <Building className="w-4 h-4" /> },
    { num: 4, title: 'Inventory Setup', icon: <Boxes className="w-4 h-4" /> },
    { num: 5, title: 'Administration', icon: <KeyRound className="w-4 h-4" /> },
    { num: 6, title: 'Review & Confirm', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.name.trim()) newErrors.name = 'Tenant name is required';
      if (!formData.code.trim()) newErrors.code = 'Tenant ID/Code is required';
      if (!formData.contactEmail.trim()) newErrors.contactEmail = 'Tenant email is required';
      if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Tenant phone number is required';
      if (formData.gstNumber && formData.gstNumber.trim().length !== 15) {
        newErrors.gstNumber = 'GST number must be 15 alphanumeric characters';
      }
    }

    if (stepNumber === 2) {
      if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address line 1 is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    }

    if (stepNumber === 3) {
      orgList.forEach((org, idx) => {
        if (!org.companyName.trim()) {
          newErrors[`org_${idx}_name`] = `Organisation #${idx + 1} Name is required`;
        }
        if (!org.companyCode.trim()) {
          newErrors[`org_${idx}_code`] = `Organisation #${idx + 1} Code is required`;
        }
      });
    }

    if (stepNumber === 4) {
      if (formData.numberOfBranches < 1) newErrors.numberOfBranches = 'At least 1 branch is required';
    }

    if (stepNumber === 5) {
      if (!formData.adminName.trim()) newErrors.adminName = 'Administrator name is required';
      if (!formData.adminEmail.trim()) newErrors.adminEmail = 'Administrator email is required';
      if (!isEdit && !formData.adminPassword) {
        newErrors.adminPassword = 'Password is required for tenant administrator account';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2) {
        // Pre-fill first org with tenant info if empty
        setOrgList((prev) => {
          if (prev.length > 0 && !prev[0].companyName.trim()) {
            return [
              {
                ...prev[0],
                companyName: `${formData.name} Organisation`,
                companyCode: `${formData.code}-ORG`.toUpperCase(),
                companyEmail: formData.contactEmail,
                companyPhone: formData.contactPhone,
                addressLine1: formData.addressLine1,
                addressLine2: formData.addressLine2,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                adminName: formData.adminName,
                adminEmail: formData.adminEmail,
              },
              ...prev.slice(1),
            ];
          }
          return prev;
        });
      }
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    } else {
      showToast('Please complete required fields before proceeding', 'warning');
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4) || !validateStep(5)) {
      showToast('Please fix validation errors before submitting', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await tenantService.update(id, { ...formData, organizations: orgList });
        showToast('Tenant profile updated successfully', 'success');
      } else {
        await tenantService.create({ ...formData, organizations: orgList });
        showToast('Enterprise Tenant onboarded successfully with organisations', 'success');
      }
      navigate('/admin/tenants');
    } catch {
      showToast('Failed to save tenant profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200/60">
            Tenant Onboarding Wizard
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1.5">
            {isEdit ? 'Edit Tenant Profile' : 'Enterprise Tenant Onboarding'}
          </h1>
          <p className="text-xs text-slate-500">
            Provision a multi-tenant enterprise account with regional, inventory, and administration settings.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/tenants')}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>

      {/* Stepper Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-subtle overflow-x-auto">
        <div className="flex items-center justify-between min-w-[620px]">
          {stepsList.map((s, idx) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <React.Fragment key={s.num}>
                <div
                  className="flex items-center gap-2.5 cursor-pointer"
                  onClick={() => {
                    if (s.num < currentStep) setCurrentStep(s.num);
                  }}
                >
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

      {/* Wizard Form Content */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-subtle">
        {/* STEP 1: TENANT INFO */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <Building2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Step 1 — Tenant Information</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Specify primary legal identity, corporate identifiers, and organizational contact credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="1. Tenant Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Apex Metrology Group"
                error={errors.name}
              />
              <TextInput
                label="2. Tenant ID / CODE"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. APEX"
                helperText="Unique uppercase prefix used across tenant facilities"
                error={errors.code}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectInput
                label="3. Tenant Type"
                required
                value={formData.tenantType}
                onChange={(e) => setFormData({ ...formData, tenantType: e.target.value })}
                options={[
                  { value: 'Enterprise', label: 'Enterprise Network' },
                  { value: 'Calibration Laboratory Network', label: 'Calibration Laboratory Network' },
                  { value: 'Private Limited', label: 'Private Limited Company' },
                  { value: 'Public Limited', label: 'Public Limited Company' },
                  { value: 'Partnership', label: 'Partnership Firm' },
                  { value: 'Proprietorship', label: 'Proprietorship' },
                  { value: 'OEM Group', label: 'OEM Calibration Partner' },
                  { value: 'Subcontract Partner', label: 'Subcontract Calibration Partner' },
                ]}
              />
              <TextInput
                label="4. Registration Number"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="e.g. CIN-U74999KA2020PTC139822"
                helperText="Corporate Identification / Registrar of Companies"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="5. GST Number"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. 29AAACA1234F1Z5"
                helperText="15-character GSTIN for billing and tax invoices"
                error={errors.gstNumber}
              />
              <TextInput
                type="email"
                label="6. Tenant Email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@apexmetrology.com"
                error={errors.contactEmail}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="7. Tenant Phone Number"
                required
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+91 80 2845 0001"
                error={errors.contactPhone}
              />
              <SelectInput
                label="Tenant Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                options={[
                  { value: 'ACTIVE', label: 'Active (Production Access)' },
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'SUSPENDED', label: 'Suspended' },
                ]}
              />
            </div>
          </div>
        )}

        {/* STEP 2: ADDRESS DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <MapPin className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Step 2 — Address Details</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical headquarters address, regional timezone, and default invoicing currency.
              </p>
            </div>

            <TextInput
              label="1. Address Line 1"
              required
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              placeholder="Building No, Plot / Sector, Industrial Area"
              error={errors.addressLine1}
            />

            <TextInput
              label="2. Address Line 2"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              placeholder="Street Name, Landmark, Main Road"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="3. City"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Bengaluru"
                error={errors.city}
              />
              <TextInput
                label="4. State"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Karnataka"
                error={errors.state}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="5. Country"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="India"
              />
              <TextInput
                label="6. Pincode / Postal Code"
                required
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="e.g. 560100"
                error={errors.pincode}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectInput
                label="7. Timezone"
                required
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                options={[
                  { value: 'Asia/Kolkata (IST)', label: 'Asia/Kolkata (IST, UTC+05:30)' },
                  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
                  { value: 'America/New_York (EST)', label: 'America/New_York (EST, UTC-05:00)' },
                  { value: 'Europe/London (GMT)', label: 'Europe/London (GMT, UTC+00:00)' },
                  { value: 'Asia/Dubai (GST)', label: 'Asia/Dubai (GST, UTC+04:00)' },
                  { value: 'Asia/Singapore (SGT)', label: 'Asia/Singapore (SGT, UTC+08:00)' },
                ]}
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
              />
            </div>
          </div>
        )}

        {/* STEP 3: ORGANISATION DETAILS */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-600">
                  <Building className="w-5 h-5" />
                  <h3 className="text-base font-bold text-slate-900">Step 3 — Organisation Details</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure one or more organisations belonging to this tenant. You can onboard multiple organisations in this tenant.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddOrg}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Organisation</span>
              </button>
            </div>

            <div className="space-y-5">
              {orgList.map((org, index) => (
                <div
                  key={index}
                  className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-4 transition-all"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {org.companyName.trim() || `Organisation #${index + 1}`}
                      </span>
                      <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {org.companyCode || 'NO CODE'}
                      </span>
                    </div>

                    {orgList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOrg(index)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Remove organisation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextInput
                      label="1. Organisation Name"
                      required
                      value={org.companyName}
                      onChange={(e) => handleUpdateOrg(index, 'companyName', e.target.value)}
                      placeholder="e.g. Apex Bangalore Calibration Lab"
                      error={errors[`org_${index}_name`]}
                    />
                    <TextInput
                      label="2. Organisation Code"
                      required
                      value={org.companyCode}
                      onChange={(e) => handleUpdateOrg(index, 'companyCode', e.target.value.toUpperCase())}
                      placeholder="e.g. APEX-BLR"
                      error={errors[`org_${index}_code`]}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SelectInput
                      label="3. Company / Entity Type"
                      required
                      value={org.companyType}
                      onChange={(e) => handleUpdateOrg(index, 'companyType', e.target.value)}
                      options={[
                        { value: 'Private Limited', label: 'Private Limited' },
                        { value: 'Public Limited', label: 'Public Limited' },
                        { value: 'Partnership', label: 'Partnership' },
                        { value: 'LLP', label: 'Limited Liability Partnership (LLP)' },
                        { value: 'Proprietorship', label: 'Proprietorship' },
                      ]}
                    />
                    <SelectInput
                      label="4. Business Specialization"
                      required
                      value={org.businessType}
                      onChange={(e) => handleUpdateOrg(index, 'businessType', e.target.value)}
                      options={[
                        { value: 'Calibration', label: 'Calibration & Metrology' },
                        { value: 'Testing', label: 'Testing & Quality Assurance' },
                        { value: 'Manufacturing', label: 'Manufacturing' },
                        { value: 'R&D', label: 'Research & Development' },
                        { value: 'Healthcare', label: 'Healthcare / Biomedical' },
                        { value: 'Other', label: 'Other Enterprise' },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextInput
                      label="5. GST Number"
                      value={org.gstNumber}
                      onChange={(e) => handleUpdateOrg(index, 'gstNumber', e.target.value.toUpperCase())}
                      placeholder="e.g. 29AAAAA0000A1Z5"
                    />
                    <TextInput
                      label="6. Registration / PAN No."
                      value={org.registrationNumber}
                      onChange={(e) => handleUpdateOrg(index, 'registrationNumber', e.target.value.toUpperCase())}
                      placeholder="e.g. CIN / PAN / Udyam"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <TextInput
                      label="7. Contact Person"
                      value={org.adminName}
                      onChange={(e) => handleUpdateOrg(index, 'adminName', e.target.value)}
                      placeholder="Branch Manager / Lead"
                    />
                    <TextInput
                      label="8. Designation (RBAC)"
                      value={org.adminDesignation || ''}
                      onChange={(e) => handleUpdateOrg(index, 'adminDesignation', e.target.value)}
                      placeholder="e.g. Quality Head / Lab Director"
                      helperText="RBAC role in organisation"
                    />
                    <TextInput
                      label="9. Org Email"
                      type="email"
                      value={org.companyEmail}
                      onChange={(e) => handleUpdateOrg(index, 'companyEmail', e.target.value)}
                      placeholder="lab.blr@apex.com"
                    />
                    <TextInput
                      label="10. Org Phone"
                      value={org.companyPhone}
                      onChange={(e) => handleUpdateOrg(index, 'companyPhone', e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <TextInput
                        label="10. Address Line 1"
                        value={org.addressLine1}
                        onChange={(e) => handleUpdateOrg(index, 'addressLine1', e.target.value)}
                        placeholder="Plot / Sector / Area"
                      />
                    </div>
                    <div>
                      <TextInput
                        label="11. City"
                        value={org.city}
                        onChange={(e) => handleUpdateOrg(index, 'city', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <TextInput
                        label="12. State / Pincode"
                        value={`${org.state ? org.state + (org.pincode ? ' - ' + org.pincode : '') : ''}`}
                        onChange={(e) => {
                          const parts = e.target.value.split('-');
                          handleUpdateOrg(index, 'state', parts[0]?.trim() || '');
                          if (parts[1]) handleUpdateOrg(index, 'pincode', parts[1]?.trim() || '');
                        }}
                        placeholder="State - Pincode"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddOrg}
                className="w-full py-3 px-4 border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-2xl text-xs font-semibold text-indigo-600 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Organisation to this Tenant</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: INVENTORY SETUP */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <Boxes className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Step 4 — Inventory Setup</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure facility network topology, inventory branches, and operational scope.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                type="number"
                label="1. Number of Branches"
                required
                value={formData.numberOfBranches.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    numberOfBranches: Math.max(1, parseInt(e.target.value, 10) || 1),
                  })
                }
                min={1}
                max={50}
                placeholder="1"
                helperText="Total branch facilities or testing centers under this tenant"
                error={errors.numberOfBranches}
              />
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-start gap-3">
                <Boxes className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900">
                  <span className="font-bold block mb-1">Multi-Branch Inventory Routing</span>
                  Each branch acts as a physical stock & calibration handling center. Organizations
                  and equipment intake requests can be segregated across these branches.
                </div>
              </div>
            </div>

            <Textarea
              label="Tenant Business Notes / Description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Primary calibration laboratory network capabilities, accreditation scopes (NABL ISO/IEC 17025), and business specialization..."
            />
          </div>
        )}

        {/* STEP 5: ADMINISTRATION */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <KeyRound className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Step 5 — Administration</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Set up the master administrator credentials for this enterprise tenant account.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextInput
                label="1. Admin Name"
                required
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                placeholder="e.g. Apex Super Admin"
                error={errors.adminName}
              />
              <TextInput
                label="2. Designation / Role (RBAC)"
                value={formData.adminDesignation || ''}
                onChange={(e) => setFormData({ ...formData, adminDesignation: e.target.value })}
                placeholder="e.g. Super Administrator"
                helperText="Primary RBAC role"
              />
              <TextInput
                type="email"
                label="3. Admin Email"
                required
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                placeholder="admin@apexmetrology.com"
                helperText="Login email for the tenant platform administrator"
                error={errors.adminEmail}
              />
            </div>

            {!isEdit && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  type="password"
                  label="3. Password"
                  required
                  value={formData.adminPassword || ''}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  placeholder="••••••••••••"
                  helperText="Minimum 8 characters with letters, numbers, and symbols"
                  error={errors.adminPassword}
                />
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <span className="font-bold block mb-1">Administrative Privileges</span>
                    This user will receive full governance access to provision organizations,
                    manage staff roles, and oversee calibration operations for this tenant.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: REVIEW & CONFIRM */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Step 6 — Review & Confirmation</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify all tenant onboarding details across the 5 sections before provisioning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section 1 Review */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    1. Tenant Information
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TENANT NAME:</span>
                  <span className="font-semibold text-slate-900">{formData.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">CODE:</span>
                    <span className="font-mono font-bold text-indigo-700">{formData.code}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">TYPE:</span>
                    <span className="text-slate-700">{formData.tenantType}</span>
                  </div>
                </div>
                {formData.registrationNumber && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">REG NO:</span>
                    <span className="font-mono text-slate-700">{formData.registrationNumber}</span>
                  </div>
                )}
                {formData.gstNumber && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">GST NO:</span>
                    <span className="font-mono font-bold text-slate-800">{formData.gstNumber}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">EMAIL:</span>
                    <span className="text-slate-700">{formData.contactEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PHONE:</span>
                    <span className="font-mono text-slate-700">{formData.contactPhone}</span>
                  </div>
                </div>
              </div>

              {/* Section 2 Review */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    2. Address Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">STREET ADDRESS:</span>
                  <span className="text-slate-800">
                    {formData.addressLine1}
                    {formData.addressLine2 ? `, ${formData.addressLine2}` : ''}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">CITY / STATE:</span>
                    <span className="text-slate-800">
                      {formData.city}, {formData.state}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PINCODE:</span>
                    <span className="font-mono text-slate-800">{formData.pincode}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">TIMEZONE:</span>
                    <span className="text-slate-700">{formData.timezone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CURRENCY:</span>
                    <span className="font-bold text-slate-800">{formData.currency}</span>
                  </div>
                </div>
              </div>

              {/* Section 3 Review: Organisation Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs md:col-span-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-indigo-600" />
                    3. Organisation Details ({orgList.length} {orgList.length === 1 ? 'Organisation' : 'Organisations'})
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {orgList.map((org, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate">
                          {org.companyName || `Org #${idx + 1}`}
                        </span>
                        <span className="font-mono font-bold text-indigo-600 text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded">
                          {org.companyCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {org.companyType} • {org.businessType}
                      </div>
                      {(org.city || org.state) && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{[org.city, org.state].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {org.companyEmail && (
                        <div className="text-[10px] text-slate-500 truncate">
                          {org.companyEmail}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4 Review */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-cyan-600" />
                    4. Inventory Setup
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">NUMBER OF BRANCHES:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formData.numberOfBranches} Branches
                  </span>
                </div>
                {formData.description && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">BUSINESS NOTES:</span>
                    <p className="text-slate-700 line-clamp-2">{formData.description}</p>
                  </div>
                )}
              </div>

              {/* Section 5 Review */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-purple-600" />
                    5. Administration
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="text-[11px] text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ADMIN NAME:</span>
                  <span className="font-semibold text-slate-900">{formData.adminName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">DESIGNATION / RBAC:</span>
                  <span className="font-mono text-indigo-700 font-semibold">{formData.adminDesignation || 'Super Administrator'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ADMIN EMAIL:</span>
                  <span className="text-slate-800">{formData.adminEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">STATUS:</span>
                  <StatusBadge status={formData.status} size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Action Footer */}
        <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-100 mt-8">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
              >
                <span>Next: {stepsList[currentStep]?.title || 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-7 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isEdit ? 'Save Changes' : 'Complete Tenant Onboarding'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TenantDetailPage: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantOrgs, setTenantOrgs] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [addOrgModalOpen, setAddOrgModalOpen] = useState(false);
  const [submittingOrg, setSubmittingOrg] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [deleteOrgModalOpen, setDeleteOrgModalOpen] = useState(false);

  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [newOrgForm, setNewOrgForm] = useState({
    companyName: '',
    companyCode: '',
    companyType: 'Private Limited' as const,
    businessType: 'Calibration' as const,
    registrationNumber: '',
    gstNumber: '',
    companyEmail: '',
    companyPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    timezone: 'Asia/Kolkata (IST)',
    currency: 'INR (₹)',
    numberOfBranches: 1,
    numberOfWarehouses: 1,
    adminName: '',
    adminEmail: '',
    adminDesignation: 'Facility Administrator',
  });

  const loadTenantAndOrgs = async () => {
    if (!tenantId) return;
    setLoadingOrgs(true);
    try {
      const t = await tenantService.getById(tenantId);
      setTenant(t);
      const allOrgs = await organizationService.getAll();
      const orgs = allOrgs.filter((o) => o.tenantId === tenantId || (t && o.tenantId === t.code));
      setTenantOrgs(orgs);
    } catch {
      showToast('Error loading tenant facilities', 'error');
    } finally {
      setLoadingOrgs(false);
    }
  };

  useEffect(() => {
    loadTenantAndOrgs();
  }, [tenantId]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    if (!newOrgForm.companyName.trim()) {
      showToast('Facility Name is required', 'warning');
      return;
    }
    if (!newOrgForm.companyCode.trim()) {
      showToast('Facility Code is required', 'warning');
      return;
    }

    setSubmittingOrg(true);
    try {
      await organizationService.create({
        ...newOrgForm,
        companyEmail: newOrgForm.companyEmail || newOrgForm.adminEmail || tenant.contactEmail || 'facility@calispec.ai',
        companyPhone: newOrgForm.companyPhone || tenant.contactPhone || '—',
        addressLine1: newOrgForm.addressLine1 || tenant.addressLine1 || 'Main Facility Campus',
        city: newOrgForm.city || tenant.city || 'Bangalore',
        state: newOrgForm.state || tenant.state || 'Karnataka',
        pincode: newOrgForm.pincode || tenant.pincode || '560001',
        adminName: newOrgForm.adminName || 'Facility Admin',
        adminEmail: newOrgForm.adminEmail || newOrgForm.companyEmail || tenant.adminEmail || tenant.contactEmail,
        adminDesignation: newOrgForm.adminDesignation || 'Facility Administrator',
        tenantId: tenant.id,
      });
      showToast(`Facility "${newOrgForm.companyName}" successfully provisioned inside ${tenant.name}!`, 'success');
      setAddOrgModalOpen(false);
      setNewOrgForm({
        companyName: '',
        companyCode: '',
        companyType: 'Private Limited',
        businessType: 'Calibration',
        registrationNumber: '',
        gstNumber: '',
        companyEmail: '',
        companyPhone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        timezone: 'Asia/Kolkata (IST)',
        currency: 'INR (₹)',
        numberOfBranches: 1,
        numberOfWarehouses: 1,
        adminName: '',
        adminEmail: '',
        adminDesignation: 'Facility Administrator',
      });
      await loadTenantAndOrgs();
    } catch {
      showToast('Failed to create organization', 'error');
    } finally {
      setSubmittingOrg(false);
    }
  };

  if (!tenant) return null;

  const getInitials = (name: string) => {
    if (!name) return 'TN';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '14 Jul 2026';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const adminList = [
    {
      name: tenant.adminName || 'Super Admin',
      designation: tenant.adminDesignation || 'Super Administrator',
      email: tenant.adminEmail || tenant.contactEmail || 'admin@calispec.ai',
      organization: tenantOrgs[0]?.companyName || tenant.name,
      contact: tenant.contactPhone || '—',
      status: 'Active',
    },
    ...tenantOrgs
      .filter((o) => o.adminName && o.adminName !== tenant.adminName)
      .map((o) => ({
        name: o.adminName || 'Facility Admin',
        designation: o.adminDesignation || 'Facility Administrator',
        email: o.adminEmail || o.companyEmail || 'admin@calispec.ai',
        organization: o.companyName,
        contact: o.companyPhone || '—',
        status: 'Active',
      })),
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          type="button"
          onClick={() => navigate('/admin/tenants')}
          className="text-sky-600 hover:text-sky-800 transition cursor-pointer font-medium"
        >
          Companies
        </button>
        <span className="text-slate-400">/</span>
        <span className="font-semibold text-slate-700">{tenant.name}</span>
      </div>

      {/* Top Banner Card: Initials, Name, Code Badge & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-100/80 border border-sky-200 text-sky-900 flex items-center justify-center text-xl font-extrabold tracking-wider shrink-0 shadow-xs">
            {getInitials(tenant.name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{tenant.name}</h1>
              <span className="text-xs font-mono font-bold bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-md border border-sky-200/70">
                {tenant.code}
              </span>
              <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                {tenant.tenantType || 'Enterprise'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
              <span>Onboarded <span className="font-medium text-slate-700">{formatDate(tenant.createdDate)}</span></span>
              <span className="text-slate-300">•</span>
              <span>Primary Admin: <span className="font-medium text-slate-700">{tenant.adminName || 'Admin'}</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setAddOrgModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add organization</span>
          </button>
        </div>
      </div>

      {/* Mandatory Tenant Data Fields from Onboarding Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Legal & Registration */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 tracking-wider uppercase">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>Legal & Registration</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Tenant Code / ID</span>
              <span className="font-mono font-bold text-slate-900">{tenant.code}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Entity Type</span>
              <span className="font-medium text-slate-800">{tenant.tenantType || 'Enterprise'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">GST Number</span>
              <span className="font-mono font-semibold text-slate-800">{tenant.gstNumber || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Registration No</span>
              <span className="font-mono font-semibold text-slate-800">{tenant.registrationNumber || '—'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Contact & Administrator */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 tracking-wider uppercase">
            <Users className="w-4 h-4 text-sky-600" />
            <span>Contact & Administrator</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Contact Email</span>
              <span className="font-medium text-slate-900 truncate max-w-[170px]" title={tenant.contactEmail}>
                {tenant.contactEmail}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Contact Phone</span>
              <span className="font-mono font-medium text-slate-800">{tenant.contactPhone}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Primary Admin</span>
              <span className="font-semibold text-slate-900">{tenant.adminName || 'Admin'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Admin Email</span>
              <span className="font-medium text-slate-800 truncate max-w-[170px]" title={tenant.adminEmail || tenant.contactEmail}>
                {tenant.adminEmail || tenant.contactEmail}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Location & Operational Setup */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 tracking-wider uppercase">
            <MapPin className="w-4 h-4 text-sky-600" />
            <span>Headquarters & Location</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Address</span>
              <span className="font-medium text-slate-900 truncate max-w-[170px]" title={[tenant.addressLine1, tenant.addressLine2].filter(Boolean).join(', ')}>
                {tenant.addressLine1 || '—'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">City / State</span>
              <span className="font-medium text-slate-800">{tenant.city}, {tenant.state}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-500">Country / Pincode</span>
              <span className="font-medium text-slate-800">{tenant.country || 'India'} - {tenant.pincode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Registered Branches</span>
              <span className="font-bold text-sky-700">{tenant.numberOfBranches || 1} Branches</span>
            </div>
          </div>
        </div>
      </div>

      {/* ORGANISATION DETAILS (Matching Example Format with Mandatory Fields) */}
      <div className="space-y-3 pt-1">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Organizations under this company</h2>
          <p className="text-xs text-slate-500">Operating facilities and calibration organizations provisioned under this company.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0284c7] text-white">
                <tr>
                  <th className="px-5 py-3.5 font-bold uppercase text-[11px] tracking-wider">
                    ORGANIZATION
                  </th>
                  <th className="px-5 py-3.5 font-bold uppercase text-[11px] tracking-wider">
                    GST / REG NO
                  </th>
                  <th className="px-5 py-3.5 font-bold uppercase text-[11px] tracking-wider">
                    LOCATION / ADDRESS
                  </th>
                  <th className="px-5 py-3.5 font-bold uppercase text-[11px] tracking-wider">
                    CONTACT DETAILS
                  </th>
                  <th className="px-5 py-3.5 font-bold uppercase text-[11px] tracking-wider">
                    FACILITY ADMIN
                  </th>
                  <th className="px-5 py-3.5 text-right font-bold uppercase text-[11px] tracking-wider">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tenantOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No organizations provisioned yet under this tenant. Click "+ Add organization" above.
                    </td>
                  </tr>
                ) : (
                  tenantOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{org.companyName}</span>
                          <span className="font-mono text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60 font-semibold">
                            {org.companyCode}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                          {org.companyType} • {org.businessType}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="font-mono font-semibold text-slate-800">
                          {org.gstNumber || '—'}
                        </div>
                        {org.registrationNumber && (
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            Reg: {org.registrationNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        <div className="font-medium text-slate-800">
                          {org.city ? `${org.city}, ${org.state}` : '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[170px]" title={org.addressLine1}>
                          {org.addressLine1 || (org.pincode ? `PIN: ${org.pincode}` : '—')}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        <div className="font-medium text-slate-800">{org.companyEmail || '—'}</div>
                        <div className="font-mono text-[10px] text-slate-400">{org.companyPhone || '—'}</div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="font-semibold text-slate-900">{org.adminName || 'Admin'}</div>
                        <div className="text-[10px] text-slate-400">{org.adminEmail || '—'}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {org.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. SUPER ADMINS SECTION (Like Example Format) */}
      <div className="space-y-3 pt-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Super Admins</h2>
          <p className="text-xs text-slate-500">Login accounts created for this company's organizations.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0284c7] text-white">
                <tr>
                  <th className="px-5 py-3.5 font-bold uppercase text-[11px] tracking-wider">NAME</th>
                  <th className="px-5 py-3.5 font-bold uppercase text-[11px] tracking-wider">DESIGNATION</th>
                  <th className="px-5 py-3.5 font-bold uppercase text-[11px] tracking-wider">ORGANIZATION</th>
                  <th className="px-5 py-3.5 font-bold uppercase text-[11px] tracking-wider">CONTACT</th>
                  <th className="px-5 py-3.5 font-bold uppercase text-[11px] tracking-wider">STATUS</th>
                  <th className="px-5 py-3.5 text-right font-bold uppercase text-[11px] tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {adminList.map((admin, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {getInitials(admin.name)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{admin.name}</div>
                          <div className="text-[11px] text-slate-400">{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-mono">
                        <Shield className="w-3 h-3 text-indigo-500" />
                        {admin.designation || 'Super Administrator'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {admin.organization}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {admin.contact || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-3">
                      <button
                        type="button"
                        onClick={() => showToast(`Edit administrator ${admin.name}`, 'info')}
                        className="text-slate-600 hover:text-sky-600 font-medium cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast(`Reset password link sent to ${admin.email}`, 'success')}
                        className="text-slate-600 hover:text-sky-600 font-medium cursor-pointer"
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast(`Cannot delete primary super administrator account`, 'warning')}
                        className="text-slate-600 hover:text-rose-600 font-medium cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD ORGANIZATION MODAL (Professional Single Page Layout) */}
      <Modal
        isOpen={addOrgModalOpen}
        onClose={() => setAddOrgModalOpen(false)}
        title={`Add Organization to ${tenant.name}`}
        subtitle={`Provision a new operating facility directly inside tenant (${tenant.code})`}
        maxWidth="max-w-4xl"
        fullPage={false}
      >
        <form onSubmit={handleCreateOrg} noValidate className="flex flex-col">
          {/* Main Form Fields Container */}
          <div className="p-6 space-y-5">
            {/* Architectural Context Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-sky-50/70 border border-sky-200/70 rounded-xl text-xs text-sky-900">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Parent Company: <strong>{tenant.name}</strong> (Code: <span className="font-mono font-bold text-sky-700">{tenant.code}</span>)</span>
              </div>
              <span className="text-[11px] font-semibold text-sky-700 bg-sky-100/80 px-2.5 py-0.5 rounded-full border border-sky-200 self-start sm:self-auto">
                Direct Child Facility
              </span>
            </div>

            {/* Section 1: Facility Identity & Legal Profile */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                <Building className="w-3.5 h-3.5 text-sky-600" />
                <span>1. Facility Identity & Legal Profile</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <TextInput
                  label="Facility Name *"
                  value={newOrgForm.companyName}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, companyName: e.target.value })}
                  placeholder="e.g. Apex Bangalore Calibration Facility"
                />
                <TextInput
                  label="Facility Code *"
                  value={newOrgForm.companyCode}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, companyCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. APEX-BLR-01"
                  helperText="Unique uppercase facility code"
                />
                <SelectInput
                  label="Legal Entity Type"
                  value={newOrgForm.companyType}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, companyType: e.target.value as any })}
                  options={[
                    { value: 'Private Limited', label: 'Private Limited' },
                    { value: 'Public Limited', label: 'Public Limited' },
                    { value: 'Partnership', label: 'Partnership' },
                    { value: 'Proprietorship', label: 'Proprietorship' },
                    { value: 'LLP', label: 'LLP' },
                  ]}
                />
                <SelectInput
                  label="Business Specialization"
                  value={newOrgForm.businessType}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, businessType: e.target.value as any })}
                  options={[
                    { value: 'Calibration', label: 'Calibration & Metrology' },
                    { value: 'Laboratory', label: 'Testing Laboratory' },
                    { value: 'Manufacturing', label: 'Manufacturing' },
                    { value: 'Service', label: 'Field Services' },
                  ]}
                />
                <TextInput
                  label="GST Number"
                  value={newOrgForm.gstNumber}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, gstNumber: e.target.value.toUpperCase() })}
                  placeholder="29ABCDE1234F1Z5"
                />
                <TextInput
                  label="Registration / CIN No."
                  value={newOrgForm.registrationNumber}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, registrationNumber: e.target.value.toUpperCase() })}
                  placeholder="U74999KA2020PTC139888"
                />
              </div>
            </div>

            {/* Section 2: Location & Address */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                <span>2. Location & Facility Scale</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <TextInput
                    label="Facility Street Address *"
                    value={newOrgForm.addressLine1}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, addressLine1: e.target.value })}
                    placeholder="Plot 42, Industrial Suburb, Phase 2"
                  />
                </div>
                <TextInput
                  label="City *"
                  value={newOrgForm.city}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, city: e.target.value })}
                  placeholder="Bangalore"
                />
                <TextInput
                  label="State *"
                  value={newOrgForm.state}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, state: e.target.value })}
                  placeholder="Karnataka"
                />
                <TextInput
                  label="Pincode / Postal Code *"
                  value={newOrgForm.pincode}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, pincode: e.target.value })}
                  placeholder="560058"
                />
                <div className="grid grid-cols-2 gap-2">
                  <TextInput
                    type="number"
                    label="Branches"
                    min={1}
                    value={String(newOrgForm.numberOfBranches)}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, numberOfBranches: Number(e.target.value) || 1 })}
                  />
                  <TextInput
                    type="number"
                    label="Warehouses"
                    min={1}
                    value={String(newOrgForm.numberOfWarehouses)}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, numberOfWarehouses: Number(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Facility Administration & RBAC Credentials */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>3. Facility Administration & RBAC Role</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <TextInput
                  label="Facility Lead / Admin Name *"
                  value={newOrgForm.adminName}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, adminName: e.target.value })}
                  placeholder="Facility Lead Name"
                />
                <TextInput
                  label="Designation (RBAC Role) *"
                  value={newOrgForm.adminDesignation}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, adminDesignation: e.target.value })}
                  placeholder="e.g. Quality Head / Lab Director"
                  helperText="RBAC role"
                />
                <TextInput
                  type="email"
                  label="Facility Admin Email *"
                  value={newOrgForm.adminEmail}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, adminEmail: e.target.value })}
                  placeholder="admin.blr@apex.com"
                />
                <TextInput
                  label="Facility Phone *"
                  value={newOrgForm.companyPhone}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, companyPhone: e.target.value })}
                  placeholder="+91 80 2839 0001"
                />
              </div>
            </div>
          </div>

          {/* Sticky Bottom Footer Bar: Always 100% visible and accessible! */}
          <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md px-6 py-3.5 border-t border-slate-200/90 flex items-center justify-between gap-3 shrink-0 shadow-xs">
            <div className="text-xs text-slate-500">
              Target Tenant: <strong className="text-slate-800">{tenant.name}</strong> ({tenant.code})
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setAddOrgModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingOrg}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{submittingOrg ? 'Provisioning Facility...' : 'Provision Organization'}</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* DELETE ORGANIZATION CONFIRMATION MODAL */}
      <DeleteModal
        isOpen={deleteOrgModalOpen}
        onClose={() => setDeleteOrgModalOpen(false)}
        onConfirm={async () => {
          if (!orgToDelete) return;
          await organizationService.delete(orgToDelete.id);
          showToast('Organization deleted', 'info');
          setDeleteOrgModalOpen(false);
          setOrgToDelete(null);
          loadTenantAndOrgs();
        }}
        title="Delete Organization"
        itemName={orgToDelete?.companyName}
        message="Are you sure you want to remove this organization from the tenant? All linked laboratory operations will be affected."
      />
    </div>
  );
};
