import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Building2,
  Building,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Shield,
  Layers,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../context/PermissionContext';
import { useNotification } from '../../context/NotificationContext';
import { mockStore } from '../../mock/initialStore';
import { UserRole } from '../../types/user';
import { PERMISSION_CODES } from '../../constants/permissions';
import { GlobalSearchModal } from '../modals/GlobalSearchModal';

export const Header: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotification();
  const navigate = useNavigate();

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs">
      {/* Left: Hamburger Button */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center/Right: Search, Quick Role Switcher, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Button */}
        <button
          type="button"
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 hover:border-slate-300 text-xs transition cursor-pointer shadow-2xs"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span className="hidden md:inline font-medium">Quick Search...</span>
          <kbd className="hidden md:inline text-[10px] bg-white border border-slate-200/80 rounded px-1.5 py-0.5 text-slate-500 font-mono shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Fixed Role Badge - Determined strictly by authenticated login */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50/80 border border-sky-200/70 text-sky-900 text-xs font-semibold select-none shadow-2xs">
          <Shield className="w-3.5 h-3.5 text-sky-600" />
          <span className="hidden lg:inline text-[10px] font-mono uppercase text-sky-600 font-bold tracking-wider">ROLE:</span>
          <span className="font-bold text-sky-950">{user?.roleName || user?.role || 'Role'}</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 relative transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-40 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] text-sky-600 hover:underline font-semibold cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.link) navigate(n.link);
                      setNotifOpen(false);
                    }}
                    className={`p-3 hover:bg-slate-50 transition cursor-pointer text-xs ${
                      !n.read ? 'bg-sky-50/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden xl:flex flex-col text-left pr-1">
              <span className="text-xs font-bold text-slate-800 leading-none">{user?.fullName}</span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">{user?.roleName}</span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-30 animate-fade-in text-xs">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <div className="font-bold text-slate-900 truncate">{user?.fullName}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </header>
  );
};
