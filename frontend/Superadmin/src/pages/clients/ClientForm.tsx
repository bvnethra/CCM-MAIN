import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Users,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { clientFormSchema, ClientFormData } from '../../schemas/clientSchema';
import { clientService } from '../../services/clientService';
import { useNotification } from '../../context/NotificationContext';

interface ClientFormProps {
  mode: 'create' | 'edit';
}

export const ClientFormPage: React.FC<ClientFormProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [gstinCheckLoading, setGstinCheckLoading] = useState(false);
  const [nameCheckLoading, setNameCheckLoading] = useState(false);
  const [gstinDuplicateError, setGstinDuplicateError] = useState<string>('');
  const [nameWarning, setNameWarning] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
    reset
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      status: 'ACTIVE',
      paymentTerms: '30_DAYS',
      useSameAddress: false
    }
  });

  // Watch form values
  const watchedValues = watch();
  const useSameAddress = watch('useSameAddress');
  const registeredAddress = watch('registeredAddress');

  // Load existing client data for edit mode
  useEffect(() => {
    if (mode === 'edit' && id) {
      loadClientData(id);
    }
  }, [mode, id]);

  // Auto-sync billing address when checkbox is checked
  useEffect(() => {
    if (useSameAddress && registeredAddress) {
      setValue('billingAddress', registeredAddress);
    }
  }, [useSameAddress, registeredAddress, setValue]);

  const loadClientData = async (clientId: string) => {
    setInitialLoading(true);
    try {
      const response = await clientService.getClient(clientId, false);
      const client = response.client;
      
      reset({
        clientName: client.clientName,
        registeredAddress: client.registeredAddress,
        billingAddress: client.billingAddress,
        city: client.city,
        state: client.state,
        pinCode: client.pinCode,
        gstinTaxId: client.gstinTaxId,
        contactPerson: client.contactPerson,
        phone: client.phone,
        email: client.email,
        status: client.status,
        paymentTerms: client.paymentTerms,
        useSameAddress: client.billingAddress === client.registeredAddress
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to load client data', 'error');
      navigate('/clients');
    } finally {
      setInitialLoading(false);
    }
  };

  // Debounced GSTIN duplicate check
  useEffect(() => {
    const gstin = watchedValues.gstinTaxId;
    if (!gstin || gstin.length < 15) {
      setGstinDuplicateError('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setGstinCheckLoading(true);
      try {
        const result = await clientService.checkGstinDuplicate(
          gstin,
          mode === 'edit' ? id : undefined
        );
        
        if (result.is_duplicate) {
          setGstinDuplicateError(
            `GSTIN already exists for client "${result.existing_client_name}" (${result.existing_client_code})`
          );
        } else {
          setGstinDuplicateError('');
        }
      } catch (error) {
        console.error('GSTIN check failed:', error);
      } finally {
        setGstinCheckLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedValues.gstinTaxId, mode, id]);

  // Debounced name duplicate check
  useEffect(() => {
    const name = watchedValues.clientName;
    if (!name || name.length < 3) {
      setNameWarning('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setNameCheckLoading(true);
      try {
        const result = await clientService.checkNameDuplicate(
          name,
          mode === 'edit' ? id : undefined
        );
        
        if (result.is_duplicate) {
          setNameWarning(
            `A client with similar name already exists (${result.count} ${result.count === 1 ? 'client' : 'clients'})`
          );
        } else {
          setNameWarning('');
        }
      } catch (error) {
        console.error('Name check failed:', error);
      } finally {
        setNameCheckLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedValues.clientName, mode, id]);

  const onSubmit = async (data: ClientFormData) => {
    // Block submission if GSTIN duplicate
    if (gstinDuplicateError) {
      showToast('Please fix the GSTIN duplicate issue before submitting', 'error');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        const response = await clientService.createClient(data);
        
        showToast('Client created successfully', 'success');
        
        // Show name duplicate warning if exists
        if (response.has_name_duplicate_warning) {
          setTimeout(() => {
            showToast('Note: A client with similar name already exists', 'warning');
          }, 1000);
        }
        
        navigate('/clients');
      } else if (mode === 'edit' && id) {
        await clientService.updateClient(id, data);
        showToast('Client updated successfully', 'success');
        navigate(`/clients/${id}`);
      }
    } catch (error: any) {
      showToast(error.message || 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading client data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/clients')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            {mode === 'create' ? 'Create Client' : 'Edit Client'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'create' 
              ? 'Add a new customer company to the system'
              : 'Update client information and business details'
            }
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Code (Edit mode only) */}
            {mode === 'edit' && (
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Code
                </label>
                <input
                  type="text"
                  value={id ? (client?.clientCode || 'Loading...') : 'Auto-generated'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Client code cannot be modified</p>
              </div>
            )}

            {/* Client Name */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...register('clientName')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.clientName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter client company name"
                />
                {nameCheckLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              {errors.clientName && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.clientName.message}
                </p>
              )}
              {nameWarning && (
                <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {nameWarning}
                </p>
              )}
            </div>

            {/* Registered Address */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registered Address <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('registeredAddress')}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.registeredAddress ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter complete registered address"
              />
              {errors.registeredAddress && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.registeredAddress.message}
                </p>
              )}
            </div>

            {/* Billing Address */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Billing Address
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    {...register('useSameAddress')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Same as registered address
                </label>
              </div>
              <textarea
                {...register('billingAddress')}
                rows={3}
                disabled={useSameAddress}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  useSameAddress ? 'bg-gray-50 text-gray-500' : 'border-gray-300'
                }`}
                placeholder={useSameAddress ? "Will use registered address" : "Enter billing address (optional)"}
              />
            </div>

            {/* City, State, PIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('city')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.city ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter city"
              />
              {errors.city && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.city.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('state')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.state ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter state"
              />
              {errors.state && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.state.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('pinCode')}
                maxLength={6}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.pinCode ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="000000"
              />
              {errors.pinCode && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.pinCode.message}
                </p>
              )}
            </div>

            {/* GSTIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GSTIN / Tax ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...register('gstinTaxId')}
                  maxLength={15}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono ${
                    errors.gstinTaxId || gstinDuplicateError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="22AAAAA0000A1Z5"
                />
                {gstinCheckLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              {errors.gstinTaxId && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.gstinTaxId.message}
                </p>
              )}
              {gstinDuplicateError && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {gstinDuplicateError}
                </p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('contactPerson')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.contactPerson ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter contact person name"
              />
              {errors.contactPerson && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.contactPerson.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register('phone')}
                maxLength={10}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="9876543210"
              />
              {errors.phone && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="contact@client.com"
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms <span className="text-red-500">*</span>
              </label>
              <select
                {...register('paymentTerms')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="IMMEDIATE">Immediate</option>
                <option value="30_DAYS">30 Days</option>
                <option value="60_DAYS">60 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 bg-white rounded-lg border border-gray-200 p-6">
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !isValid || !!gstinDuplicateError}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Saving...' : mode === 'create' ? 'Create Client' : 'Update Client'}
          </button>
        </div>
      </form>
    </div>
  );
};