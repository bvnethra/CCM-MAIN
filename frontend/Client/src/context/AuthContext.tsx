import React, { createContext, useContext, useState } from 'react';
import { ClientUser, ClientRole } from '../types/client';

export const REGISTERED_ACCOUNTS: Record<string, { fullName: string; role: ClientRole; companyName: string; clientCode: string }> = {
  'admin@apexmetrology.com': {
    fullName: 'Apex Super Admin',
    role: 'SUPER_ADMIN',
    companyName: 'Apex Metrology Group',
    clientCode: 'APEX-HQ'
  },
  'bvnethra2005@gmail.com': {
    fullName: 'Nethra BV (System Admin)',
    role: 'SYSTEM_ADMIN',
    companyName: 'Apex Precision Labs',
    clientCode: 'APX-SYS'
  },
  'priya.s@apexmetrology.com': {
    fullName: 'Priya S (Lab Technician)',
    role: 'LAB_TECHNICIAN',
    companyName: 'Apex Calibration Laboratory',
    clientCode: 'APX-LAB'
  },
  'rajesh.k@apexmetrology.com': {
    fullName: 'Rajesh K (Collection Agent)',
    role: 'COLLECTION_AGENT',
    companyName: 'Apex Logistics Field Unit',
    clientCode: 'APX-COL'
  },
  'amit.v@apexmetrology.com': {
    fullName: 'Amit V (Commercial Manager)',
    role: 'COMMERCIAL_MANAGER',
    companyName: 'Apex Commercial Billing Division',
    clientCode: 'APX-COM'
  },
  'vikram.m@apexmetrology.com': {
    fullName: 'Dr. Vikram M (Quality Approver)',
    role: 'QUALITY_APPROVER',
    companyName: 'Apex Quality & Compliance',
    clientCode: 'APX-QA'
  }
};

interface AuthContextType {
  user: ClientUser | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string, clientCode?: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: ClientRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ClientUser | null>(() => {
    try {
      const cached = localStorage.getItem('ccm_client_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const login = async (email: string, password?: string, clientCode?: string) => {
    if (!email || !email.trim()) {
      throw new Error('Please enter your email address');
    }
    if (!password || !password.trim()) {
      throw new Error('Please enter your password');
    }

    if (password.trim() !== 'Password@123') {
      throw new Error('Incorrect password. Please enter Password@123');
    }

    const normalized = email.trim().toLowerCase();
    const account = REGISTERED_ACCOUNTS[normalized];

    const mockUser: ClientUser = account ? {
      id: 'usr-' + normalized,
      email: normalized,
      fullName: account.fullName,
      companyName: account.companyName,
      clientCode: account.clientCode,
      role: account.role
    } : {
      id: 'client-usr-001',
      email: normalized,
      fullName: normalized.split('@')[0].toUpperCase(),
      companyName: 'Bosch Automotive Components',
      clientCode: clientCode || 'CLT-BOSCH',
      role: 'CLIENT_ADMIN'
    };

    setUser(mockUser);
    localStorage.setItem('ccm_client_user', JSON.stringify(mockUser));
  };

  const switchRole = (role: ClientRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('ccm_client_user', JSON.stringify(updated));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ccm_client_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
