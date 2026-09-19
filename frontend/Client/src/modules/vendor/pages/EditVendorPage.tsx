import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { VendorForm } from '../components/VendorForm';
import { VendorFormValues } from '../../../schemas/vendorSchema';
import { Vendor, ItemCategory } from '../../../types/vendor';
import { vendorService } from '../../../services/vendorService';
import { useNotification } from '../../../context/NotificationContext';
import { usePermission } from '../../../context/PermissionContext';
import { PERMISSION_CODES } from '../../../constants/permissions';

export const EditVendorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { hasPermission } = usePermission();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Check RBAC permission
  useEffect(() => {
    if (!hasPermission(PERMISSION_CODES.VENDOR_UPDATE)) {
      showToast('You do not have permission to edit this vendor.', 'error');
      navigate('/vendors');
    }
  }, [hasPermission, navigate, showToast]);

  // Load Vendor and Categories
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [vendorData, cats] = await Promise.all([
          vendorService.getById(id),
          vendorService.getItemCategories(),
        ]);
        if (!vendorData) {
          showToast('Vendor not found.', 'error');
          navigate('/vendors');
          return;
        }
        setVendor(vendorData);
        setCategories(cats);
      } catch (err) {
        showToast('Unable to load vendor information.', 'error');
        navigate('/vendors');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, navigate, showToast]);

  const handleUpdateSubmit = async (values: VendorFormValues) => {
    if (!id) return;
    setSaving(true);
    try {
      await vendorService.update(id, values);
      showToast('Vendor updated successfully.', 'success');
      navigate(`/vendors/${id}`);
    } catch (err: any) {
      showToast(err.message || 'Unable to update vendor. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading vendor details...</p>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={() => navigate(`/vendors/${id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vendor Profile
        </button>
      </div>

      {/* Edit Form */}
      <VendorForm
        initialData={vendor}
        categories={categories}
        onSubmit={handleUpdateSubmit}
        onCancel={() => navigate(`/vendors/${id}`)}
        isLoading={saving}
      />
    </div>
  );
};
