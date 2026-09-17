export const PERMISSION_CODES = {
  // Tenant
  TENANT_VIEW: 'tenant.view',
  TENANT_CREATE: 'tenant.create',
  TENANT_UPDATE: 'tenant.update',
  TENANT_DELETE: 'tenant.delete',

  // Organization
  ORGANIZATION_VIEW: 'organization.view',
  ORGANIZATION_CREATE: 'organization.create',
  ORGANIZATION_UPDATE: 'organization.update',
  ORGANIZATION_DELETE: 'organization.delete',

  // User
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',

  // Role
  ROLE_VIEW: 'role.view',
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',

  // Permission
  PERMISSION_VIEW: 'permission.view',

  // Client
  CLIENT_VIEW: 'client.view',
  CLIENT_CREATE: 'client.create',
  CLIENT_UPDATE: 'client.update',
  CLIENT_DELETE: 'client.delete',

  // Vendor
  VENDOR_VIEW: 'vendor.view',
  VENDOR_CREATE: 'vendor.create',
  VENDOR_UPDATE: 'vendor.update',
  VENDOR_DELETE: 'vendor.delete',

  // Item
  ITEM_VIEW: 'item.view',
  ITEM_CREATE: 'item.create',
  ITEM_UPDATE: 'item.update',
  ITEM_DELETE: 'item.delete',

  // Request & Collection
  REQUEST_VIEW: 'request.view',
  REQUEST_CREATE: 'request.create',
  REQUEST_UPDATE: 'request.update',
  REQUEST_SUBMIT: 'request.submit',
  REQUEST_DELETE: 'request.delete',

  // Verification
  VERIFICATION_VIEW: 'verification.view',
  VERIFICATION_CREATE: 'verification.create',
  VERIFICATION_UPDATE: 'verification.update',

  // Calibration & Certificate
  CALIBRATION_VIEW: 'calibration.view',
  CALIBRATION_CREATE: 'calibration.create',
  CALIBRATION_UPDATE: 'calibration.update',

  // Quotation
  QUOTATION_VIEW: 'quotation.view',
  QUOTATION_CREATE: 'quotation.create',
  QUOTATION_UPDATE: 'quotation.update',
  QUOTATION_APPROVE: 'quotation.approve',

  // Purchase Order
  PO_VIEW: 'purchase_order.view',
  PO_CREATE: 'purchase_order.create',
  PO_UPDATE: 'purchase_order.update',

  // Invoice
  INVOICE_VIEW: 'invoice.view',
  INVOICE_CREATE: 'invoice.create',
  INVOICE_UPDATE: 'invoice.update',

  // Signature
  SIGNATURE_VIEW: 'signature.view',
  SIGNATURE_CREATE: 'signature.create',

  // Dispatch & Delivery
  DISPATCH_VIEW: 'dispatch.view',
  DISPATCH_CREATE: 'dispatch.create',
  DELIVERY_VIEW: 'delivery.view',
  DELIVERY_UPDATE: 'delivery.update',

  // Audit
  AUDIT_VIEW: 'audit.view',
} as const;

export const MODULES_PERMISSIONS = [
  {
    id: 'tenants',
    name: 'Tenants Management',
    permissions: [
      { code: PERMISSION_CODES.TENANT_VIEW, label: 'View Tenants', action: 'view' },
      { code: PERMISSION_CODES.TENANT_CREATE, label: 'Create Tenants', action: 'create' },
      { code: PERMISSION_CODES.TENANT_UPDATE, label: 'Edit Tenants', action: 'edit' },
      { code: PERMISSION_CODES.TENANT_DELETE, label: 'Delete Tenants', action: 'delete' },
    ],
  },
  {
    id: 'organizations',
    name: 'Organizations',
    permissions: [
      { code: PERMISSION_CODES.ORGANIZATION_VIEW, label: 'View Organizations', action: 'view' },
      { code: PERMISSION_CODES.ORGANIZATION_CREATE, label: 'Create Organizations', action: 'create' },
      { code: PERMISSION_CODES.ORGANIZATION_UPDATE, label: 'Edit Organizations', action: 'edit' },
      { code: PERMISSION_CODES.ORGANIZATION_DELETE, label: 'Delete Organizations', action: 'delete' },
    ],
  },
  {
    id: 'users',
    name: 'User Accounts',
    permissions: [
      { code: PERMISSION_CODES.USER_VIEW, label: 'View Users', action: 'view' },
      { code: PERMISSION_CODES.USER_CREATE, label: 'Create Users', action: 'create' },
      { code: PERMISSION_CODES.USER_UPDATE, label: 'Edit Users', action: 'edit' },
      { code: PERMISSION_CODES.USER_DELETE, label: 'Delete Users', action: 'delete' },
    ],
  },
  {
    id: 'roles',
    name: 'Roles & Permissions',
    permissions: [
      { code: PERMISSION_CODES.ROLE_VIEW, label: 'View Roles', action: 'view' },
      { code: PERMISSION_CODES.ROLE_CREATE, label: 'Create Roles', action: 'create' },
      { code: PERMISSION_CODES.ROLE_UPDATE, label: 'Edit Roles', action: 'edit' },
      { code: PERMISSION_CODES.ROLE_DELETE, label: 'Delete Roles', action: 'delete' },
      { code: PERMISSION_CODES.PERMISSION_VIEW, label: 'View Permissions Directory', action: 'view' },
    ],
  },
  {
    id: 'clients',
    name: 'Clients & Customers',
    permissions: [
      { code: PERMISSION_CODES.CLIENT_VIEW, label: 'View Clients', action: 'view' },
      { code: PERMISSION_CODES.CLIENT_CREATE, label: 'Create Clients', action: 'create' },
      { code: PERMISSION_CODES.CLIENT_UPDATE, label: 'Edit Clients', action: 'edit' },
      { code: PERMISSION_CODES.CLIENT_DELETE, label: 'Delete Clients', action: 'delete' },
    ],
  },
  {
    id: 'vendors',
    name: 'Vendors & Suppliers',
    permissions: [
      { code: PERMISSION_CODES.VENDOR_VIEW, label: 'View Vendors', action: 'view' },
      { code: PERMISSION_CODES.VENDOR_CREATE, label: 'Create Vendors', action: 'create' },
      { code: PERMISSION_CODES.VENDOR_UPDATE, label: 'Edit Vendors', action: 'edit' },
      { code: PERMISSION_CODES.VENDOR_DELETE, label: 'Delete Vendors', action: 'delete' },
    ],
  },
  {
    id: 'items',
    name: 'Items & Gauges Master',
    permissions: [
      { code: PERMISSION_CODES.ITEM_VIEW, label: 'View Items', action: 'view' },
      { code: PERMISSION_CODES.ITEM_CREATE, label: 'Create Items', action: 'create' },
      { code: PERMISSION_CODES.ITEM_UPDATE, label: 'Edit Items', action: 'edit' },
      { code: PERMISSION_CODES.ITEM_DELETE, label: 'Delete Items', action: 'delete' },
    ],
  },
  {
    id: 'requests',
    name: 'Calibration Requests',
    permissions: [
      { code: PERMISSION_CODES.REQUEST_VIEW, label: 'View Requests', action: 'view' },
      { code: PERMISSION_CODES.REQUEST_CREATE, label: 'Create Requests', action: 'create' },
      { code: PERMISSION_CODES.REQUEST_UPDATE, label: 'Edit Requests', action: 'edit' },
      { code: PERMISSION_CODES.REQUEST_SUBMIT, label: 'Submit Requests', action: 'submit' },
      { code: PERMISSION_CODES.REQUEST_DELETE, label: 'Delete Requests', action: 'delete' },
    ],
  },
  {
    id: 'verification',
    name: 'Lab Verification',
    permissions: [
      { code: PERMISSION_CODES.VERIFICATION_VIEW, label: 'View Verification Reports', action: 'view' },
      { code: PERMISSION_CODES.VERIFICATION_CREATE, label: 'Create Verification', action: 'create' },
      { code: PERMISSION_CODES.VERIFICATION_UPDATE, label: 'Edit Verification', action: 'edit' },
    ],
  },
  {
    id: 'calibration',
    name: 'Calibration & Certificates',
    permissions: [
      { code: PERMISSION_CODES.CALIBRATION_VIEW, label: 'View Calibrations', action: 'view' },
      { code: PERMISSION_CODES.CALIBRATION_CREATE, label: 'Perform Calibration', action: 'create' },
      { code: PERMISSION_CODES.CALIBRATION_UPDATE, label: 'Update Calibration Certificates', action: 'edit' },
    ],
  },
  {
    id: 'quotations',
    name: 'Commercial Quotations',
    permissions: [
      { code: PERMISSION_CODES.QUOTATION_VIEW, label: 'View Quotations', action: 'view' },
      { code: PERMISSION_CODES.QUOTATION_CREATE, label: 'Create Quotations', action: 'create' },
      { code: PERMISSION_CODES.QUOTATION_UPDATE, label: 'Edit Quotations', action: 'edit' },
      { code: PERMISSION_CODES.QUOTATION_APPROVE, label: 'Approve Quotations', action: 'approve' },
    ],
  },
  {
    id: 'purchaseOrders',
    name: 'Purchase Orders',
    permissions: [
      { code: PERMISSION_CODES.PO_VIEW, label: 'View Purchase Orders', action: 'view' },
      { code: PERMISSION_CODES.PO_CREATE, label: 'Create Purchase Orders', action: 'create' },
      { code: PERMISSION_CODES.PO_UPDATE, label: 'Edit Purchase Orders', action: 'edit' },
    ],
  },
  {
    id: 'invoices',
    name: 'Invoices & Billing',
    permissions: [
      { code: PERMISSION_CODES.INVOICE_VIEW, label: 'View Invoices', action: 'view' },
      { code: PERMISSION_CODES.INVOICE_CREATE, label: 'Generate Invoices', action: 'create' },
      { code: PERMISSION_CODES.INVOICE_UPDATE, label: 'Edit Invoices', action: 'edit' },
    ],
  },
  {
    id: 'signatures',
    name: 'Digital Signatures',
    permissions: [
      { code: PERMISSION_CODES.SIGNATURE_VIEW, label: 'View Signatures', action: 'view' },
      { code: PERMISSION_CODES.SIGNATURE_CREATE, label: 'Sign Documents', action: 'create' },
    ],
  },
  {
    id: 'dispatch',
    name: 'Dispatch & Deliveries',
    permissions: [
      { code: PERMISSION_CODES.DISPATCH_VIEW, label: 'View Dispatches', action: 'view' },
      { code: PERMISSION_CODES.DISPATCH_CREATE, label: 'Create Gate Passes', action: 'create' },
      { code: PERMISSION_CODES.DELIVERY_VIEW, label: 'View Deliveries', action: 'view' },
      { code: PERMISSION_CODES.DELIVERY_UPDATE, label: 'Update Delivery Status', action: 'edit' },
    ],
  },
  {
    id: 'auditLogs',
    name: 'System Audit Logs',
    permissions: [
      { code: PERMISSION_CODES.AUDIT_VIEW, label: 'View Audit Logs', action: 'view' },
    ],
  },
] as const;

export const ALL_PERMISSION_CODES: string[] = MODULES_PERMISSIONS.flatMap((m) =>
  m.permissions.map((p) => p.code)
);

export const MODULES_METADATA = MODULES_PERMISSIONS.map((m) => ({
  id: m.id,
  name: m.name,
  actions: m.permissions.map((p) => p.action),
}));

// Default permissions assigned to each role for mock demo
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [...ALL_PERMISSION_CODES],
  ADMIN: [
    PERMISSION_CODES.ORGANIZATION_VIEW,
    PERMISSION_CODES.ORGANIZATION_CREATE,
    PERMISSION_CODES.ORGANIZATION_UPDATE,
    PERMISSION_CODES.USER_VIEW,
    PERMISSION_CODES.USER_CREATE,
    PERMISSION_CODES.USER_UPDATE,
    PERMISSION_CODES.ROLE_VIEW,
    PERMISSION_CODES.PERMISSION_VIEW,
    PERMISSION_CODES.CLIENT_VIEW,
    PERMISSION_CODES.CLIENT_CREATE,
    PERMISSION_CODES.CLIENT_UPDATE,
    PERMISSION_CODES.VENDOR_VIEW,
    PERMISSION_CODES.VENDOR_CREATE,
    PERMISSION_CODES.VENDOR_UPDATE,
    PERMISSION_CODES.ITEM_VIEW,
    PERMISSION_CODES.ITEM_CREATE,
    PERMISSION_CODES.ITEM_UPDATE,
    PERMISSION_CODES.REQUEST_VIEW,
    PERMISSION_CODES.REQUEST_CREATE,
    PERMISSION_CODES.REQUEST_UPDATE,
    PERMISSION_CODES.REQUEST_SUBMIT,
    PERMISSION_CODES.VERIFICATION_VIEW,
    PERMISSION_CODES.VERIFICATION_CREATE,
    PERMISSION_CODES.CALIBRATION_VIEW,
    PERMISSION_CODES.CALIBRATION_CREATE,
    PERMISSION_CODES.QUOTATION_VIEW,
    PERMISSION_CODES.QUOTATION_CREATE,
    PERMISSION_CODES.QUOTATION_UPDATE,
    PERMISSION_CODES.PO_VIEW,
    PERMISSION_CODES.PO_CREATE,
    PERMISSION_CODES.INVOICE_VIEW,
    PERMISSION_CODES.INVOICE_CREATE,
    PERMISSION_CODES.SIGNATURE_VIEW,
    PERMISSION_CODES.SIGNATURE_CREATE,
    PERMISSION_CODES.DISPATCH_VIEW,
    PERMISSION_CODES.DISPATCH_CREATE,
    PERMISSION_CODES.DELIVERY_VIEW,
    PERMISSION_CODES.DELIVERY_UPDATE,
    PERMISSION_CODES.AUDIT_VIEW,
  ],
  COLLECTION_AGENT: [
    PERMISSION_CODES.CLIENT_VIEW,
    PERMISSION_CODES.ITEM_VIEW,
    PERMISSION_CODES.ITEM_CREATE,
    PERMISSION_CODES.REQUEST_VIEW,
    PERMISSION_CODES.REQUEST_CREATE,
    PERMISSION_CODES.REQUEST_SUBMIT,
    PERMISSION_CODES.DISPATCH_VIEW,
    PERMISSION_CODES.DELIVERY_VIEW,
  ],
  LAB_USER: [
    PERMISSION_CODES.ITEM_VIEW,
    PERMISSION_CODES.ITEM_CREATE,
    PERMISSION_CODES.ITEM_UPDATE,
    PERMISSION_CODES.REQUEST_VIEW,
    PERMISSION_CODES.REQUEST_UPDATE,
    PERMISSION_CODES.REQUEST_SUBMIT,
    PERMISSION_CODES.VERIFICATION_VIEW,
    PERMISSION_CODES.VERIFICATION_CREATE,
    PERMISSION_CODES.VERIFICATION_UPDATE,
    PERMISSION_CODES.CALIBRATION_VIEW,
    PERMISSION_CODES.CALIBRATION_CREATE,
    PERMISSION_CODES.CALIBRATION_UPDATE,
    PERMISSION_CODES.SIGNATURE_CREATE,
  ],
  COMMERCIAL_USER: [
    PERMISSION_CODES.CLIENT_VIEW,
    PERMISSION_CODES.CLIENT_CREATE,
    PERMISSION_CODES.CLIENT_UPDATE,
    PERMISSION_CODES.CLIENT_DELETE,
    PERMISSION_CODES.VENDOR_VIEW,
    PERMISSION_CODES.VENDOR_CREATE,
    PERMISSION_CODES.VENDOR_UPDATE,
    PERMISSION_CODES.VENDOR_DELETE,
    PERMISSION_CODES.ITEM_VIEW,
    PERMISSION_CODES.REQUEST_VIEW,
    PERMISSION_CODES.REQUEST_CREATE,
    PERMISSION_CODES.QUOTATION_VIEW,
    PERMISSION_CODES.QUOTATION_CREATE,
    PERMISSION_CODES.QUOTATION_UPDATE,
    PERMISSION_CODES.QUOTATION_APPROVE,
    PERMISSION_CODES.PO_VIEW,
    PERMISSION_CODES.PO_CREATE,
    PERMISSION_CODES.PO_UPDATE,
    PERMISSION_CODES.INVOICE_VIEW,
    PERMISSION_CODES.INVOICE_CREATE,
    PERMISSION_CODES.INVOICE_UPDATE,
    PERMISSION_CODES.DISPATCH_VIEW,
  ],
  APPROVER: [
    PERMISSION_CODES.REQUEST_VIEW,
    PERMISSION_CODES.VERIFICATION_VIEW,
    PERMISSION_CODES.VERIFICATION_UPDATE,
    PERMISSION_CODES.CALIBRATION_VIEW,
    PERMISSION_CODES.CALIBRATION_UPDATE,
    PERMISSION_CODES.QUOTATION_VIEW,
    PERMISSION_CODES.QUOTATION_APPROVE,
    PERMISSION_CODES.SIGNATURE_VIEW,
    PERMISSION_CODES.SIGNATURE_CREATE,
    PERMISSION_CODES.AUDIT_VIEW,
  ],
  DISPATCH_USER: [
    PERMISSION_CODES.REQUEST_VIEW,
    PERMISSION_CODES.DISPATCH_VIEW,
    PERMISSION_CODES.DISPATCH_CREATE,
    PERMISSION_CODES.DELIVERY_VIEW,
    PERMISSION_CODES.DELIVERY_UPDATE,
    PERMISSION_CODES.SIGNATURE_VIEW,
    PERMISSION_CODES.SIGNATURE_CREATE,
  ],
};
