import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClientLayout } from './components/ClientLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RequestsPage } from './pages/RequestsPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { InvoicesPage } from './pages/InvoicesPage';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RoleGuard: React.FC<{ allowedRoles: string[]; children: React.ReactElement }> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (user && !allowedRoles.includes(user.role)) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto mt-12 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <span className="font-bold text-lg">!</span>
        </div>
        <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1">
          Your current profile (<strong>{user.role}</strong>) does not have access to view this section.
        </p>
      </div>
    );
  }
  return children;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route
              path="requests"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'SYSTEM_ADMIN', 'LAB_TECHNICIAN', 'COLLECTION_AGENT', 'QUALITY_APPROVER', 'CLIENT_ADMIN', 'CLIENT_USER']}>
                  <RequestsPage />
                </RoleGuard>
              }
            />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route
              path="invoices"
              element={
                <RoleGuard allowedRoles={['SUPER_ADMIN', 'SYSTEM_ADMIN', 'COMMERCIAL_MANAGER', 'CLIENT_ADMIN', 'CLIENT_FINANCE']}>
                  <InvoicesPage />
                </RoleGuard>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
