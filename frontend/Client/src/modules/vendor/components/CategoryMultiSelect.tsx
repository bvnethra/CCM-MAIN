import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, ChevronDown } from 'lucide-react';
import { ItemCategory } from '../../../types/vendor';

interface CategoryMultiSelectProps {
  categories: ItemCategory[];
  selectedCategoryIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
  error?: string;
}

export const CategoryMultiSelect: React.FC<CategoryMultiSelectProps> = ({
  categories,
  selectedCategoryIds,
  onChange,
  disabled = false,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.category_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleCategory = (catId: string) => {
    if (disabled) return;
    if (selectedCategoryIds.includes(catId)) {
      onChange(selectedCategoryIds.filter((id) => id !== catId));
    } else {
      onChange([...selectedCategoryIds, catId]);
    }
  };

  const handleRemoveCategory = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedCategoryIds.filter((id) => id !== catId));
  };

  const selectedCategories = categories.filter((cat) =>
    selectedCategoryIds.includes(cat.id)
  );

  return (
    <div className="w-full space-y-2.5" ref={containerRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
        Item Categories Serviced
        <span className="ml-1 text-[11px] font-normal lowercase text-slate-400">
          (optional multi-select capability)
        </span>
      </label>

      {/* Select Dropdown Trigger */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-lg text-left text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${
            error
              ? 'border-red-400 focus:border-red-500'
              : isOpen
              ? 'border-purple-500 ring-2 ring-purple-500/10'
              : 'border-slate-300 hover:border-slate-400'
          } ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-75' : ''}`}
        >
          <span className="text-slate-600 truncate font-medium">
            {selectedCategoryIds.length === 0
              ? 'Select Categories ▼'
              : `${selectedCategoryIds.length} categories selected`}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180 text-purple-600' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {/* Search within categories */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/70">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search categories (e.g., Electrical, Pressure)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
              {filteredCategories.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No matching item categories found
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleToggleCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                        isSelected
                          ? 'bg-purple-50 text-purple-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{cat.category_name}</span>
                        {cat.description && (
                          <span className="text-[10px] text-slate-400 font-normal truncate">
                            {cat.description}
                          </span>
                        )}
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-purple-600 border-purple-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Categories Display Tags/Chips */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-semibold text-slate-500 block">
          Selected Categories:
        </span>
        {selectedCategories.length === 0 ? (
          <span className="text-xs text-slate-400 italic">None selected yet</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 shadow-sm transition-all"
              >
                {cat.category_name}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveCategory(cat.id, e)}
                    className="hover:bg-purple-200/80 p-0.5 rounded-full text-purple-600 hover:text-purple-900 transition-colors"
                    title={`Remove ${cat.category_name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};
