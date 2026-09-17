import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../context/PermissionContext';
import { AccessDeniedModal } from '../components/common/AccessDeniedModal';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
