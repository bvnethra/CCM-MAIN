import { User, UserRole } from '../types/user';
import { createJwtForRole } from '../lib/auth/demoTokens';

export interface LoginResponse {
  token: string;
  user: User;
  tenantId: string;
  organizationId: string;
}

const SYSTEM_ACCOUNTS: Record<string, { fullName: string; role: UserRole; roleName: string }> = {
  'apex.superadmin@ccm.com': {
    fullName: 'Apex Super Admin',
    role: 'SUPER_ADMIN',
    roleName: 'Super Administrator'
  },
  'admin@apexmetrology.com': {
    fullName: 'Apex Super Admin',
    role: 'SUPER_ADMIN',
    roleName: 'Super Administrator'
  },
  'apex@gmail.com': {
    fullName: 'Apex Administrator',
    role: 'ADMIN',
    roleName: 'Tenant Administrator'
  },
  'bvnethra2005@gmail.com': {
    fullName: 'Nethra BV (Admin)',
    role: 'ADMIN',
    roleName: 'System Administrator'
  },
  'apex.quality@gmail.com': {
    fullName: 'Apex Quality Head',
    role: 'APPROVER',
    roleName: 'Quality Approver / Lab Director'
  },
  'vikram.m@apexmetrology.com': {
    fullName: 'Dr. Vikram M (Approver)',
    role: 'APPROVER',
    roleName: 'Quality Approver'
  },
  'rajesh.commercial@apexmetrology.com': {
    fullName: 'Rajesh Sharma',
    role: 'COMMERCIAL_USER',
    roleName: 'Commercial Manager'
  },
  'amit.v@apexmetrology.com': {
    fullName: 'Amit V (Commercial User)',
    role: 'COMMERCIAL_USER',
    roleName: 'Commercial Manager'
  },
  'priya.lab@apexmetrology.com': {
    fullName: 'Dr. Priya Nambiar',
    role: 'LAB_USER',
    roleName: 'Calibration Lab Engineer'
  },
  'priya.s@apexmetrology.com': {
    fullName: 'Priya S (Lab Tech)',
    role: 'LAB_USER',
    roleName: 'Calibration Engineer'
  },
  'suresh.field@apexmetrology.com': {
    fullName: 'Suresh Kumar',
    role: 'COLLECTION_AGENT',
    roleName: 'Field Collection Agent'
  },
  'rajesh.k@apexmetrology.com': {
    fullName: 'Rajesh K (Collection Agent)',
    role: 'COLLECTION_AGENT',
    roleName: 'Field Collection Agent'
  },
  'karthik.dispatch@apexmetrology.com': {
    fullName: 'Karthik Raja',
    role: 'DISPATCH_USER',
    roleName: 'Dispatch & Logistics Officer'
  }
};

export function createUserForEmail(email: string): User {
  const normalized = email.trim().toLowerCase();
  const known = SYSTEM_ACCOUNTS[normalized];

  const role: UserRole = known ? known.role : 'ADMIN';
  const roleName = known ? known.roleName : 'Administrator';
  const fullName = known ? known.fullName : (email.split('@')[0].toUpperCase() + ' User');

  return {
    id: '00000000-0000-0000-0000-000000000001',
    fullName,
    email: normalized,
    phone: '+91 9876543210',
    tenantId: '00000000-0000-0000-0000-000000000001',
    tenantName: 'Apex Metrology Group',
    organizationId: '00000000-0000-0000-0000-000000000001',
    organizationName: 'Apex Precision Labs Bangalore',
    roleId: '00000000-0000-0000-0000-000000000001',
    role,
    roleName,
    status: 'ACTIVE',
    createdAt: new Date().toISOString().split('T')[0]
  };
}

export const authService = {
  async login(email: string, password?: string): Promise<LoginResponse> {
    await new Promise((res) => setTimeout(res, 200));
    
    if (!email || !email.trim()) {
      throw new Error('Please enter a valid work email address');
    }

    if (!password || !password.trim()) {
      throw new Error('Please enter your account password');
    }

    if (password.trim() !== 'Password@123') {
      throw new Error('Incorrect password. Please enter Password@123');
    }

    const normalized = email.trim().toLowerCase();
    const known = SYSTEM_ACCOUNTS[normalized];
    if (!known) {
      throw new Error('Account not recognized. Please use a registered corporate email.');
    }

    const user = createUserForEmail(email);
    const token = await createJwtForRole(user.role, user.email);

    return {
      token,
      user,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
    };
  },

  async getCurrentUser(userId: string): Promise<User | null> {
    return createUserForEmail('bvnethra2005@gmail.com');
  },

  async logout(): Promise<void> {
    await new Promise((res) => setTimeout(res, 100));
  },
};
