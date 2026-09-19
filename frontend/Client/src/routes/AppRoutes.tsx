import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PermissionRoute } from './RouteGuards';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { Forbidden403Page, NotFound404Page } from '../pages/error/ErrorPages';

// Admin Pages
import { SuperAdminDashboard } from '../pages/admin/SuperAdminDashboard';
import { TenantListPage, TenantDetailPage, AddTenantPage } from '../pages/admin/TenantManagementPages';
import {
  OrganizationListPage,
  OrganizationDetailPage,
  OrganizationOnboardingWizard,
} from '../pages/admin/OrganizationPages';
import {
  UserListPage,
  RoleListPage,
  RoleFormPage,
  PermissionListPage,
  AuditLogsPage,
  AddUserPage,
} from '../pages/admin/UserAndRolePages';

// Master Data
import { ClientListPage, ClientDetailPage, ClientOnboardingWizard } from '../pages/clients/ClientPages';
import { VendorListPage, VendorDetailPage, VendorOnboardingWizard, EditVendorPage } from '../pages/vendors/VendorPages';
import { ItemMasterListPage, AddItemPage } from '../pages/items/ItemMasterPages';

// Operations
import { CollectionPage } from '../pages/collection/CollectionPage';
import { RequestListPage, RequestDetailPage } from '../pages/requests/RequestPages';
import { LabQueuePage, ItemVerificationPage } from '../pages/lab/LabAndVerificationPages';
import { CalibrationQueuePage, CalibrationDueListPage, PerformCalibrationPage } from '../pages/calibration/CalibrationPages';

// Commercial
import { QuotationListPage, QuotationCreatePage } from '../pages/commercial/CommercialPages';
import { ApprovalQueuePage } from '../pages/commercial/CommercialPages';
import { InvoiceListPage, PurchaseOrderListPage, AddInvoicePage, AddPurchaseOrderPage } from '../pages/commercial/InvoicesAndPurchaseOrders';

// Execution
import {
  SignatureManagementPage,
  DispatchListPage,
  DeliveryListPage,
} from '../pages/execution/ExecutionPages';

import { PERMISSION_CODES } from '../constants/permissions';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes - Login is the first/entry page */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <LoginPage />}
      />

      {/* Protected Enterprise Dashboard Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Index redirects to /admin/dashboard */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />

        {/* Administration & Dashboards */}
        <Route path="admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="dashboard" element={<SuperAdminDashboard />} />

        {/* Tenants */}
        <Route
          path="admin/tenants"
          element={
            <PermissionRoute permission={PERMISSION_CODES.TENANT_VIEW}>
              <TenantListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="tenants"
          element={
            <PermissionRoute permission={PERMISSION_CODES.TENANT_VIEW}>
              <TenantListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/tenants/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.TENANT_CREATE}>
              <AddTenantPage />
            </PermissionRoute>
          }
        />
        <Route
          path="tenants/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.TENANT_CREATE}>
              <AddTenantPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/tenants/edit/:id"
          element={
            <PermissionRoute permission={PERMISSION_CODES.TENANT_UPDATE}>
              <AddTenantPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/tenants/:tenantId"
          element={
            <PermissionRoute permission={PERMISSION_CODES.TENANT_VIEW}>
              <TenantDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="tenants/:tenantId"
          element={
            <PermissionRoute permission={PERMISSION_CODES.TENANT_VIEW}>
              <TenantDetailPage />
            </PermissionRoute>
          }
        />

        {/* Organizations are managed strictly inside Tenants */}
        <Route path="admin/organizations" element={<Navigate to="/admin/tenants" replace />} />
        <Route path="organizations" element={<Navigate to="/admin/tenants" replace />} />
        <Route path="admin/organizations/*" element={<Navigate to="/admin/tenants" replace />} />
        <Route path="organizations/*" element={<Navigate to="/admin/tenants" replace />} />

        {/* Users */}
        <Route
          path="admin/users"
          element={
            <PermissionRoute permission={PERMISSION_CODES.USER_VIEW}>
              <UserListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="users"
          element={
            <PermissionRoute permission={PERMISSION_CODES.USER_VIEW}>
              <UserListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/users/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.USER_CREATE}>
              <AddUserPage />
            </PermissionRoute>
          }
        />
        <Route
          path="users/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.USER_CREATE}>
              <AddUserPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/users/edit/:id"
          element={
            <PermissionRoute permission={PERMISSION_CODES.USER_UPDATE}>
              <AddUserPage />
            </PermissionRoute>
          }
        />

        {/* Roles & Permissions */}
        <Route
          path="admin/roles"
          element={
            <PermissionRoute permission={PERMISSION_CODES.ROLE_VIEW}>
              <RoleListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="roles"
          element={
            <PermissionRoute permission={PERMISSION_CODES.ROLE_VIEW}>
              <RoleListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/roles/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.ROLE_CREATE}>
              <RoleFormPage />
            </PermissionRoute>
          }
        />
        <Route
          path="roles/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.ROLE_CREATE}>
              <RoleFormPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/roles/:id"
          element={
            <PermissionRoute permission={PERMISSION_CODES.ROLE_UPDATE}>
              <RoleFormPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/roles/:id/edit"
          element={
            <PermissionRoute permission={PERMISSION_CODES.ROLE_UPDATE}>
              <RoleFormPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/permissions"
          element={
            <PermissionRoute permission={PERMISSION_CODES.PERMISSION_VIEW}>
              <PermissionListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="permissions"
          element={
            <PermissionRoute permission={PERMISSION_CODES.PERMISSION_VIEW}>
              <PermissionListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="admin/audit-logs"
          element={
            <PermissionRoute permission={PERMISSION_CODES.AUDIT_VIEW}>
              <AuditLogsPage />
            </PermissionRoute>
          }
        />

        {/* Master Data */}
        <Route
          path="clients"
          element={
            <PermissionRoute permission={PERMISSION_CODES.CLIENT_VIEW}>
              <ClientListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="clients/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.CLIENT_CREATE}>
              <ClientOnboardingWizard />
            </PermissionRoute>
          }
        />
        <Route
          path="clients/:id"
          element={
            <PermissionRoute permission={PERMISSION_CODES.CLIENT_VIEW}>
              <ClientDetailPage />
            </PermissionRoute>
          }
        />

        <Route
          path="vendors"
          element={
            <PermissionRoute permission={PERMISSION_CODES.VENDOR_VIEW}>
              <VendorListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="vendors/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.VENDOR_CREATE}>
              <VendorOnboardingWizard />
            </PermissionRoute>
          }
        />
        <Route
          path="vendors/:id"
          element={
            <PermissionRoute permission={PERMISSION_CODES.VENDOR_VIEW}>
              <VendorDetailPage />
            </PermissionRoute>
          }
        />
        <Route
          path="vendors/edit/:id"
          element={
            <PermissionRoute permission={PERMISSION_CODES.VENDOR_UPDATE}>
              <EditVendorPage />
            </PermissionRoute>
          }
        />

        <Route
          path="items"
          element={
            <PermissionRoute permission={PERMISSION_CODES.ITEM_VIEW}>
              <ItemMasterListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="master/items"
          element={
            <PermissionRoute permission={PERMISSION_CODES.ITEM_VIEW}>
              <ItemMasterListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="items/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.ITEM_CREATE}>
              <AddItemPage />
            </PermissionRoute>
          }
        />
        <Route
          path="items/edit/:id"
          element={
            <PermissionRoute permission={PERMISSION_CODES.ITEM_UPDATE}>
              <AddItemPage />
            </PermissionRoute>
          }
        />

        {/* Operations */}
        <Route
          path="collection"
          element={
            <PermissionRoute permission={PERMISSION_CODES.REQUEST_CREATE}>
              <CollectionPage />
            </PermissionRoute>
          }
        />
        <Route
          path="requests"
          element={
            <PermissionRoute permission={PERMISSION_CODES.REQUEST_VIEW}>
              <RequestListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="requests/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.REQUEST_CREATE}>
              <CollectionPage />
            </PermissionRoute>
          }
        />
        <Route
          path="requests/:requestId"
          element={
            <PermissionRoute permission={PERMISSION_CODES.REQUEST_VIEW}>
              <RequestDetailPage />
            </PermissionRoute>
          }
        />

        <Route
          path="lab/queue"
          element={
            <PermissionRoute permission={PERMISSION_CODES.VERIFICATION_VIEW}>
              <LabQueuePage />
            </PermissionRoute>
          }
        />
        <Route
          path="verification/:requestId"
          element={
            <PermissionRoute permission={PERMISSION_CODES.VERIFICATION_VIEW}>
              <ItemVerificationPage />
            </PermissionRoute>
          }
        />

        <Route
          path="calibration"
          element={
            <PermissionRoute permission={PERMISSION_CODES.CALIBRATION_VIEW}>
              <CalibrationQueuePage />
            </PermissionRoute>
          }
        />
        <Route
          path="calibrations/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.CALIBRATION_CREATE}>
              <PerformCalibrationPage />
            </PermissionRoute>
          }
        />
        <Route
          path="calibration/due-list"
          element={
            <PermissionRoute permission={PERMISSION_CODES.CALIBRATION_VIEW}>
              <CalibrationDueListPage />
            </PermissionRoute>
          }
        />

        {/* Commercial */}
        <Route
          path="commercial/quotations"
          element={
            <PermissionRoute permission={PERMISSION_CODES.QUOTATION_VIEW}>
              <QuotationListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="commercial/quotations/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.QUOTATION_CREATE}>
              <QuotationCreatePage />
            </PermissionRoute>
          }
        />
        <Route
          path="commercial/quotations/:id"
          element={
            <PermissionRoute permission={PERMISSION_CODES.QUOTATION_VIEW}>
              <QuotationCreatePage />
            </PermissionRoute>
          }
        />

        <Route
          path="commercial/approvals"
          element={
            <PermissionRoute permission={PERMISSION_CODES.QUOTATION_APPROVE}>
              <ApprovalQueuePage />
            </PermissionRoute>
          }
        />

        <Route
          path="commercial/purchase-orders"
          element={
            <PermissionRoute permission={PERMISSION_CODES.PO_VIEW}>
              <PurchaseOrderListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="purchase-orders/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.PO_CREATE}>
              <AddPurchaseOrderPage />
            </PermissionRoute>
          }
        />

        <Route
          path="commercial/invoices"
          element={
            <PermissionRoute permission={PERMISSION_CODES.INVOICE_VIEW}>
              <InvoiceListPage />
            </PermissionRoute>
          }
        />
        <Route
          path="invoices/new"
          element={
            <PermissionRoute permission={PERMISSION_CODES.INVOICE_CREATE}>
              <AddInvoicePage />
            </PermissionRoute>
          }
        />

        {/* Execution */}
        <Route
          path="signatures"
          element={
            <PermissionRoute permission={PERMISSION_CODES.SIGNATURE_VIEW}>
              <SignatureManagementPage />
            </PermissionRoute>
          }
        />

        <Route
          path="dispatch"
          element={
            <PermissionRoute permission={PERMISSION_CODES.DISPATCH_VIEW}>
              <DispatchListPage />
            </PermissionRoute>
          }
        />

        <Route
          path="deliveries"
          element={
            <PermissionRoute permission={PERMISSION_CODES.DELIVERY_VIEW}>
              <DeliveryListPage />
            </PermissionRoute>
          }
        />

        {/* Guards & Errors */}
        <Route path="403" element={<Forbidden403Page />} />
        <Route path="*" element={<NotFound404Page />} />
      </Route>
    </Routes>
  );
};
