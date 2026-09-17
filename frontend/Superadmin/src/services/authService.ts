import { User, UserRole } from '../types/user';
import { createJwtForRole } from '../lib/auth/demoTokens';

export interface LoginResponse {
  token: string;
  user: User;
  tenantId: string;
  organizationId: string;
}

const SYSTEM_ACCOUNTS: Record<string, { fullName: string; role: UserRole; roleName: string }> = {
  'admin@apexmetrology.com': {
    fullName: 'Apex Super Admin',
    role: 'SUPER_ADMIN',
    roleName: 'Super Administrator'
  },
  'bvnethra2005@gmail.com': {
    fullName: 'Nethra BV (Admin)',
    role: 'ADMIN',
    roleName: 'System Administrator'
  },
  'priya.s@apexmetrology.com': {
    fullName: 'Priya S (Lab Tech)',
    role: 'LAB_USER',
    roleName: 'Calibration Engineer'
  },
  'rajesh.k@apexmetrology.com': {
    fullName: 'Rajesh K (Collection Agent)',
    role: 'COLLECTION_AGENT',
    roleName: 'Field Collection Agent'
  },
  'amit.v@apexmetrology.com': {
    fullName: 'Amit V (Commercial User)',
    role: 'COMMERCIAL_USER',
    roleName: 'Commercial Manager'
  },
  'vikram.m@apexmetrology.com': {
    fullName: 'Dr. Vikram M (Approver)',
    role: 'APPROVER',
    roleName: 'Quality Approver'
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

    const normalized = email.trim().toLowerCase();
    const known = SYSTEM_ACCOUNTS[normalized];
    if (!known) {
      throw new Error('Account not recognized. Please use a registered corporate email.');
    }

    const user = createUserForEmail(email);

    if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Access Denied: This portal is exclusively for Super Administrators. Other roles cannot access this link.');
    }

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
