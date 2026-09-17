import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../context/PermissionContext';
import { AccessDeniedModal } from '../components/common/AccessDeniedModal';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Strict check: Only SUPER_ADMIN can access this portal
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/10">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="inline-block px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full text-xs font-mono font-semibold text-rose-400 mb-3 uppercase tracking-wider">
          Access Denied • 403 Forbidden
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Super Admin Portal Only</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          This portal link is strictly reserved for the <strong>Super Administrator</strong>.
          Your current account (<strong>{user?.email}</strong> • Role: <strong>{user?.roleName || user?.role}</strong>) does not have permission to access this portal.
        </p>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/20 transition cursor-pointer"
        >
          Sign Out & Switch to Super Admin
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export const PermissionRoute: React.FC<{
  permission: string;
  children: React.ReactNode;
}> = ({ permission, children }) => {
  const { hasPermission } = usePermission();
  const location = useLocation();
  const navigate = useNavigate();

  // If user does not have permission (including when route is typed directly in URL address bar),
  // display the Access Denied modal popup immediately
  if (!hasPermission(permission)) {
    return (
      <AccessDeniedModal
        isOpen={true}
        requiredPermission={permission}
        routePath={location.pathname}
        onClose={() => navigate('/admin/dashboard', { replace: true })}
      />
    );
  }

  return <>{children}</>;
};
