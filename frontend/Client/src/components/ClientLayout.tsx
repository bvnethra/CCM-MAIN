import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Award, Receipt, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ClientLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems = [
    { label: 'Overview', path: '/', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'LAB_TECHNICIAN', 'COLLECTION_AGENT', 'COMMERCIAL_MANAGER', 'QUALITY_APPROVER', 'CLIENT_ADMIN', 'CLIENT_USER', 'CLIENT_FINANCE'] },
    { label: 'My Requests', path: '/requests', icon: <FileText className="w-4 h-4" />, roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'LAB_TECHNICIAN', 'COLLECTION_AGENT', 'QUALITY_APPROVER', 'CLIENT_ADMIN', 'CLIENT_USER'] },
    { label: 'Certificates Vault', path: '/certificates', icon: <Award className="w-4 h-4" />, roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'LAB_TECHNICIAN', 'COLLECTION_AGENT', 'COMMERCIAL_MANAGER', 'QUALITY_APPROVER', 'CLIENT_ADMIN', 'CLIENT_USER', 'CLIENT_FINANCE'] },
    { label: 'Invoices & Billing', path: '/invoices', icon: <Receipt className="w-4 h-4" />, roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'COMMERCIAL_MANAGER', 'CLIENT_ADMIN', 'CLIENT_FINANCE'] },
  ];

  const navItems = allNavItems.filter((item) => !user?.role || item.roles.includes(user.role));

  const roleLabel = {
    SUPER_ADMIN: 'Super Administrator',
    SYSTEM_ADMIN: 'System Administrator',
    LAB_TECHNICIAN: 'Lab Technician',
    COLLECTION_AGENT: 'Collection Agent',
    COMMERCIAL_MANAGER: 'Commercial Manager',
    QUALITY_APPROVER: 'Quality Approver',
    CLIENT_ADMIN: 'Client Admin',
    CLIENT_USER: 'Plant Engineer',
    CLIENT_FINANCE: 'Finance Lead'
  }[user?.role || 'CLIENT_ADMIN'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center shadow-md shadow-indigo-600/20">
                C
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 leading-tight">CLIENT PORTAL</div>
                <div className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-1.5">
                  <span>{user?.companyName}</span>
                  <span className="inline-block px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-semibold rounded text-[9px]">
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-800">{user?.fullName}</div>
              <div className="text-[10px] text-slate-500 font-mono">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
