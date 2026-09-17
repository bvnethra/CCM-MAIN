import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building, Factory, Users, Package, FileText, CheckSquare, Truck, ArrowRight, X } from 'lucide-react';
import { mockStore } from '../../mock/initialStore';

export const GlobalSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return null;
    const q = query.toLowerCase();

    const requests = mockStore.data.requests
      .filter((r) => r.requestNumber.toLowerCase().includes(q) || r.clientName.toLowerCase().includes(q))
      .slice(0, 3);

    const clients = mockStore.data.clients
      .filter((c) => c.clientName.toLowerCase().includes(q) || c.clientCode.toLowerCase().includes(q))
      .slice(0, 3);

    const items = mockStore.data.items
      .filter((i) => i.itemName.toLowerCase().includes(q) || i.itemCode.toLowerCase().includes(q))
      .slice(0, 3);

    const quotations = mockStore.data.quotations
      .filter((qt) => qt.quotationNumber.toLowerCase().includes(q) || qt.clientName.toLowerCase().includes(q))
      .slice(0, 3);

    const invoices = mockStore.data.invoices
      .filter((inv) => inv.invoiceNumber.toLowerCase().includes(q) || inv.clientName.toLowerCase().includes(q))
      .slice(0, 3);

    const dispatches = mockStore.data.dispatches
      .filter((d) => d.dispatchNumber.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q))
      .slice(0, 3);

    return { requests, clients, items, quotations, invoices, dispatches };
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden animate-scale-up">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search requests, clients, items, quotations, invoices, dispatch..."
            className="flex-1 text-sm bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!results ? (
            <div className="text-center py-10 text-xs text-slate-400">
              Type at least 2 characters to search across all operational modules...
            </div>
          ) : Object.values(results).every((arr) => arr.length === 0) ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {results.requests.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 px-2">
                    Calibration Requests
                  </span>
                  <div className="space-y-1">
                    {results.requests.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => handleSelect(`/requests/${r.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <div>
                            <span className="font-semibold text-slate-800">{r.requestNumber}</span>
                            <span className="text-slate-400 mx-2">•</span>
                            <span className="text-slate-600">{r.clientName}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.clients.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 px-2">
                    Clients
                  </span>
                  <div className="space-y-1">
                    {results.clients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelect(`/clients/${c.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <Building className="w-4 h-4 text-emerald-600" />
                          <div>
                            <span className="font-semibold text-slate-800">{c.clientName}</span>
                            <span className="text-slate-400 mx-2">•</span>
                            <span className="text-slate-500 font-mono">{c.clientCode}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">{c.city}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.items.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 px-2">
                    Item Master
                  </span>
                  <div className="space-y-1">
                    {results.items.map((i) => (
                      <div
                        key={i.id}
                        onClick={() => handleSelect(`/items/${i.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <Package className="w-4 h-4 text-blue-600" />
                          <div>
                            <span className="font-semibold text-slate-800">{i.itemName}</span>
                            <span className="text-slate-400 mx-2">•</span>
                            <span className="text-slate-500 font-mono">{i.itemCode}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">₹{i.standardCost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.quotations.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 px-2">
                    Quotations
                  </span>
                  <div className="space-y-1">
                    {results.quotations.map((qt) => (
                      <div
                        key={qt.id}
                        onClick={() => handleSelect(`/commercial/quotations/${qt.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-amber-600" />
                          <div>
                            <span className="font-semibold text-slate-800">{qt.quotationNumber}</span>
                            <span className="text-slate-400 mx-2">•</span>
                            <span className="text-slate-600">{qt.clientName}</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-600">₹{qt.totalAmount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Navigate with mouse or click ESC to close</span>
          <span className="font-medium text-slate-500">CCM Enterprise Search</span>
        </div>
      </div>
    </div>
  );
};
