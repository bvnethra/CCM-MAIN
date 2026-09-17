import { Tenant } from '../types/tenant';
import { Organization } from '../types/organization';
import { User } from '../types/user';
import { Role } from '../types/role';
import { Client } from '../types/client';
import { Vendor } from '../types/vendor';
import { Item } from '../types/item';
import { CalibrationRequest } from '../types/request';
import { Quotation } from '../types/quotation';
import { ApprovalRecord } from '../types/approval';
import { PurchaseOrder } from '../types/purchaseOrder';
import { Invoice } from '../types/invoice';
import { DigitalSignature, DispatchRecord, DeliveryRecord, AuditLogEntry } from '../types/dispatch';
import { DocumentRecord } from '../types/verification';
import { CalibrationDueItem } from '../types/calibration';
import { ALL_PERMISSION_CODES, DEFAULT_ROLE_PERMISSIONS } from '../constants/permissions';

export interface AppStore {
  tenants: Tenant[];
  organizations: Organization[];
  users: User[];
  roles: Role[];
  clients: Client[];
  vendors: Vendor[];
  items: Item[];
  requests: CalibrationRequest[];
  documents: DocumentRecord[];
  quotations: Quotation[];
  approvals: ApprovalRecord[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  signatures: DigitalSignature[];
  dispatches: DispatchRecord[];
  deliveries: DeliveryRecord[];
  auditLogs: AuditLogEntry[];
  dueList: CalibrationDueItem[];
}

export const initialTenants: Tenant[] = [
  {
    id: 'ten-1789623527736',
    name: '456',
    code: '456',
    tenantType: 'Enterprise',
    registrationNumber: 'uytfdsfghj',
    gstNumber: 'ZXCA5DQWERGBUKM',
    contactEmail: 'apex@gmail.com',
    contactPhone: '8574961235',
    addressLine1: 'kjhgfd, lijhgf, lkjhgv',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    timezone: 'Asia/Kolkata (IST)',
    currency: 'INR (₹)',
    numberOfBranches: 1,
    organizationsCount: 1,
    usersCount: 1,
    adminName: 'Apex',
    adminEmail: 'apex@gmail.com',
    adminDesignation: 'Super Administrator',
    status: 'ACTIVE',
    createdDate: '2026-09-17',
    updatedDate: '2026-09-17',
    description: 'Primary Calibration Laboratory Facility',
  },
  {
    id: 'ten-kjhgfd',
    name: 'kjhgfd',
    code: 'LKJHGFDSX',
    tenantType: 'Enterprise',
    registrationNumber: 'kjhgtcvghjkl',
    gstNumber: 'AMERFGUJKOPLMNB',
    contactEmail: 'apex@gmail.com',
    contactPhone: '8529637419',
    addressLine1: 'lkjhgfcvgbhnjmkl, hgfghj',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    timezone: 'Asia/Kolkata (IST)',
    currency: 'INR (₹)',
    numberOfBranches: 1,
    organizationsCount: 1,
    usersCount: 1,
    adminName: 'Apex Admin',
    adminEmail: 'apex@gmail.com',
    adminDesignation: 'Super Administrator',
    status: 'ACTIVE',
    createdDate: '2026-09-17',
    updatedDate: '2026-09-17',
  },
];

export const initialOrganizations: Organization[] = [
  {
    id: 'org-456-1',
    tenantId: 'ten-1789623527736',
    companyName: 'org 1',
    companyCode: '456-ORG',
    companyType: 'Private Limited',
    businessType: 'Calibration',
    registrationNumber: 'uytfdsfghj',
    gstNumber: 'ZXCA5DQWERGBUKM',
    companyEmail: 'apex@gmail.com',
    companyPhone: '8574961235',
    addressLine1: 'kjhgfd, lijhgf, lkjhgv',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    timezone: 'Asia/Kolkata (IST)',
    currency: 'INR (₹)',
    numberOfBranches: 1,
    numberOfWarehouses: 1,
    adminName: 'Apex',
    adminEmail: 'apex@gmail.com',
    adminDesignation: 'Laboratory Director',
    status: 'ACTIVE',
    createdDate: '2026-09-17',
    usersCount: 1,
  },
  {
    id: 'org-kjhgfd-1',
    tenantId: 'ten-kjhgfd',
    companyName: 'Test Organisation',
    companyCode: 'LKJ-ORG',
    companyType: 'Private Limited',
    businessType: 'Calibration',
    registrationNumber: 'kjhgtcvghjkl',
    gstNumber: 'AMERFGUJKOPLMNB',
    companyEmail: 'apex@gmail.com',
    companyPhone: '8529637419',
    addressLine1: 'lkjhgfcvgbhnjmkl, hgfghj',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    timezone: 'Asia/Kolkata (IST)',
    currency: 'INR (₹)',
    numberOfBranches: 1,
    numberOfWarehouses: 1,
    adminName: 'Apex Admin',
    adminEmail: 'apex@gmail.com',
    adminDesignation: 'Quality Head',
    status: 'ACTIVE',
    createdDate: '2026-09-17',
    usersCount: 1,
  },
];

export const initialRoles: Role[] = [
  {
    id: 'role-super-admin',
    name: 'Super Administrator',
    description: 'Complete unrestricted platform authority across multi-tenant calibration labs, commercial contracts, and security infrastructure.',
    status: 'ACTIVE',
    userCount: 1,
    permissions: [...ALL_PERMISSION_CODES],
    createdDate: '2026-09-01',
  },
  {
    id: 'role-tenant-admin',
    name: 'Tenant Administrator',
    description: 'Enterprise tenant management, lab facility oversight, organization branch provisioning, and staff access controls.',
    status: 'ACTIVE',
    userCount: 1,
    permissions: [...DEFAULT_ROLE_PERMISSIONS.ADMIN],
    createdDate: '2026-09-01',
  },
  {
    id: 'role-lab-user',
    name: 'Calibration Lab Engineer',
    description: 'Execution of metrological tests, measurement readings, uncertainty budgets, calibration certificates, and standards traceability.',
    status: 'ACTIVE',
    userCount: 1,
    permissions: [...DEFAULT_ROLE_PERMISSIONS.LAB_USER],
    createdDate: '2026-09-01',
  },
  {
    id: 'role-commercial-user',
    name: 'Commercial Manager',
    description: 'Management of commercial proposals, client rate sheets, quotations, purchase order matching, customer billing, and invoices.',
    status: 'ACTIVE',
    userCount: 1,
    permissions: [...DEFAULT_ROLE_PERMISSIONS.COMMERCIAL_USER],
    createdDate: '2026-09-01',
  },
  {
    id: 'role-approver',
    name: 'Quality Approver / Lab Director',
    description: 'Quality assurance validation, ISO 17025 compliance sign-off, quotation margin approvals, and digital certificate release.',
    status: 'ACTIVE',
    userCount: 1,
    permissions: [...DEFAULT_ROLE_PERMISSIONS.APPROVER],
    createdDate: '2026-09-01',
  },
  {
    id: 'role-collection-agent',
    name: 'Field Collection Agent',
    description: 'Instrument pickup logistics, on-site intake documentation, physical condition verification, and transport gate-passes.',
    status: 'ACTIVE',
    userCount: 1,
    permissions: [...DEFAULT_ROLE_PERMISSIONS.COLLECTION_AGENT],
    createdDate: '2026-09-01',
  },
  {
    id: 'role-dispatch-user',
    name: 'Dispatch & Logistics Officer',
    description: 'Post-calibration packaging, courier handover, delivery receipt generation, gate pass signing, and customer acknowledgments.',
    status: 'ACTIVE',
    userCount: 1,
    permissions: [...DEFAULT_ROLE_PERMISSIONS.DISPATCH_USER],
    createdDate: '2026-09-01',
  },
];

export const initialUsers: User[] = [
  {
    id: 'usr-1',
    fullName: 'Apex Super Admin',
    email: 'apex.superadmin@ccm.com',
    phone: '+91 85749 61235',
    tenantId: 'ten-1789623527736',
    tenantName: '456',
    organizationId: 'org-456-1',
    organizationName: '456 - Head Lab',
    roleId: 'role-super-admin',
    role: 'SUPER_ADMIN',
    roleName: 'Super Administrator',
    status: 'ACTIVE',
    createdAt: '2026-09-01',
    lastLogin: 'Today, 11:42 AM',
  },
  {
    id: 'usr-2',
    fullName: 'Apex Administrator',
    email: 'apex@gmail.com',
    phone: '+91 85749 61235',
    tenantId: 'ten-1789623527736',
    tenantName: '456',
    organizationId: 'org-456-1',
    organizationName: '456 - Head Lab',
    roleId: 'role-tenant-admin',
    role: 'ADMIN',
    roleName: 'Tenant Administrator',
    status: 'ACTIVE',
    createdAt: '2026-09-17',
    lastLogin: 'Today, 10:15 AM',
  },
  {
    id: 'usr-3',
    fullName: 'Apex Quality Head',
    email: 'apex.quality@gmail.com',
    phone: '+91 85296 37419',
    tenantId: 'ten-kjhgfd',
    tenantName: 'kjhgfd',
    organizationId: 'org-kjhgfd-1',
    organizationName: 'Test Organisation',
    roleId: 'role-approver',
    role: 'APPROVER',
    roleName: 'Quality Approver / Lab Director',
    status: 'ACTIVE',
    createdAt: '2026-09-17',
    lastLogin: 'Yesterday',
  },
  {
    id: 'usr-4',
    fullName: 'Rajesh Sharma',
    email: 'rajesh.commercial@apexmetrology.com',
    phone: '+91 98451 23456',
    tenantId: 'ten-1789623527736',
    tenantName: '456',
    organizationId: 'org-456-1',
    organizationName: '456 - Head Lab',
    roleId: 'role-commercial-user',
    role: 'COMMERCIAL_USER',
    roleName: 'Commercial Manager',
    status: 'ACTIVE',
    createdAt: '2026-09-05',
    lastLogin: '2 days ago',
  },
  {
    id: 'usr-5',
    fullName: 'Dr. Priya Nambiar',
    email: 'priya.lab@apexmetrology.com',
    phone: '+91 97312 34567',
    tenantId: 'ten-1789623527736',
    tenantName: '456',
    organizationId: 'org-456-1',
    organizationName: '456 - Head Lab',
    roleId: 'role-lab-user',
    role: 'LAB_USER',
    roleName: 'Calibration Lab Engineer',
    status: 'ACTIVE',
    createdAt: '2026-09-08',
    lastLogin: 'Today, 09:30 AM',
  },
  {
    id: 'usr-6',
    fullName: 'Suresh Kumar',
    email: 'suresh.field@apexmetrology.com',
    phone: '+91 98840 12345',
    tenantId: 'ten-1789623527736',
    tenantName: '456',
    organizationId: 'org-456-1',
    organizationName: '456 - Head Lab',
    roleId: 'role-collection-agent',
    role: 'COLLECTION_AGENT',
    roleName: 'Field Collection Agent',
    status: 'ACTIVE',
    createdAt: '2026-09-10',
    lastLogin: 'Yesterday',
  },
  {
    id: 'usr-7',
    fullName: 'Karthik Raja',
    email: 'karthik.dispatch@apexmetrology.com',
    phone: '+91 94441 98765',
    tenantId: 'ten-1789623527736',
    tenantName: '456',
    organizationId: 'org-456-1',
    organizationName: '456 - Head Lab',
    roleId: 'role-dispatch-user',
    role: 'DISPATCH_USER',
    roleName: 'Dispatch & Logistics Officer',
    status: 'ACTIVE',
    createdAt: '2026-09-12',
    lastLogin: '3 days ago',
  },
];

export const initialClients: Client[] = [];
export const initialVendors: Vendor[] = [];
export const initialItems: Item[] = [];
export const initialRequests: CalibrationRequest[] = [];
export const initialDocuments: DocumentRecord[] = [];
export const initialQuotations: Quotation[] = [];
export const initialApprovals: ApprovalRecord[] = [];
export const initialPurchaseOrders: PurchaseOrder[] = [];
export const initialInvoices: Invoice[] = [];
export const initialSignatures: DigitalSignature[] = [];
export const initialDispatches: DispatchRecord[] = [];
export const initialDeliveries: DeliveryRecord[] = [];
export const initialAuditLogs: AuditLogEntry[] = [];
export const initialDueList: CalibrationDueItem[] = [];

const STORAGE_KEY = 'ccm_mock_data_store_v1';

function loadStoredData(): Partial<AppStore> | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error loading persistent store:', err);
  }
  return null;
}

function saveStoredData(data: AppStore) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (err) {
    console.warn('Error saving persistent store:', err);
  }
}

// Persistent store that saves to localStorage
class MockDataStore {
  private store: AppStore;

  constructor() {
    const stored = loadStoredData();
    // Merge stored data with initial seeded tenants so user onboarded data is never lost
    const storedTenants = stored?.tenants || [];
    const mergedTenants = [...storedTenants];
    initialTenants.forEach((initT) => {
      if (!mergedTenants.some((t) => t.id === initT.id || t.code === initT.code)) {
        mergedTenants.push(initT);
      }
    });

    const storedOrgs = stored?.organizations || [];
    const mergedOrgs = [...storedOrgs];
    initialOrganizations.forEach((initO) => {
      if (!mergedOrgs.some((o) => o.id === initO.id || o.companyCode === initO.companyCode)) {
        mergedOrgs.push(initO);
      }
    });

    // Ensure roles are never empty: merge stored roles with initial seeded roles
    const storedRoles = (stored?.roles && stored.roles.length > 0) ? stored.roles : [];
    const mergedRoles = [...storedRoles];
    initialRoles.forEach((initR) => {
      const idx = mergedRoles.findIndex((r) => r.id === initR.id || r.name.toLowerCase() === initR.name.toLowerCase());
      if (idx === -1) {
        mergedRoles.push(initR);
      } else {
        // Synchronize canonical permissions
        mergedRoles[idx].permissions = initR.permissions;
      }
    });

    // Ensure users are never empty: merge stored users with initial seeded users
    const storedUsers = (stored?.users && stored.users.length > 0) ? stored.users : [];
    const mergedUsers = [...storedUsers];
    initialUsers.forEach((initU) => {
      if (!mergedUsers.some((u) => u.id === initU.id || u.email.toLowerCase() === initU.email.toLowerCase())) {
        mergedUsers.push(initU);
      }
    });

    // Synchronize role user counts based on active user assignments
    mergedRoles.forEach((r) => {
      r.userCount = mergedUsers.filter((u) => u.roleId === r.id || u.roleName.toLowerCase() === r.name.toLowerCase()).length;
    });

    this.store = {
      tenants: mergedTenants,
      organizations: mergedOrgs,
      users: mergedUsers,
      roles: mergedRoles,
      clients: stored?.clients || [...initialClients],
      vendors: stored?.vendors || [...initialVendors],
      items: stored?.items || [...initialItems],
      requests: stored?.requests || [...initialRequests],
      documents: stored?.documents || [...initialDocuments],
      quotations: stored?.quotations || [...initialQuotations],
      approvals: stored?.approvals || [...initialApprovals],
      purchaseOrders: stored?.purchaseOrders || [...initialPurchaseOrders],
      invoices: stored?.invoices || [...initialInvoices],
      signatures: stored?.signatures || [...initialSignatures],
      dispatches: stored?.dispatches || [...initialDispatches],
      deliveries: stored?.deliveries || [...initialDeliveries],
      auditLogs: stored?.auditLogs || [...initialAuditLogs],
      dueList: stored?.dueList || [...initialDueList],
    };

    this.save();
  }

  save() {
    saveStoredData(this.store);
  }

  get data(): AppStore {
    return this.store;
  }

  set data(newData: AppStore) {
    this.store = newData;
    this.save();
  }
}

export const mockStore = new MockDataStore();

// Auto-sync interval to ensure any array unshift/push operations are permanently saved
if (typeof window !== 'undefined') {
  setInterval(() => {
    mockStore.save();
  }, 1000);
}
