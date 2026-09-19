import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { VendorForm } from '../components/VendorForm';
import { VendorFormValues } from '../../../schemas/vendorSchema';
import { ItemCategory } from '../../../types/vendor';
import { vendorService } from '../../../services/vendorService';
import { useNotification } from '../../../context/NotificationContext';
import { usePermission } from '../../../context/PermissionContext';
import { PERMISSION_CODES } from '../../../constants/permissions';

export const CreateVendorPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { hasPermission } = usePermission();

  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Check RBAC permission
  useEffect(() => {
    if (!hasPermission(PERMISSION_CODES.VENDOR_CREATE)) {
      showToast('You do not have permission to create a vendor.', 'error');
      navigate('/vendors');
    }
  }, [hasPermission, navigate, showToast]);

  // Load item categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await vendorService.getItemCategories();
        setCategories(cats);
      } catch (err) {
        console.warn('Could not load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const handleCreateSubmit = async (values: VendorFormValues) => {
    setSubmitting(true);
    try {
      const result = await vendorService.create(values);
      if (result.hasNameDuplicateWarning) {
        showToast(
          'Vendor created successfully (Note: duplicate vendor name warning on record).',
          'info'
        );
      } else {
        showToast('Vendor created successfully.', 'success');
      }
      navigate('/vendors');
    } catch (err: any) {
      showToast(err.message || 'Unable to save vendor. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/vendors')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vendor Master
        </button>
      </div>

      {/* Responsive Form */}
      <VendorForm
        categories={categories}
        onSubmit={handleCreateSubmit}
        onCancel={() => navigate('/vendors')}
        isLoading={submitting || loadingCategories}
      />
    </div>
  );
};
