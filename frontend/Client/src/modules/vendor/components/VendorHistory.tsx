import React, { useState } from 'react';
import { ShoppingCart, Wrench, CheckCircle2, Clock, FileText, AlertCircle } from 'lucide-react';
import { VendorHistoryRollup } from '../../../types/vendor';

interface VendorHistoryProps {
  history: VendorHistoryRollup | null;
  loading?: boolean;
}

export const VendorHistory: React.FC<VendorHistoryProps> = ({ history, loading = false }) => {
  const [activeTab, setActiveTab] = useState<'pos' | 'services' | 'outstanding'>('pos');

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent mb-3" />
        <p className="text-sm font-medium">Aggregating historical vendor transactions...</p>
      </div>
    );
  }

  const pos = history?.purchase_orders || [];
  const itemsServiced = history?.items_serviced || [];
  const outstandingReceived = history?.outstanding_received || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 bg-slate-50/70 px-4 flex space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'pos'
              ? 'border-purple-600 text-purple-700 bg-white shadow-sm'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Purchase Orders
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {pos.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'services'
              ? 'border-purple-600 text-purple-700 bg-white shadow-sm'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Items Serviced
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {itemsServiced.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('outstanding')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'outstanding'
              ? 'border-purple-600 text-purple-700 bg-white shadow-sm'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Outstanding / Received
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {outstandingReceived.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* 1. PURCHASE ORDERS */}
        {activeTab === 'pos' && (
          <div>
            {pos.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                No Purchase Orders raised for this vendor yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold bg-slate-50">
                      <th className="py-2.5 px-3">PO Number</th>
                      <th className="py-2.5 px-3">PO Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Outstanding / Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pos.map((po, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-mono font-bold text-purple-700">
                          {po.po_number}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {new Date(po.po_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {po.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {po.amount != null ? `₹${po.amount.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              po.outstanding_received_status === 'RECEIVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : po.outstanding_received_status === 'OUTSTANDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {po.outstanding_received_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. ITEMS SERVICED */}
        {activeTab === 'services' && (
          <div>
            {itemsServiced.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Wrench className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                No calibration items serviced by this vendor yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold bg-slate-50">
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3">Item Code</th>
                      <th className="py-2.5 px-3">Service / Calibration</th>
                      <th className="py-2.5 px-3">Service Date</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemsServiced.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {item.item}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {item.item_code}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {item.service_calibration}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {item.service_date
                            ? new Date(item.service_date).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. OUTSTANDING / RECEIVED */}
        {activeTab === 'outstanding' && (
          <div>
            {outstandingReceived.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                No outstanding or returned service items on record.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold bg-slate-50">
                      <th className="py-2.5 px-3">Outsourcing / PO #</th>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Received Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outstandingReceived.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {entry.po_number}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900">
                          {entry.item}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              entry.status === 'RETURNED' || entry.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {entry.received_date
                            ? new Date(entry.received_date).toLocaleDateString()
                            : 'Pending'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
