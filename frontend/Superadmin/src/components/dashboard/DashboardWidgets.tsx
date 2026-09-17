import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mockStore } from '../../mock/initialStore';

export const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
}> = ({ title, value, change, isPositive = true, icon, subtitle, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle hover:border-indigo-200 hover:shadow-card transition-all ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{title}</span>
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">{value}</span>
        {change && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {change}
          </span>
        )}
      </div>
      {subtitle && <span className="text-[11px] text-slate-400 mt-1 block">{subtitle}</span>}
    </div>
  );
};

// "My Work Queue" role-specific widget
export const WorkQueueWidget: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  let title = 'My Work Queue';
  let queueItems: { title: string; count: number; route: string; urgency?: string }[] = [];

  switch (user.role) {
    case 'COLLECTION_AGENT':
      title = 'Collection Agent Queue';
      queueItems = [
        {
          title: 'Requests to Create / Intake',
          count: 2,
          route: '/collection',
          urgency: 'Active Intake',
        },
        {
          title: 'Pending Client Gate Passes',
          count: 1,
          route: '/requests',
        },
      ];
      break;

    case 'LAB_USER':
      title = 'Laboratory Queue';
      queueItems = [
        {
          title: 'Items Awaiting Verification',
          count: mockStore.data.requests.filter((r) => r.status === 'VERIFICATION' || r.status === 'LAB_QUEUE').length,
          route: '/lab/queue',
          urgency: 'Priority',
        },
        {
          title: 'Instruments Ready for Calibration',
          count: mockStore.data.requests.filter((r) => r.status === 'CALIBRATION').length,
          route: '/calibration',
        },
        {
          title: 'Due List Instruments This Month',
          count: mockStore.data.dueList.length,
          route: '/calibration/due-list',
        },
      ];
      break;

    case 'COMMERCIAL_USER':
      title = 'Commercial Desk Queue';
      queueItems = [
        {
          title: 'Calibrated Items Needing Quotation',
          count: mockStore.data.requests.filter((r) => r.status === 'CALIBRATED').length,
          route: '/commercial/quotations/new',
          urgency: 'Ready to Quote',
        },
        {
          title: 'Quotations Pending Resubmission',
          count: mockStore.data.quotations.filter((q) => q.status === 'REVISION_REQUIRED').length,
          route: '/commercial/quotations',
        },
        {
          title: 'Approved Quotations Needing Invoice',
          count: mockStore.data.requests.filter((r) => r.status === 'INVOICE').length,
          route: '/commercial/invoices',
        },
      ];
      break;

    case 'APPROVER':
      title = 'Sign-Off & Approval Queue';
      queueItems = [
        {
          title: 'Quotations Requiring Sign-Off',
          count: mockStore.data.approvals.filter((a) => a.status === 'PENDING').length,
          route: '/commercial/approvals',
          urgency: 'Urgent Decision',
        },
        {
          title: 'Faulty Item Maintenance Approvals',
          count: mockStore.data.requests.filter((r) => r.status === 'FAULTY').length,
          route: '/requests',
        },
      ];
      break;

    case 'DISPATCH_USER':
      title = 'Logistics & Dispatch Queue';
      queueItems = [
        {
          title: 'Shipments Ready to Dispatch',
          count: mockStore.data.requests.filter((r) => r.status === 'READY_TO_DISPATCH').length,
          route: '/dispatch',
          urgency: 'Pack & Ship',
        },
        {
          title: 'Deliveries In Transit (Pending Sign)',
          count: mockStore.data.deliveries.filter((d) => d.status === 'IN_TRANSIT' || d.status === 'RECEIVED').length,
          route: '/deliveries',
        },
      ];
      break;

    case 'SUPER_ADMIN':
      title = 'Enterprise Platform Governance';
      queueItems = [
        {
          title: 'Active Multi-Tenant Accounts',
          count: mockStore.data.tenants.length,
          route: '/admin/tenants',
          urgency: 'Governance',
        },
        /* HIDDEN FOR NOW: Organization Management
        {
          title: 'Registered Organizations / Labs',
          count: mockStore.data.organizations.length,
          route: '/admin/organizations',
        },
        */
        {
          title: 'Provisioned System Users',
          count: mockStore.data.users.length,
          route: '/admin/users',
        },
        {
          title: 'Roles & Access Policies',
          count: mockStore.data.roles.length,
          route: '/admin/roles',
        },
      ];
      break;

    case 'ADMIN':
    default:
      title = 'Operational Exceptions & Fast Actions';
      queueItems = [
        {
          title: 'Active Calibration Requests',
          count: mockStore.data.requests.filter((r) => r.status !== 'COMPLETED').length,
          route: '/requests',
        },
        {
          title: 'Pending Commercial Approvals',
          count: mockStore.data.approvals.filter((a) => a.status === 'PENDING').length,
          route: '/commercial/approvals',
        },
        {
          title: 'Items Under Exception (Faulty / Discrepancy)',
          count: mockStore.data.requests.filter((r) => r.status === 'FAULTY' || r.status === 'DISCREPANCY' || r.status === 'OUTSOURCED').length,
          route: '/requests',
          urgency: 'Attention Needed',
        },
      ];
      break;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        <span className="text-[11px] font-medium text-slate-400">Role: {user.roleName}</span>
      </div>

      <div className="space-y-2.5">
        {queueItems.map((item, idx) => (
          <div
            key={idx}
            onClick={() => navigate(item.route)}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 transition cursor-pointer group"
          >
            <div>
              <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-700">
                {item.title}
              </div>
              {item.urgency && (
                <span className="inline-block mt-0.5 text-[10px] text-amber-700 bg-amber-100/60 font-semibold px-1.5 py-0.2 rounded">
                  {item.urgency}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                {item.count}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-indigo-600 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
