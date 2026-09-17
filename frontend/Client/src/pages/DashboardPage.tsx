import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Award, Receipt, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const metrics = [
    { label: 'Active Calibration Jobs', count: 3, icon: <Clock className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-50' },
    { label: 'Completed & Certified', count: 12, icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50' },
    { label: 'Ready for Dispatch', count: 2, icon: <FileText className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50' },
    { label: 'Pending Invoices', count: 1, icon: <Receipt className="w-5 h-5 text-sky-600" />, bg: 'bg-sky-50' },
  ];

  const recentJobs = [
    { id: '1', jobNo: 'REQ-2026-081', item: 'Digital Vernier Caliper 0-300mm', serial: 'VC-99120', status: 'IN_LAB', date: '2026-09-15' },
    { id: '2', jobNo: 'REQ-2026-079', item: 'Micrometer Gauge 25-50mm', serial: 'MG-44211', status: 'CALIBRATED', date: '2026-09-14' },
    { id: '3', jobNo: 'REQ-2026-072', item: 'Dial Indicator 0-10mm / 0.01mm', serial: 'DI-10992', status: 'DELIVERED', date: '2026-09-10' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/50">
            Client Workspace • {user?.clientCode}
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-2">Welcome, {user?.companyName}</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track equipment verification progress, view calibration parameters, and download certified reports.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900">{m.count}</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">{m.label}</div>
            </div>
            <div className={`w-11 h-11 rounded-xl ${m.bg} flex items-center justify-center`}>
              {m.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Equipment Under Calibration */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Calibration Status</h2>
            <p className="text-xs text-slate-500">Live testing and verification stage of your company instruments</p>
          </div>
          <NavLink to="/requests" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="divide-y divide-slate-100">
          {recentJobs.map((job) => (
            <div key={job.id} className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 transition">
              <div>
                <div className="text-xs font-bold text-slate-900">{job.item}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {job.jobNo} • Serial: {job.serial} • Submitted: {job.date}
                </div>
              </div>
              <span className={`self-start sm:self-auto text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                job.status === 'CALIBRATED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                job.status === 'IN_LAB' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {job.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
