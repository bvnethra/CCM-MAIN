import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { ItemCategory } from '../../../types/vendor';

interface VendorFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  state: string;
  onStateChange: (val: string) => void;
  categoryId: string;
  onCategoryChange: (val: string) => void;
  categories: ItemCategory[];
  onReset: () => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry'
];

export const VendorFilters: React.FC<VendorFiltersProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  state,
  onStateChange,
  categoryId,
  onCategoryChange,
  categories,
  onReset,
}) => {
  const hasActiveFilters = Boolean(search || status || state || categoryId);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Vendor (Code, Name, City, GSTIN)..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* State Filter */}
        <div>
          <select
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-slate-700"
          >
            <option value="">All States</option>
            {INDIAN_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Item Category Filter */}
        <div>
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-slate-700"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter status and Reset button */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-purple-600" />
            Filtered view active
          </span>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};
