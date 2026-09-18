import { User, UserRole } from '../types/user';
import { createJwtForRole } from '../lib/auth/demoTokens';
import { supabase } from '../lib/auth/supabaseClient';
import { mockStore } from '../mock/initialStore';

export interface LoginResponse {
  token: string;
  user: User;
  tenantId: string;
  organizationId: string;
}

/**
 * Dynamically resolves user details from Supabase database table `user_profiles`
 * or falls back to local user directory store.
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const normalized = email.trim().toLowerCase();

  try {
    const { data: dbUser, error } = await supabase
      .from('user_profiles')
      .select('*, roles(*)')
      .eq('email', normalized)
      .maybeSingle();

    if (!error && dbUser) {
      const roleName = dbUser.roles?.name || dbUser.role_name || 'Custom Role';
      let role: UserRole = 'ADMIN';
      const roleCodeUpper = (dbUser.roles?.code || dbUser.role || '').toUpperCase();
      const roleNameLower = roleName.toLowerCase();

      if (roleCodeUpper === 'SUPER_ADMIN' || roleNameLower.includes('super admin') || roleNameLower.includes('superadministrator')) {
        role = 'SUPER_ADMIN';
      } else if (roleCodeUpper === 'COLLECTION_AGENT' || roleNameLower.includes('collection')) {
        role = 'COLLECTION_AGENT';
      } else if (roleCodeUpper === 'LAB_USER' || roleNameLower.includes('lab')) {
        role = 'LAB_USER';
      } else if (roleCodeUpper === 'COMMERCIAL_USER' || roleNameLower.includes('commercial')) {
        role = 'COMMERCIAL_USER';
      } else if (roleCodeUpper === 'APPROVER' || roleNameLower.includes('approver')) {
        role = 'APPROVER';
      } else if (roleCodeUpper === 'DISPATCH_USER' || roleNameLower.includes('dispatch')) {
        role = 'DISPATCH_USER';
      }

      return {
        id: dbUser.id,
        fullName: dbUser.full_name || dbUser.fullName || email.split('@')[0],
        email: dbUser.email,
        phone: dbUser.phone || '+91 9876543210',
        tenantId: dbUser.tenant_id || dbUser.tenantId || '00000000-0000-0000-0000-000000000001',
        tenantName: dbUser.tenant_name || dbUser.tenantName || 'Apex Metrology Group',
        organizationId: dbUser.organization_id || dbUser.organizationId || '00000000-0000-0000-0000-000000000001',
        organizationName: dbUser.organization_name || dbUser.organizationName || 'Apex Precision Labs Bangalore',
        roleId: dbUser.role_id || dbUser.roleId || 'role-super-admin',
        role,
        roleName,
        status: dbUser.status || 'ACTIVE',
        createdAt: dbUser.created_at || new Date().toISOString().split('T')[0],
      };
    }
  } catch (e) {
    console.warn('[Auth Service] Supabase dynamic query fallback to mock store', e);
  }

  // Fallback to dynamic lookup in mockStore users directory
  const localUser = mockStore.data.users.find((u) => u.email.toLowerCase() === normalized);
  if (localUser) {
    return { ...localUser };
  }

  return null;
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

    const user = await getUserByEmail(email);

    if (!user) {
      throw new Error(`Account "${email}" not found in the database directory. Please contact your system administrator.`);
    }

    // Dynamic Database Role Check: Super Administrators are NOT permitted to log into Client App
    if (user.role === 'SUPER_ADMIN' || user.roleName.toLowerCase().includes('super admin')) {
      throw new Error('Access Denied: Super Administrators are not permitted to log into the Client Application. Please log into the Superadmin Dashboard.');
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
    const defaultUser = mockStore.data.users.find((u) => u.role !== 'SUPER_ADMIN');
    return defaultUser || null;
  },

  async logout(): Promise<void> {
    await new Promise((res) => setTimeout(res, 100));
  },
};
