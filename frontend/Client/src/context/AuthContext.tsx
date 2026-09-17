import React, { createContext, useContext, useState } from 'react';
import { ClientUser } from '../types/client';

interface AuthContextType {
  user: ClientUser | null;
  isAuthenticated: boolean;
  login: (email: string, clientCode?: string) => Promise<void>;
  logout: () => void;
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

  const login = async (email: string, clientCode?: string) => {
    if (!email || !email.trim()) {
      throw new Error('Please enter your client email address');
    }
    const mockUser: ClientUser = {
      id: 'client-usr-001',
      email: email.trim().toLowerCase(),
      fullName: email.split('@')[0].toUpperCase(),
      companyName: 'Bosch Automotive Components',
      clientCode: clientCode || 'CLT-BOSCH',
      role: 'CLIENT_USER'
    };
    setUser(mockUser);
    localStorage.setItem('ccm_client_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ccm_client_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
