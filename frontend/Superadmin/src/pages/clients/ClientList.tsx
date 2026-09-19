import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Eye,
  Edit,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Client, ClientFilters } from '../../types/client';
import { clientService } from '../../services/clientService';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { formatPaymentTerms, formatStatus } from '../../schemas/clientSchema';

export const ClientListPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<ClientFilters>({});
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const size = 20;
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await clientService.getClients(page, size, {
        ...filters,
        search: search.trim() || undefined
      });
      
      setClients(response.clients || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.total_pages || 0);
    } catch (error: any) {
      console.error('Failed to load clients:', error);
      showToast(error.message || 'Failed to load clients', 'error');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [page, filters, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0); // Reset to first page
  };

  const handleFilterChange = (newFilters: Partial<ClientFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(0); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({});
    setSearch('');
    setPage(0);
  };

  const columns: Column<Client>[] = [
    {
      key: 'clientCode',
      header: 'Client Code',
      sortable: true,
      render: (client) => (
        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-200/50">
          {client.clientCode}
        </span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client Info',
      sortable: true,
      render: (client) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs">{client.clientName}</span>
          <span className="text-[11px] text-slate-500 font-medium">{client.city}, {client.state}</span>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      render: (client) => (
        <div className="text-xs">
          <span className="font-medium text-slate-900 block">{client.contactPerson}</span>
          <span className="text-[11px] text-slate-500 font-mono">{client.phone}</span>
        </div>
      ),
    },
    {
      key: 'gstinTaxId',
      header: 'GSTIN',
      render: (client) => (
        <span className="font-mono text-xs text-slate-700">{client.gstinTaxId}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (client) => <span className="text-xs text-slate-600">{client.email}</span>,
    },
    {
      key: 'paymentTerms',
      header: 'Payment Terms',
      render: (client) => (
        <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-700">
          {formatPaymentTerms(client.paymentTerms)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (client) => (
        <StatusBadge 
          status={client.status} 
          size="sm"
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (client) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/clients/${client.id}`)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/clients/${client.id}/edit`)}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
            title="Edit Client"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Client Master
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage customer companies that send items for calibration and generate business.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/clients/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Client
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, code, city, or GSTIN..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange({ status: e.target.value as any || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {/* Payment Terms Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
                <select
                  value={filters.paymentTerms || ''}
                  onChange={(e) => handleFilterChange({ paymentTerms: e.target.value as any || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Terms</option>
                  <option value="IMMEDIATE">Immediate</option>
                  <option value="30_DAYS">30 Days</option>
                  <option value="60_DAYS">60 Days</option>
                </select>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="Filter by city"
                  value={filters.city || ''}
                  onChange={(e) => handleFilterChange({ city: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* State Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  placeholder="Filter by state"
                  value={filters.state || ''}
                  onChange={(e) => handleFilterChange({ state: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-300 rounded-lg"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          data={clients}
          columns={columns}
          loading={loading}
          onRowClick={(client) => navigate(`/clients/${client.id}`)}
        />

        {/* Custom Pagination */}
        {!loading && clients.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {page * size + 1} to {Math.min((page + 1) * size, total)} of {total} clients
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && clients.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {search || Object.values(filters).some(Boolean) 
                ? 'Try adjusting your search or filters'
                : 'Create your first client to get started'
              }
            </p>
            {!search && !Object.values(filters).some(Boolean) && (
              <button
                onClick={() => navigate('/clients/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create First Client
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};