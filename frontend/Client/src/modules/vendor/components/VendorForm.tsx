import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2, Save, X, Building2, ShieldAlert } from 'lucide-react';
import { vendorFormSchema, VendorFormValues } from '../../../schemas/vendorSchema';
import { Vendor, ItemCategory, VendorStatus } from '../../../types/vendor';
import { CategoryMultiSelect } from './CategoryMultiSelect';
import { vendorService } from '../../../services/vendorService';

interface VendorFormProps {
  initialData?: Vendor | null;
  categories: ItemCategory[];
  onSubmit: (values: VendorFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry'
];

export const VendorForm: React.FC<VendorFormProps> = ({
  initialData,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const isEditing = Boolean(initialData?.id);
  const [gstinChecking, setGstinChecking] = useState(false);
  const [gstinDuplicateWarning, setGstinDuplicateWarning] = useState<string | null>(null);
  const [nameDuplicateWarning, setNameDuplicateWarning] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      vendor_code: initialData?.vendor_code || initialData?.vendorCode || 'VEN-2026-XXXXXX (Auto-Generated)',
      vendor_name: initialData?.vendor_name || initialData?.vendorName || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      pin: initialData?.pin || initialData?.pincode || '',
      gstin_tax_id: initialData?.gstin_tax_id || initialData?.gstNumber || '',
      contact_person: initialData?.contact_person || initialData?.contactPersonName || '',
      phone: initialData?.phone || initialData?.phoneNumber || '',
      email: initialData?.email || '',
      item_category_ids: initialData?.item_category_ids || initialData?.categories?.map((c) => c.id) || [],
      status: (initialData?.status || 'ACTIVE') as VendorStatus,
    },
  });

  const currentStatus = watch('status');
  const watchedGstin = watch('gstin_tax_id');
  const watchedName = watch('vendor_name');

  // Real-time GSTIN validation on blur
  const handleGstinBlur = async () => {
    if (!watchedGstin || watchedGstin.trim().length < 15) {
      setGstinDuplicateWarning(null);
      return;
    }
    setGstinChecking(true);
    try {
      const res = await vendorService.checkGstinDuplicate(watchedGstin, initialData?.id);
      if (res.isDuplicate) {
        setGstinDuplicateWarning(
          `A vendor with this GSTIN already exists (${res.existingVendorName || 'Code: ' + res.existingVendorCode})`
        );
      } else {
        setGstinDuplicateWarning(null);
      }
    } catch {
      setGstinDuplicateWarning(null);
    } finally {
      setGstinChecking(false);
    }
  };

  // Real-time Name duplicate warning on blur
  const handleNameBlur = async () => {
    if (!watchedName || watchedName.trim().length < 3) {
      setNameDuplicateWarning(null);
      return;
    }
    try {
      const res = await vendorService.checkNameDuplicate(watchedName, initialData?.id);
      if (res.isDuplicate) {
        setNameDuplicateWarning(
          `Notice: A vendor with this name or similar already exists (${res.count} match).`
        );
      } else {
        setNameDuplicateWarning(null);
      }
    } catch {
      setNameDuplicateWarning(null);
    }
  };

  const handleFormSubmit = async (data: VendorFormValues) => {
    await onSubmit({
      ...data,
      gstin_tax_id: data.gstin_tax_id.toUpperCase().trim(),
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-800 px-8 py-6 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
            <Building2 className="w-6 h-6 text-purple-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">VENDOR MASTER</h1>
            <p className="text-xs text-purple-200 mt-0.5">
              {isEditing
                ? `Edit Vendor: ${initialData?.vendor_code || initialData?.vendorCode}`
                : 'Register a new external calibration service partner'}
            </p>
          </div>
        </div>

        {/* Status Badge Preview */}
        <div className="flex items-center space-x-2">
          <span
            className={`text-xs px-3 py-1 font-semibold rounded-full uppercase tracking-wider ${
              currentStatus === 'ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {currentStatus}
          </span>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-8 space-y-6">
        {/* Vendor Code (Read Only) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Vendor Code
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                System-generated unique sequence identifier (database managed)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold bg-white text-purple-900 px-3.5 py-1.5 rounded-lg border border-purple-200 shadow-sm">
                {isEditing
                  ? initialData?.vendor_code || initialData?.vendorCode
                  : 'VEN-2026-XXXXXX'}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-1 rounded">
                Read Only
              </span>
            </div>
          </div>
        </div>

        {/* Vendor Name * */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Vendor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('vendor_name')}
            onBlur={handleNameBlur}
            placeholder="e.g., ABC Calibration Services Pvt. Ltd."
            className={`w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
              errors.vendor_name
                ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                : 'border-slate-300 hover:border-slate-400 focus:border-purple-600'
            }`}
          />
          {errors.vendor_name && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.vendor_name.message}
            </p>
          )}
          {nameDuplicateWarning && !errors.vendor_name && (
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              {nameDuplicateWarning}
            </p>
          )}
        </div>

        {/* Address * (Multi-line) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            {...register('address')}
            placeholder="Enter full vendor premises address, street name, industrial area..."
            className={`w-full px-4 py-2.5 text-sm bg-white border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
              errors.address
                ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                : 'border-slate-300 hover:border-slate-400 focus:border-purple-600'
            }`}
          />
          {errors.address && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.address.message}
            </p>
          )}
        </div>

        {/* City *, State *, PIN * */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* City * */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('city')}
              placeholder="e.g., Chennai"
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                errors.city
                  ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-300 hover:border-slate-400 focus:border-purple-600'
              }`}
            />
            {errors.city && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.city.message}
              </p>
            )}
          </div>

          {/* State * */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              State <span className="text-red-500">*</span>
            </label>
            <select
              {...register('state')}
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                errors.state
                  ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-300 hover:border-slate-400 focus:border-purple-600'
              }`}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {errors.state && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.state.message}
              </p>
            )}
          </div>

          {/* PIN * */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={6}
              {...register('pin')}
              placeholder="e.g., 600001"
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg transition-all font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                errors.pin
                  ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-300 hover:border-slate-400 focus:border-purple-600'
              }`}
            />
            {errors.pin && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.pin.message}
              </p>
            )}
          </div>
        </div>

        {/* GSTIN / Tax ID * */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              GSTIN / Tax ID <span className="text-red-500">*</span>
            </label>
            {gstinChecking && (
              <span className="text-xs text-purple-600 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Checking duplicate...
              </span>
            )}
          </div>
          <input
            type="text"
            maxLength={15}
            {...register('gstin_tax_id')}
            onBlur={handleGstinBlur}
            placeholder="e.g., 29AAACA1234F1Z5"
            className={`w-full px-4 py-2.5 text-sm bg-white border rounded-lg font-mono uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
              errors.gstin_tax_id || gstinDuplicateWarning
                ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                : 'border-slate-300 hover:border-slate-400 focus:border-purple-600'
            }`}
          />
          {errors.gstin_tax_id && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.gstin_tax_id.message}
            </p>
          )}
          {gstinDuplicateWarning && !errors.gstin_tax_id && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {gstinDuplicateWarning}
            </p>
          )}
        </div>

        {/* Contact Person *, Phone *, Email * */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Contact Person * */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Contact Person <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('contact_person')}
              placeholder="e.g., John Doe"
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                errors.contact_person
                  ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-300 hover:border-slate-400 focus:border-purple-600'
              }`}
            />
            {errors.contact_person && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.contact_person.message}
              </p>
            )}
          </div>

          {/* Phone * */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={10}
              {...register('phone')}
              placeholder="e.g., 9876543210"
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg transition-all font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                errors.phone
                  ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-300 hover:border-slate-400 focus:border-purple-600'
              }`}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Email * */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="e.g., vendor@service.com"
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
                errors.email
                  ? 'border-red-400 focus:border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-300 hover:border-slate-400 focus:border-purple-600'
              }`}
            />
            {errors.email && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        {/* Item Categories Serviced (Multi-Select Tag-Based) */}
        <div className="pt-2">
          <Controller
            control={control}
            name="item_category_ids"
            render={({ field }) => (
              <CategoryMultiSelect
                categories={categories}
                selectedCategoryIds={field.value || []}
                onChange={field.onChange}
                error={errors.item_category_ids?.message}
              />
            )}
          />
        </div>

        {/* Status Toggle */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Status
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Only ACTIVE vendors can be selected for new calibration outsourcing POs.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setValue('status', 'ACTIVE')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                currentStatus === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ACTIVE
            </button>
            <button
              type="button"
              onClick={() => setValue('status', 'INACTIVE')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                currentStatus === 'INACTIVE'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              INACTIVE
            </button>
          </div>
        </div>

        {/* Form Action Buttons: [Cancel] [Save Vendor] */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading || isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || isSubmitting || !!gstinDuplicateWarning}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-lg shadow-purple-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Vendor
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
