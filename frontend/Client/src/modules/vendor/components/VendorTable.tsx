import React from 'react';
import { Eye, Edit3, Power, ArrowUpDown, ChevronRight } from 'lucide-react';
import { Vendor } from '../../../types/vendor';
import { usePermission } from '../../../context/PermissionContext';
import { PERMISSION_CODES } from '../../../constants/permissions';

interface VendorTableProps {
  vendors: Vendor[];
  loading: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  onView: (vendor: Vendor) => void;
  onEdit: (vendor: Vendor) => void;
  onToggleStatus: (vendor: Vendor) => void;
}

export const VendorTable: React.FC<VendorTableProps> = ({
  vendors,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onToggleStatus,
}) => {
  const { hasPermission } = usePermission();

  const canEdit = hasPermission(PERMISSION_CODES.VENDOR_UPDATE);
  const canChangeStatus = hasPermission(PERMISSION_CODES.VENDOR_STATUS_UPDATE) || hasPermission(PERMISSION_CODES.VENDOR_UPDATE);

  const renderSortIcon = (columnKey: string) => {
    if (!onSort) return null;
    const isActive = sortBy === columnKey;
    return (
      <ArrowUpDown
        className={`w-3.5 h-3.5 inline-block ml-1 transition-colors ${
          isActive ? 'text-purple-600 font-bold' : 'text-slate-400 hover:text-slate-600'
        }`}
      />
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-12 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Loading vendors...</p>
        </div>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-12 text-center space-y-2">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Eye className="w-6 h-6 text-purple-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No vendors found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no vendors matching your current search or filter criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th
                onClick={() => onSort && onSort('vendor_code')}
                className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100/70"
              >
                Vendor Code {renderSortIcon('vendor_code')}
              </th>
              <th
                onClick={() => onSort && onSort('vendor_name')}
                className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100/70"
              >
                Vendor Name {renderSortIcon('vendor_name')}
              </th>
              <th
                onClick={() => onSort && onSort('city')}
                className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100/70"
              >
                City / State {renderSortIcon('city')}
              </th>
              <th className="py-3 px-4">GSTIN / Tax ID</th>
              <th className="py-3 px-4">Contact Person</th>
              <th className="py-3 px-4">Phone</th>
              <th
                onClick={() => onSort && onSort('status')}
                className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100/70 text-center"
              >
                Status {renderSortIcon('status')}
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {vendors.map((vendor) => {
              const code = vendor.vendor_code || vendor.vendorCode;
              const name = vendor.vendor_name || vendor.vendorName;
              const gstin = vendor.gstin_tax_id || vendor.gstNumber;
              const contact = vendor.contact_person || vendor.contactPersonName;
              const phone = vendor.phone || vendor.phoneNumber;

              return (
                <tr
                  key={vendor.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Vendor Code */}
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-700 whitespace-nowrap">
                    <span className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200/60">
                      {code}
                    </span>
                  </td>

                  {/* Vendor Name & Categories */}
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <div className="font-semibold text-slate-900">{name}</div>
                    {vendor.categories && vendor.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {vendor.categories.slice(0, 2).map((cat) => (
                          <span
                            key={cat.id}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600"
                          >
                            {cat.category_name}
                          </span>
                        ))}
                        {vendor.categories.length > 2 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-medium">
                            +{vendor.categories.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* City / State */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{vendor.city}</div>
                    <div className="text-[11px] text-slate-500">{vendor.state}</div>
                  </td>

                  {/* GSTIN */}
                  <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                    {gstin ? (
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium text-slate-700">
                        {gstin}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>

                  {/* Contact Person */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 font-medium">
                    {contact}
                  </td>

                  {/* Phone */}
                  <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap text-slate-600">
                    {phone}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        vendor.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          vendor.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {vendor.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1">
                      {/* View button */}
                      <button
                        type="button"
                        onClick={() => onView(vendor)}
                        className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View Vendor Profile & History"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit button (RBAC governed) */}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(vendor)}
                          className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Vendor Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Status Toggle button (RBAC governed) */}
                      {canChangeStatus && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(vendor)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            vendor.status === 'ACTIVE'
                              ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                              : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                          }`}
                          title={
                            vendor.status === 'ACTIVE'
                              ? 'Deactivate Vendor'
                              : 'Activate Vendor'
                          }
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
