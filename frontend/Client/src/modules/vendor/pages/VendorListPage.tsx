import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Vendor, ItemCategory } from '../../../types/vendor';
import { vendorService } from '../../../services/vendorService';
import { VendorTable } from '../components/VendorTable';
import { VendorFilters } from '../components/VendorFilters';
import { VendorStatusModal } from '../components/VendorStatusModal';
import { useNotification } from '../../../context/NotificationContext';
import { usePermission } from '../../../context/PermissionContext';
import { PERMISSION_CODES } from '../../../constants/permissions';

export const VendorListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { hasPermission } = usePermission();

  const canCreate = hasPermission(PERMISSION_CODES.VENDOR_CREATE);

  // Data states
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [state, setState] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Status modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [vendorForStatus, setVendorForStatus] = useState<Vendor | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Load Categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await vendorService.getItemCategories();
        setCategories(cats);
      } catch (err) {
        console.warn('Failed to load item categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch vendors
  const fetchVendors = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await vendorService.listVendors({
        page,
        size: pageSize,
        search,
        status,
        state,
        categoryId: categoryId || undefined,
        sortBy,
        sortOrder,
      });

      setVendors(response.vendors);
      setTotalCount(response.pagination.total);
      setTotalPages(response.pagination.total_pages || 1);
    } catch (err: any) {
      showToast('Unable to load vendors.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, pageSize, search, status, state, categoryId, sortBy, sortOrder, showToast]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Handle Sort
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(columnKey);
      setSortOrder('asc');
    }
    setPage(0);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setState('');
    setCategoryId('');
    setPage(0);
  };

  // Status toggle handler
  const handleOpenStatusModal = (vendor: Vendor) => {
    setVendorForStatus(vendor);
    setStatusModalOpen(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!vendorForStatus) return;
    setStatusUpdating(true);
    const newStatus = vendorForStatus.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      await vendorService.updateStatus(vendorForStatus.id, newStatus);
      showToast(
        newStatus === 'ACTIVE'
          ? 'Vendor activated successfully.'
          : 'Vendor deactivated successfully.',
        'success'
      );
      setStatusModalOpen(false);
      setVendorForStatus(null);
      fetchVendors(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to update vendor status.', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Vendor Master
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage external calibration partners, service categories, and performance history
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => fetchVendors(true)}
            disabled={refreshing}
            className="p-2.5 text-slate-600 hover:text-purple-700 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl transition-colors"
            title="Refresh vendor list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={() => navigate('/vendors/new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Vendor
            </button>
          )}
        </div>
      </div>

      {/* Filter Component */}
      <VendorFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(0);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(0);
        }}
        state={state}
        onStateChange={(val) => {
          setState(val);
          setPage(0);
        }}
        categoryId={categoryId}
        onCategoryChange={(val) => {
          setCategoryId(val);
          setPage(0);
        }}
        categories={categories}
        onReset={handleResetFilters}
      />

      {/* Vendor Table */}
      <VendorTable
        vendors={vendors}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onView={(vendor) => navigate(`/vendors/${vendor.id}`)}
        onEdit={(vendor) => navigate(`/vendors/edit/${vendor.id}`)}
        onToggleStatus={handleOpenStatusModal}
      />

      {/* Pagination Bar */}
      {!loading && vendors.length > 0 && (
        <div className="bg-white px-5 py-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-800">{page * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-800">
              {Math.min((page + 1) * pageSize, totalCount)}
            </strong>{' '}
            of <strong className="text-slate-800">{totalCount}</strong> vendors
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </button>

            {/* Page indicator */}
            <div className="px-3 py-1 text-slate-700 font-semibold">
              Page {page + 1} of {Math.max(1, totalPages)}
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Status Activation/Deactivation Modal */}
      <VendorStatusModal
        isOpen={statusModalOpen}
        vendor={vendorForStatus}
        onClose={() => {
          setStatusModalOpen(false);
          setVendorForStatus(null);
        }}
        onConfirm={handleConfirmStatusToggle}
        isLoading={statusUpdating}
      />
    </div>
  );
};
