import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_CODES } from '../constants/permissions';
import { mockStore } from '../mock/initialStore';
import { AccessDeniedModal } from '../components/common/AccessDeniedModal';

export const PERMISSION_CACHE_KEY = 'ccm_permissions_cache';

interface CachedPermissionData {
  userId: string;
  role: string;
  permissions: string[];
  cachedAt: string;
}

interface DeniedModalState {
  isOpen: boolean;
  permission?: string;
  routePath?: string;
}

interface PermissionContextType {
  hasPermission: (permission: string) => boolean;
  can: (module: string, action: string) => boolean;
  userPermissions: string[];
  cachedAt: string | null;
  clearPermissionCache: () => void;
  openDeniedModal: (permission?: string, routePath?: string) => void;
  closeDeniedModal: () => void;
  deniedModalState: DeniedModalState;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [deniedModalState, setDeniedModalState] = useState<DeniedModalState>({
    isOpen: false,
  });

  // Compute permissions and persist them directly into localStorage cache
  const userPermissions = useMemo<string[]>(() => {
    if (!user) return [];

    // 1. Try to read from cache if matching current user & role
    try {
      const rawCache = localStorage.getItem(PERMISSION_CACHE_KEY);
      if (rawCache) {
        const parsed: CachedPermissionData = JSON.parse(rawCache);
        if (parsed.userId === user.id && parsed.role === user.role && Array.isArray(parsed.permissions)) {
          setCachedAt(parsed.cachedAt);
          // If mock store has updated permissions, we re-evaluate below
        }
      }
    } catch (e) {
      console.warn('[RBAC Cache] Failed to read cached permissions', e);
    }

    // 2. Lookup in mock store roles
    let computed: string[] = [];
    const roleObj = mockStore.data.roles.find((r) => r.id === user.roleId || r.name === user.roleName);
    if (roleObj && roleObj.permissions && roleObj.permissions.length > 0) {
      computed = roleObj.permissions;
    } else {
      // 3. Fallback to default role permissions
      computed = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
    }

    // 4. Save computed permissions into cache
    try {
      const now = new Date().toISOString();
      const cachePayload: CachedPermissionData = {
        userId: user.id,
        role: user.role,
        permissions: computed,
        cachedAt: now,
      };
      localStorage.setItem(PERMISSION_CACHE_KEY, JSON.stringify(cachePayload));
      localStorage.setItem(`ccm_permissions_${user.id}_${user.role}`, JSON.stringify(computed));
      setCachedAt(now);
    } catch (e) {
      console.warn('[RBAC Cache] Failed to persist permissions in cache', e);
    }

    return computed;
  }, [user]);

  // Clear cache helper
  const clearPermissionCache = useCallback(() => {
    try {
      localStorage.removeItem(PERMISSION_CACHE_KEY);
      if (user) {
        localStorage.removeItem(`ccm_permissions_${user.id}_${user.role}`);
      }
      setCachedAt(null);
    } catch (e) {
      console.warn('[RBAC Cache] Failed to clear permissions cache', e);
    }
  }, [user]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN') return true;
      if (userPermissions.includes(permission)) return true;
      const normalized = permission
        .replace(/^[a-z]+s\./, (m) => m.replace(/s\./, '.'))
        .replace(/\.edit$/, '.update');
      return userPermissions.includes(normalized);
    },
    [user, userPermissions]
  );

  const can = useCallback(
    (module: string, action: string): boolean => {
      const code = `${module.toLowerCase().replace(/s$/, '')}.${action.toLowerCase()}`;
      return hasPermission(code);
    },
    [hasPermission]
  );

  const openDeniedModal = useCallback((permission?: string, routePath?: string) => {
    setDeniedModalState({
      isOpen: true,
      permission,
      routePath,
    });
  }, []);

  const closeDeniedModal = useCallback(() => {
    setDeniedModalState({ isOpen: false });
  }, []);

  return (
    <PermissionContext.Provider
      value={{
        hasPermission,
        can,
        userPermissions,
        cachedAt,
        clearPermissionCache,
        openDeniedModal,
        closeDeniedModal,
        deniedModalState,
      }}
    >
      {children}
      {/* Global Access Denied Modal triggered via context */}
      <AccessDeniedModal
        isOpen={deniedModalState.isOpen}
        requiredPermission={deniedModalState.permission}
        routePath={deniedModalState.routePath}
        onClose={closeDeniedModal}
      />
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) throw new Error('usePermission must be used within a PermissionProvider');
  return context;
};
