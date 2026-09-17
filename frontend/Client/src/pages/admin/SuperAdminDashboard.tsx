import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Building,
  Users,
  Contact2,
  Briefcase,
  ClipboardList,
  CheckCircle,
  Clock,
  Send,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { MetricCard, WorkQueueWidget } from '../../components/dashboard/DashboardWidgets';
import { mockStore } from '../../mock/initialStore';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import { PERMISSION_CODES } from '../../constants/permissions';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  const totalTenants = mockStore.data.tenants.length;
  const activeTenants = mockStore.data.tenants.filter((t) => t.status === 'ACTIVE').length;
  const totalOrgs = mockStore.data.organizations.length;
  const totalUsers = mockStore.data.users.length;
  const activeUsers = mockStore.data.users.filter((u) => u.status === 'ACTIVE').length;
  const totalClients = mockStore.data.clients.length;
  const totalVendors = mockStore.data.vendors.length;
  const totalRequests = mockStore.data.requests.length;
  const pendingApprovals = mockStore.data.approvals.filter((a) => a.status === 'PENDING').length;
  const pendingCalibration = mockStore.data.requests.filter((r) => r.status === 'CALIBRATION').length;
  const pendingDispatch = mockStore.data.requests.filter((r) => r.status === 'READY_TO_DISPATCH').length;
  const completedRequests = mockStore.data.requests.filter((r) => r.status === 'COMPLETED').length;

  // Master, Operations, Commercial & Platform metric cards mapped to permissions
  const allMetricCards = [
    {
      id: 'tenants',
      title: 'Total Tenants',
      value: totalTenants,
      change: '+12% YoY',
      icon: <Building2 className="w-5 h-5 text-indigo-600" />,
      subtitle: `${activeTenants} active installations`,
      onClick: () => navigate('/admin/tenants'),
      permission: PERMISSION_CODES.TENANT_VIEW,
    },
    /* HIDDEN FOR NOW: Organization Management
    {
      id: 'organizations',
      title: 'Total Organizations',
      value: totalOrgs,
      change: '+2 this mo',
      icon: <Building className="w-5 h-5 text-emerald-600" />,
      subtitle: 'Managed inside Tenants',
      onClick: () => navigate('/admin/tenants'),
      permission: PERMISSION_CODES.TENANT_VIEW,
    },
    */
    {
      id: 'users',
      title: 'Active Users',
      value: `${activeUsers} / ${totalUsers}`,
      icon: <Users className="w-5 h-5 text-sky-600" />,
      subtitle: 'System team members',
      onClick: () => navigate('/admin/users'),
      permission: PERMISSION_CODES.USER_VIEW,
    },
    // Masters
    {
      id: 'clients',
      title: 'Registered Clients',
      value: totalClients,
      change: '+3 new',
      icon: <Contact2 className="w-5 h-5 text-teal-600" />,
      subtitle: 'Master Client Accounts',
      onClick: () => navigate('/clients'),
      permission: PERMISSION_CODES.CLIENT_VIEW,
    },
    {
      id: 'vendors',
      title: 'Accredited Vendors',
      value: totalVendors,
      icon: <Briefcase className="w-5 h-5 text-purple-600" />,
      subtitle: 'Outsourcing & OEM Partners',
      onClick: () => navigate('/vendors'),
      permission: PERMISSION_CODES.VENDOR_VIEW,
    },
    {
      id: 'items',
      title: 'Total Items Master',
      value: mockStore.data.items.length,
      icon: <Package className="w-5 h-5 text-slate-600" />,
      subtitle: 'Gauges, Calipers, Standards',
      onClick: () => navigate('/items'),
      permission: PERMISSION_CODES.ITEM_VIEW,
    },
    // Operations
    {
      id: 'requests',
      title: 'Calibration Requests',
      value: totalRequests,
      change: '+18%',
      icon: <ClipboardList className="w-5 h-5 text-indigo-600" />,
      subtitle: 'Total jobs in progress',
      onClick: () => navigate('/requests'),
      permission: PERMISSION_CODES.REQUEST_VIEW,
    },
    {
      id: 'in-calibration',
      title: 'In Calibration',
      value: pendingCalibration,
      icon: <Activity className="w-5 h-5 text-blue-600" />,
      subtitle: 'Laboratory testing & readings',
      onClick: () => navigate('/calibration'),
      permission: PERMISSION_CODES.CALIBRATION_VIEW,
    },
    {
      id: 'dispatch',
      title: 'Ready for Dispatch',
      value: pendingDispatch,
      icon: <Send className="w-5 h-5 text-cyan-600" />,
      subtitle: 'Sealed & packing ready',
      onClick: () => navigate('/dispatch'),
      permission: PERMISSION_CODES.DISPATCH_VIEW,
    },
    {
      id: 'completed',
      title: 'Completed Requests',
      value: completedRequests,
      isPositive: true,
      change: '100% SLA',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      subtitle: 'Delivered & accepted',
      onClick: () => navigate('/requests'),
      permission: PERMISSION_CODES.REQUEST_VIEW,
    },
    // Commercials
    {
      id: 'approvals',
      title: 'Pending Approvals',
      value: pendingApprovals,
      isPositive: pendingApprovals === 0,
      change: pendingApprovals > 0 ? 'Action Req' : 'Clear',
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      subtitle: 'Commercial price overrides',
      onClick: () => navigate('/commercial/approvals'),
      permission: PERMISSION_CODES.QUOTATION_APPROVE,
    },
    {
      id: 'invoices',
      title: 'Commercial Invoices',
      value: `₹ ${mockStore.data.invoices.reduce((a, c) => a + c.totalAmount, 0).toLocaleString()}`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      subtitle: 'Gross commercial billing',
      onClick: () => navigate('/commercial/invoices'),
      permission: PERMISSION_CODES.INVOICE_VIEW,
    },
  ];

  // Filter metric cards to strictly show only necessary masters, operations, and commercials for the current role
  const visibleCards = allMetricCards.filter((card) => hasPermission(card.permission));

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-400 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/50">
              Role: {user?.roleName || user?.role || 'Metrology Workspace'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Commercial Metrology Platform
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Live calibration management workspace tailored to your role privileges under NABL ISO/IEC 17025 standards.
          </p>
        </div>
      </div>

      {/* Role-filtered Key Metrics Grid */}
      {visibleCards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {user?.roleName ? `${user.roleName} Overview & Key Metrics` : 'Operational Health & KPIs'}
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {visibleCards.length} Modules Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleCards.map((card) => (
              <MetricCard
                key={card.id}
                title={card.title}
                value={card.value}
                change={card.change}
                isPositive={card.isPositive}
                icon={card.icon}
                subtitle={card.subtitle}
                onClick={card.onClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Section: Operations Pipeline, Role Queue & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pipeline & Audit (if permitted) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Status Distribution (Operations only) */}
          {hasPermission(PERMISSION_CODES.REQUEST_VIEW) && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-subtle">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Calibration Request Pipeline</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Distribution of active requests by stage</p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {totalRequests} Active Requests
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { stage: 'Ready to Dispatch / Packing', count: 1, color: 'bg-teal-500', pct: 15 },
                  { stage: 'Item Physical Verification', count: 2, color: 'bg-sky-500', pct: 25 },
                  { stage: 'Metrology Testing & Calibration', count: 2, color: 'bg-indigo-500', pct: 25 },
                  { stage: 'Quotation & Approval', count: 1, color: 'bg-amber-500', pct: 15 },
                  { stage: 'Exceptions (Faulty / Outsource / Discrepancy)', count: 2, color: 'bg-rose-500', pct: 20 },
                ].map((bar, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{bar.stage}</span>
                      <span className="font-mono text-slate-500 font-semibold">{bar.count} jobs</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${bar.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Audit Feed - Only for users with Audit View permission */}
          {hasPermission(PERMISSION_CODES.AUDIT_VIEW) && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-subtle">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Recent Enterprise Activity</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time audit log stream</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/audit-logs')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                >
                  <span>View Full Audit Log</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {mockStore.data.auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{log.userName}</span>
                        <span className="text-[10px] font-mono text-slate-400">({log.role})</span>
                        <span className="font-mono text-[11px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                          {log.module}.{log.action}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{log.newValue || log.oldValue}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Role Work Queue & Action Banners */}
        <div className="space-y-6">
          <WorkQueueWidget />

          {/* HIDDEN FOR NOW: Direct Organization Onboarding Banner
          {hasPermission(PERMISSION_CODES.ORGANIZATION_CREATE) && (
            <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-5 border border-emerald-900/60 shadow-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Organization Onboarding</h3>
              </div>
              <p className="text-xs text-emerald-200/80 leading-relaxed mb-4">
                Onboard new calibration laboratories using the 5-step onboarding wizard. Configures Company Info, Address, Inventory, and Administrator.
              </p>
              <button
                type="button"
                onClick={() => navigate('/organizations/new')}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Launch Onboarding Wizard
              </button>
            </div>
          )}
          */}
        </div>
      </div>
    </div>
  );
};
