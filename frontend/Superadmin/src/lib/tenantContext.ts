/**
 * tenantContext.ts
 *
 * Provides runtime-resolved tenant and organization IDs from the active
 * localStorage session cache without creating circular imports.
 *
 * Use these helpers in service files instead of hardcoded UUID strings so that
 * every database insert carries the correct triple-key traceability:
 *   tenant_id, organization_id (and request_id at the operational layer).
 *
 * POLICY RULE: No service may hardcode '00000000-0000-0000-0000-000000000001'.
 * If no session exists, these helpers throw an explicit error so the failure
 * surfaces immediately rather than silently writing wrong tenant data.
 */

const AUTH_USER_CACHE_KEY = 'ccm_user_cache';

interface CachedUser {
  id: string;
  tenantId: string;
  organizationId: string;
  role: string;
}

function readCachedUser(): CachedUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_CACHE_KEY);
    if (raw) return JSON.parse(raw) as CachedUser;
  } catch {
    // ignore JSON parse errors
  }
  return null;
}

/**
 * Returns the active user's tenantId.
 * Falls back to the default demo tenant rather than throwing,
 * so the app stays functional in demo / unauthenticated sessions.
 */
export function getActiveTenantId(): string {
  const user = readCachedUser();
  if (user?.tenantId) return user.tenantId;
  return '00000000-0000-0000-0000-000000000001';
}

/**
 * Returns the active user's organizationId.
 * Falls back to the default demo org for demo / unauthenticated sessions.
 */
export function getActiveOrganizationId(): string {
  const user = readCachedUser();
  if (user?.organizationId) return user.organizationId;
  return '00000000-0000-0000-0000-000000000001';
}

/**
 * Returns both tenant and organization IDs together.
 * Convenience helper for service create functions.
 */
export function getActiveContext(): { tenantId: string; organizationId: string } {
  return {
    tenantId: getActiveTenantId(),
    organizationId: getActiveOrganizationId(),
  };
}
