import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/user';
import { Tenant } from '../types/tenant';
import { Organization } from '../types/organization';
import { authService } from '../services/authService';

export const AUTH_USER_CACHE_KEY = 'ccm_user_cache';
export const AUTH_TOKEN_CACHE_KEY = 'ccm_auth_token';
export const AUTH_TENANT_CACHE_KEY = 'ccm_tenant_cache';
export const AUTH_ORG_CACHE_KEY = 'ccm_org_cache';

interface AuthContextType {
  user: User | null;
  currentTenant: Tenant | null;
  currentOrganization: Organization | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchTenant: (tenantId: string) => void;
  switchOrganization: (orgId: string) => void;
}

const DEFAULT_TENANT: Tenant = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Apex Metrology Group',
  code: 'APEX',
  tenantType: 'Enterprise',
  registrationNumber: 'CIN-U74999KA2020PTC139822',
  gstNumber: '29AAACA1234F1Z5',
  status: 'ACTIVE',
  organizationsCount: 1,
  usersCount: 5,
  contactEmail: 'contact@apexmetrology.com',
  contactPhone: '+91 80 2845 0001',
  addressLine1: 'Plot 42, Electronic City Phase 1',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  pincode: '560100',
  timezone: 'Asia/Kolkata (IST)',
  currency: 'INR (₹)',
  numberOfBranches: 3,
  adminName: 'Apex Super Admin',
  adminEmail: 'admin@apexmetrology.com',
  createdDate: '2025-01-15',
  updatedDate: '2026-09-10',
  description: 'Primary Calibration Laboratory Network'
};

const DEFAULT_ORGANIZATION: Organization = {
  id: '00000000-0000-0000-0000-000000000001',
  tenantId: '00000000-0000-0000-0000-000000000001',
  companyName: 'Apex Precision Labs Bangalore',
  companyCode: 'APX-BLR',
  companyType: 'Private Limited',
  businessType: 'Calibration',
  registrationNumber: 'U74999KA2020PTC139822',
  gstNumber: '29AAACA1234F1Z5',
  companyEmail: 'bangalore.lab@apexmetrology.com',
  companyPhone: '+91 80 4123 7890',
  addressLine1: 'Plot 42, Electronic City Phase 1',
  addressLine2: 'Hosur Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  pincode: '560100',
  timezone: 'Asia/Kolkata (IST)',
  currency: 'INR (₹)',
  numberOfBranches: 1,
  numberOfWarehouses: 1,
  msmeNumber: 'UDYAM-KR-03-0028192',
  adminName: 'Nethra BV',
  adminEmail: 'bvnethra2005@gmail.com',
  status: 'ACTIVE',
  createdDate: '2025-02-01',
  usersCount: 5
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(AUTH_USER_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('[Auth Cache] Failed to read user from cache', e);
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN_CACHE_KEY);
    } catch (e) {
      return null;
    }
  });

  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(() => {
    try {
      const cached = localStorage.getItem(AUTH_TENANT_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return DEFAULT_TENANT;
  });

  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(() => {
    try {
      const cached = localStorage.getItem(AUTH_ORG_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return DEFAULT_ORGANIZATION;
  });

  const login = async (email: string, password?: string) => {
    const res = await authService.login(email, password);
    setUser(res.user);
    setToken(res.token);

    // Save session in cache
    try {
      localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(res.user));
      localStorage.setItem(AUTH_TOKEN_CACHE_KEY, res.token);
    } catch (e) {
      console.warn('[Auth Cache] Failed to cache user session', e);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(AUTH_USER_CACHE_KEY);
      localStorage.removeItem(AUTH_TOKEN_CACHE_KEY);
      localStorage.removeItem(AUTH_TENANT_CACHE_KEY);
      localStorage.removeItem(AUTH_ORG_CACHE_KEY);
      localStorage.removeItem('ccm_permissions_cache');
    } catch (e) {
      console.warn('[Auth Cache] Failed to clear user cache on logout', e);
    }
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const roleName = newRole.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    const updated = {
      ...user,
      role: newRole,
      roleName: `${roleName} User`
    };
    setUser(updated);
    try {
      localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const switchTenant = (tenantId: string) => {
    if (user) {
      const updated = {
        ...user,
        tenantId,
        tenantName: 'Primary Tenant'
      };
      setUser(updated);
      try {
        localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const switchOrganization = (orgId: string) => {
    if (user) {
      const updated = {
        ...user,
        organizationId: orgId,
        organizationName: 'Primary Organization'
      };
      setUser(updated);
      try {
        localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentTenant,
        currentOrganization,
        isAuthenticated: !!user && !!token,
        token,
        login,
        logout,
        switchRole,
        switchTenant,
        switchOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
