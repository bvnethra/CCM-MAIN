import React, { useState } from 'react';
import { Search, Filter, Clock, CheckCircle2, Truck, AlertCircle, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ClientRequestItem } from '../types/client';

const mockRequests: ClientRequestItem[] = [
  {
    id: 'req-1',
    requestNumber: 'REQ-2026-081',
    itemName: 'Digital Vernier Caliper 0-300mm (Mitutoyo)',
    serialNumber: 'VC-99120',
    status: 'IN_LAB',
    submittedDate: '2026-09-15',
    expectedDeliveryDate: '2026-09-20',
  },
  {
    id: 'req-2',
    requestNumber: 'REQ-2026-079',
    itemName: 'External Micrometer Gauge 25-50mm',
    serialNumber: 'MG-44211',
    status: 'CALIBRATED',
    submittedDate: '2026-09-14',
    expectedDeliveryDate: '2026-09-18',
    certificateUrl: '/api/certificates/CERT-2026-079.pdf',
  },
  {
    id: 'req-3',
    requestNumber: 'REQ-2026-072',
    itemName: 'Dial Indicator 0-10mm / 0.01mm resolution',
    serialNumber: 'DI-10992',
    status: 'DELIVERED',
    submittedDate: '2026-09-10',
    expectedDeliveryDate: '2026-09-13',
    certificateUrl: '/api/certificates/CERT-2026-072.pdf',
  },
  {
    id: 'req-4',
    requestNumber: 'REQ-2026-065',
    itemName: 'Torque Wrench 40-200 Nm',
    serialNumber: 'TW-8823',
    status: 'PENDING',
    submittedDate: '2026-09-16',
    expectedDeliveryDate: '2026-09-24',
  },
  {
    id: 'req-5',
    requestNumber: 'REQ-2026-060',
    itemName: 'Pressure Gauge 0-600 PSI',
    serialNumber: 'PG-33100',
    status: 'DISPATCHED',
    submittedDate: '2026-09-11',
    expectedDeliveryDate: '2026-09-17',
    certificateUrl: '/api/certificates/CERT-2026-060.pdf',
  },
];

export const RequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = mockRequests.filter((item) => {
    const matchesSearch =
      item.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ClientRequestItem['status']) => {
    switch (status) {
      case 'CALIBRATED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Calibrated</span>;
      case 'IN_LAB':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"><Clock className="w-3 h-3" /> Under Test</span>;
      case 'DISPATCHED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200"><Truck className="w-3 h-3" /> Dispatched</span>;
      case 'DELIVERED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200"><CheckCircle2 className="w-3 h-3" /> Delivered</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200"><AlertCircle className="w-3 h-3" /> Received</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Calibration Requests</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time status of instruments submitted by {user?.companyName}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by job ID, tool name, serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {['ALL', 'PENDING', 'IN_LAB', 'CALIBRATED', 'DISPATCHED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <th className="py-3 px-5">Job Reference</th>
                <th className="py-3 px-5">Instrument Details</th>
                <th className="py-3 px-5">Serial No</th>
                <th className="py-3 px-5">Submitted</th>
                <th className="py-3 px-5">Target Date</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-5 font-mono font-semibold text-slate-900">
                    {req.requestNumber}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="font-medium text-slate-800">{req.itemName}</div>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-slate-600">
                    {req.serialNumber}
                  </td>
                  <td className="py-3.5 px-5 text-slate-500">
                    {req.submittedDate}
                  </td>
                  <td className="py-3.5 px-5 text-slate-500">
                    {req.expectedDeliveryDate}
                  </td>
                  <td className="py-3.5 px-5">
                    {getStatusBadge(req.status)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    No calibration requests match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
