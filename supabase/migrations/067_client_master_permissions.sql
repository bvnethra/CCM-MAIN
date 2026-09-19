-- ============================================================================
-- Migration 067: Client Master Permissions
-- ============================================================================
-- This migration creates permissions for the Client Master module
-- ============================================================================

-- Insert Client Master permissions
INSERT INTO permissions (code, name, description, module) VALUES
    ('CLIENT_VIEW', 'View Clients', 'View client information and list clients', 'CLIENT'),
    ('CLIENT_CREATE', 'Create Client', 'Create new client records', 'CLIENT'),
    ('CLIENT_UPDATE', 'Update Client', 'Edit existing client information', 'CLIENT'),
    ('CLIENT_STATUS_UPDATE', 'Update Client Status', 'Activate or deactivate clients', 'CLIENT'),
    ('CLIENT_HISTORY_VIEW', 'View Client History', 'View client transaction history (requests, quotations, invoices)', 'CLIENT'),
    ('CLIENT_DELETE', 'Delete Client', 'Permanently delete client records (use with caution, prefer deactivation)', 'CLIENT')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- ROLE PERMISSION ASSIGNMENTS
-- ============================================================================
-- Assign permissions to existing roles based on typical RBAC matrix
-- Note: Adjust these assignments based on your organization's needs
-- ============================================================================

-- SUPER_ADMIN role: All permissions
DO $$
DECLARE
    v_super_admin_role_id UUID;
    v_permission_id UUID;
BEGIN
    -- Get SUPER_ADMIN role ID
    SELECT id INTO v_super_admin_role_id
    FROM roles
    WHERE code = 'SUPER_ADMIN'
    LIMIT 1;
    
    IF v_super_admin_role_id IS NOT NULL THEN
        -- Assign all CLIENT permissions to SUPER_ADMIN
        FOR v_permission_id IN 
            SELECT id FROM permissions WHERE module = 'CLIENT'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (v_super_admin_role_id, v_permission_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Assigned all CLIENT permissions to SUPER_ADMIN role';
    END IF;
END $$;

-- ADMIN role: All permissions except DELETE
DO $$
DECLARE
    v_admin_role_id UUID;
    v_permission_id UUID;
BEGIN
    -- Get ADMIN role ID
    SELECT id INTO v_admin_role_id
    FROM roles
    WHERE code = 'ADMIN' OR code = 'ORGANIZATION_ADMIN'
    LIMIT 1;
    
    IF v_admin_role_id IS NOT NULL THEN
        -- Assign CLIENT permissions to ADMIN (except DELETE)
        FOR v_permission_id IN 
            SELECT id FROM permissions 
            WHERE module = 'CLIENT' 
            AND code != 'CLIENT_DELETE'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (v_admin_role_id, v_permission_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Assigned CLIENT permissions to ADMIN role';
    END IF;
END $$;

-- COMMERCIAL_USER role: View, Create, Update, History
DO $$
DECLARE
    v_commercial_role_id UUID;
    v_permission_id UUID;
BEGIN
    -- Get COMMERCIAL_USER role ID
    SELECT id INTO v_commercial_role_id
    FROM roles
    WHERE code = 'COMMERCIAL_USER'
    LIMIT 1;
    
    IF v_commercial_role_id IS NOT NULL THEN
        -- Assign specific CLIENT permissions to COMMERCIAL_USER
        FOR v_permission_id IN 
            SELECT id FROM permissions 
            WHERE code IN ('CLIENT_VIEW', 'CLIENT_CREATE', 'CLIENT_UPDATE', 'CLIENT_HISTORY_VIEW')
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (v_commercial_role_id, v_permission_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Assigned CLIENT permissions to COMMERCIAL_USER role';
    END IF;
END $$;

-- COLLECTION_AGENT role: View only
DO $$
DECLARE
    v_collection_role_id UUID;
    v_permission_id UUID;
BEGIN
    -- Get COLLECTION_AGENT role ID
    SELECT id INTO v_collection_role_id
    FROM roles
    WHERE code = 'COLLECTION_AGENT'
    LIMIT 1;
    
    IF v_collection_role_id IS NOT NULL THEN
        -- Assign VIEW permission to COLLECTION_AGENT
        FOR v_permission_id IN 
            SELECT id FROM permissions 
            WHERE code IN ('CLIENT_VIEW', 'CLIENT_HISTORY_VIEW')
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (v_collection_role_id, v_permission_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Assigned CLIENT VIEW permissions to COLLECTION_AGENT role';
    END IF;
END $$;

-- LAB_TECHNICIAN role: View only
DO $$
DECLARE
    v_lab_tech_role_id UUID;
    v_permission_id UUID;
BEGIN
    -- Get LAB_TECHNICIAN role ID
    SELECT id INTO v_lab_tech_role_id
    FROM roles
    WHERE code = 'LAB_TECHNICIAN'
    LIMIT 1;
    
    IF v_lab_tech_role_id IS NOT NULL THEN
        -- Assign VIEW permission to LAB_TECHNICIAN
        FOR v_permission_id IN 
            SELECT id FROM permissions 
            WHERE code = 'CLIENT_VIEW'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (v_lab_tech_role_id, v_permission_id)
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Assigned CLIENT VIEW permission to LAB_TECHNICIAN role';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show summary of permission assignments
DO $$
DECLARE
    v_summary RECORD;
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'CLIENT MASTER PERMISSION ASSIGNMENT SUMMARY';
    RAISE NOTICE '===========================================';
    
    FOR v_summary IN
        SELECT 
            r.name as role_name,
            r.code as role_code,
            COUNT(rp.permission_id) as permission_count,
            STRING_AGG(p.code, ', ' ORDER BY p.code) as permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id AND p.module = 'CLIENT'
        WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'COMMERCIAL_USER', 'COLLECTION_AGENT', 'LAB_TECHNICIAN')
        GROUP BY r.name, r.code
        ORDER BY r.code
    LOOP
        RAISE NOTICE 'Role: % (%) - % CLIENT permissions', v_summary.role_name, v_summary.role_code, v_summary.permission_count;
        IF v_summary.permissions IS NOT NULL THEN
            RAISE NOTICE '  Permissions: %', v_summary.permissions;
        END IF;
    END LOOP;
    
    RAISE NOTICE '===========================================';
END $$;

-- ============================================================================
-- END OF MIGRATION 067
-- ============================================================================
