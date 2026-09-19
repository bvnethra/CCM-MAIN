-- ============================================================================
-- Migration 070: Vendor Master Permissions & RBAC Role Assignments
-- ============================================================================
-- Inserts required Vendor Master permissions and assigns them according to
-- the Commercial Calibration Application RBAC specification:
-- - Organization Admin: Full Vendor Master management
-- - Calibration / Lab Manager: View & History
-- - Commercial User: View & History
-- - Collection Agent: No access
-- ============================================================================

-- Insert permissions
INSERT INTO permissions (code, name, description, module) VALUES
    ('VENDOR_VIEW', 'View Vendors', 'View vendor list and vendor profiles', 'VENDOR'),
    ('VENDOR_CREATE', 'Create Vendor', 'Create new vendor records and generate vendor codes', 'VENDOR'),
    ('VENDOR_UPDATE', 'Update Vendor', 'Edit existing vendor details and serviced categories', 'VENDOR'),
    ('VENDOR_STATUS_UPDATE', 'Update Vendor Status', 'Activate or deactivate vendor accounts', 'VENDOR'),
    ('VENDOR_HISTORY_VIEW', 'View Vendor History', 'View vendor history roll-up (POs, items serviced, received status)', 'VENDOR')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    module = EXCLUDED.module;

-- ============================================================================
-- ROLE PERMISSION ASSIGNMENTS
-- ============================================================================

-- 1. ORGANIZATION_ADMIN / ADMIN: All 5 permissions
DO $$
DECLARE
    v_role_id UUID;
    v_perm_id UUID;
BEGIN
    FOR v_role_id IN 
        SELECT id FROM roles WHERE code IN ('ADMIN', 'ORGANIZATION_ADMIN')
    LOOP
        FOR v_perm_id IN 
            SELECT id FROM permissions WHERE module = 'VENDOR'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (v_role_id, v_perm_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 2. CALIBRATION_MANAGER / LAB_MANAGER: VENDOR_VIEW, VENDOR_HISTORY_VIEW
DO $$
DECLARE
    v_role_id UUID;
    v_perm_id UUID;
BEGIN
    FOR v_role_id IN 
        SELECT id FROM roles WHERE code IN ('LAB_MANAGER', 'CALIBRATION_MANAGER', 'LAB_TECHNICIAN')
    LOOP
        FOR v_perm_id IN 
            SELECT id FROM permissions WHERE code IN ('VENDOR_VIEW', 'VENDOR_HISTORY_VIEW')
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (v_role_id, v_perm_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 3. COMMERCIAL_USER: VENDOR_VIEW, VENDOR_HISTORY_VIEW
DO $$
DECLARE
    v_role_id UUID;
    v_perm_id UUID;
BEGIN
    FOR v_role_id IN 
        SELECT id FROM roles WHERE code IN ('COMMERCIAL_USER')
    LOOP
        FOR v_perm_id IN 
            SELECT id FROM permissions WHERE code IN ('VENDOR_VIEW', 'VENDOR_HISTORY_VIEW')
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (v_role_id, v_perm_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Ensure COLLECTION_AGENT has no VENDOR permissions
DELETE FROM role_permissions
WHERE role_id IN (SELECT id FROM roles WHERE code = 'COLLECTION_AGENT')
  AND permission_id IN (SELECT id FROM permissions WHERE module = 'VENDOR');
