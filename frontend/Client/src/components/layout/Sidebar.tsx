import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Building,
  Users,
  ShieldAlert,
  KeyRound,
  Contact2,
  Truck,
  Package,
  Layers,
  FileCheck,
  ClipboardList,
  FlaskConical,
  FileCheck2,
  Receipt,
  CheckCircle,
  ShoppingBag,
  FileSpreadsheet,
  FileSignature,
  Send,
  CalendarClock,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import { PERMISSION_CODES } from '../../constants/permissions';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
  badge?: number;
  section?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.roleName === 'Super Admin';

  const superAdminSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'CORE',
      items: [
        { title: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        {
          title: 'Tenant Management',
          path: '/admin/tenants',
          icon: <Building2 className="w-4 h-4" />,
          permission: PERMISSION_CODES.TENANT_VIEW,
        },
        {
          title: 'User Management',
          path: '/admin/users',
          icon: <Users className="w-4 h-4" />,
          permission: PERMISSION_CODES.USER_VIEW,
        },
        {
          title: 'Role Management',
          path: '/admin/roles',
          icon: <ShieldAlert className="w-4 h-4" />,
          permission: PERMISSION_CODES.ROLE_VIEW,
        },
        {
          title: 'Permissions',
          path: '/admin/permissions',
          icon: <KeyRound className="w-4 h-4" />,
          permission: PERMISSION_CODES.PERMISSION_VIEW,
        },
        {
          title: 'Audit Logs',
          path: '/admin/audit-logs',
          icon: <History className="w-4 h-4" />,
          permission: PERMISSION_CODES.AUDIT_VIEW,
        },
      ],
    },
  ];

  const standardMenuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'CORE',
      items: [
        { title: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        {
          title: 'Tenant Management',
          path: '/admin/tenants',
          icon: <Building2 className="w-4 h-4" />,
          permission: PERMISSION_CODES.TENANT_VIEW,
        },
        {
          title: 'User Management',
          path: '/admin/users',
          icon: <Users className="w-4 h-4" />,
          permission: PERMISSION_CODES.USER_VIEW,
        },
        {
          title: 'Role Management',
          path: '/admin/roles',
          icon: <ShieldAlert className="w-4 h-4" />,
          permission: PERMISSION_CODES.ROLE_VIEW,
        },
        {
          title: 'Permissions',
          path: '/admin/permissions',
          icon: <KeyRound className="w-4 h-4" />,
          permission: PERMISSION_CODES.PERMISSION_VIEW,
        },
        {
          title: 'Audit Logs',
          path: '/admin/audit-logs',
          icon: <History className="w-4 h-4" />,
          permission: PERMISSION_CODES.AUDIT_VIEW,
        },
      ],
    },
    {
      title: 'MASTER DATA',
      items: [
        {
          title: 'Client Management',
          path: '/clients',
          icon: <Contact2 className="w-4 h-4" />,
          permission: PERMISSION_CODES.CLIENT_VIEW,
        },
        {
          title: 'Vendor Management',
          path: '/vendors',
          icon: <Briefcase className="w-4 h-4" />,
          permission: PERMISSION_CODES.VENDOR_VIEW,
        },
        {
          title: 'Item Master',
          path: '/items',
          icon: <Package className="w-4 h-4" />,
          permission: PERMISSION_CODES.ITEM_VIEW,
        },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        {
          title: 'Collection',
          path: '/collection',
          icon: <Layers className="w-4 h-4" />,
          permission: PERMISSION_CODES.REQUEST_CREATE,
        },
        {
          title: 'Calibration Requests',
          path: '/requests',
          icon: <ClipboardList className="w-4 h-4" />,
          permission: PERMISSION_CODES.REQUEST_VIEW,
        },
        {
          title: 'Lab Queue',
          path: '/lab/queue',
          icon: <FlaskConical className="w-4 h-4" />,
          permission: PERMISSION_CODES.VERIFICATION_VIEW,
        },
        {
          title: 'Calibration',
          path: '/calibration',
          icon: <FileCheck className="w-4 h-4" />,
          permission: PERMISSION_CODES.CALIBRATION_VIEW,
        },
        {
          title: 'Due List',
          path: '/calibration/due-list',
          icon: <CalendarClock className="w-4 h-4" />,
          permission: PERMISSION_CODES.CALIBRATION_VIEW,
        },
      ],
    },
    {
      title: 'COMMERCIAL',
      items: [
        {
          title: 'Quotations',
          path: '/commercial/quotations',
          icon: <Receipt className="w-4 h-4" />,
          permission: PERMISSION_CODES.QUOTATION_VIEW,
        },
        {
          title: 'Approvals',
          path: '/commercial/approvals',
          icon: <CheckCircle className="w-4 h-4" />,
          permission: PERMISSION_CODES.QUOTATION_APPROVE,
        },
        {
          title: 'Purchase Orders',
          path: '/commercial/purchase-orders',
          icon: <ShoppingBag className="w-4 h-4" />,
          permission: PERMISSION_CODES.PO_VIEW,
        },
        {
          title: 'Invoices',
          path: '/commercial/invoices',
          icon: <FileSpreadsheet className="w-4 h-4" />,
          permission: PERMISSION_CODES.INVOICE_VIEW,
        },
      ],
    },
    {
      title: 'EXECUTION',
      items: [
        {
          title: 'Signatures',
          path: '/signatures',
          icon: <FileSignature className="w-4 h-4" />,
          permission: PERMISSION_CODES.SIGNATURE_VIEW,
        },
        {
          title: 'Dispatch',
          path: '/dispatch',
          icon: <Send className="w-4 h-4" />,
          permission: PERMISSION_CODES.DISPATCH_VIEW,
        },
        {
          title: 'Deliveries',
          path: '/deliveries',
          icon: <Truck className="w-4 h-4" />,
          permission: PERMISSION_CODES.DELIVERY_VIEW,
        },
      ],
    },
  ];

  const menuSections = isSuperAdmin ? superAdminSections : standardMenuSections;

  return (
    <aside
      className={`h-screen bg-[#0B1120] text-slate-300 flex flex-col border-r border-slate-800/90 transition-all duration-300 select-none z-30 shrink-0 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-[#0B1120]/50 backdrop-blur-sm">
        {!collapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-sky-500/20 shrink-0">
              C
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-white tracking-tight leading-none">
                CCM PLATFORM
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider mt-1 uppercase">
                Enterprise Metrology
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm mx-auto shadow-sm shadow-sky-500/20">
            C
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition hidden lg:flex cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
        {menuSections.map((sec, idx) => {
          // Filter items based on permissions
          const visibleItems = sec.items.filter((item) => {
            if (!item.permission) return true;
            return hasPermission(item.permission);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              {!collapsed && (
                <div className="px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1.5">
                  {sec.title}
                </div>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-sky-500/15 via-sky-500/10 to-transparent text-sky-400 font-semibold border-l-2 border-sky-400 pl-2.5 shadow-2xs'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                      } ${collapsed ? 'justify-center px-0 border-l-0' : ''}`
                    }
                    title={collapsed ? item.title : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / User Profile */}
      {!collapsed && user && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold flex items-center justify-center text-xs shrink-0">
                {user.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'SA'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0B1120]" />
            </div>
            <div className="min-w-0">
              <div className="text-slate-200 font-semibold text-xs truncate">{user.fullName || 'Administrator'}</div>
              <div className="text-slate-500 text-[10px] truncate">{user.roleName || 'Super Admin'}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
