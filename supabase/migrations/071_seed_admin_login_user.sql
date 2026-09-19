-- ============================================================================
-- Migration 071: Seed Admin Login User with All Permissions
-- ============================================================================
-- This migration provisions:
-- 1. Standard Organization Admin accounts with password "Password@123"
--    - admin@calibration.demo (Enterprise Primary Admin)
--    - apex@gmail.com (Demo Portal Admin)
-- 2. Auth user records in auth.users (updates password if email already exists,
--    or inserts if new - avoiding unique constraint violation on email)
-- 3. User profile records in public.user_profiles linked to the real auth_user_id
-- 4. Organization Admin role in public.roles
-- 5. Full permission mapping in public.role_permissions (all master data,
--    vendor master, clients, requests, lab, commercial, and dispatch permissions)
-- 6. User-to-role assignment in public.user_roles
-- 7. Context fallback helper in get_current_user_context()
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add optional convenience columns to user_profiles if missing
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'ADMIN',
ADD COLUMN IF NOT EXISTS role_name VARCHAR(100) DEFAULT 'Organization Administrator',
ADD COLUMN IF NOT EXISTS tenant_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255);

DO $$
DECLARE
    v_tenant_id UUID;
    v_org_id UUID;
    v_admin_role_id UUID;
    v_auth_user_id_1 UUID;
    v_auth_user_id_2 UUID;
    v_user_profile_id_1 UUID;
    v_user_profile_id_2 UUID;
    v_hashed_password TEXT;
    v_perm RECORD;
BEGIN
    -- Bcrypt hash for "Password@123"
    v_hashed_password := crypt('Password@123', gen_salt('bf', 10));

    -- 1. ENSURE DEFAULT TENANT EXISTS
    SELECT id INTO v_tenant_id 
    FROM tenants 
    WHERE code IN ('CAL-DEMO', 'TEN-001') OR id = '00000000-0000-0000-0000-000000000001'::UUID
    LIMIT 1;

    IF v_tenant_id IS NULL THEN
        INSERT INTO tenants (id, name, code, status)
        VALUES ('00000000-0000-0000-0000-000000000001'::UUID, 'Calibration Metrology Enterprise', 'CAL-DEMO', 'ACTIVE')
        ON CONFLICT (code) DO UPDATE SET updated_at = NOW()
        RETURNING id INTO v_tenant_id;
    END IF;

    -- 2. ENSURE DEFAULT ORGANIZATION EXISTS
    SELECT id INTO v_org_id 
    FROM organizations 
    WHERE tenant_id = v_tenant_id AND (code IN ('ORG-MAIN', 'ORG-001') OR id = '00000000-0000-0000-0000-000000000001'::UUID)
    LIMIT 1;

    IF v_org_id IS NULL THEN
        INSERT INTO organizations (id, tenant_id, name, code, address, phone, email, status)
        VALUES (
            '00000000-0000-0000-0000-000000000001'::UUID,
            v_tenant_id,
            'Central Calibration Laboratory',
            'ORG-MAIN',
            'Industrial Calibration Park, Chennai, Tamil Nadu',
            '+91 44 2250 1234',
            'admin@calibration.demo',
            'ACTIVE'
        )
        ON CONFLICT (tenant_id, code) DO UPDATE SET updated_at = NOW()
        RETURNING id INTO v_org_id;
    END IF;

    -- 3. ENSURE ADMIN ROLE EXISTS
    SELECT id INTO v_admin_role_id
    FROM roles
    WHERE tenant_id = v_tenant_id AND code IN ('ADMIN', 'ORGANIZATION_ADMIN')
    LIMIT 1;

    IF v_admin_role_id IS NULL THEN
        INSERT INTO roles (tenant_id, name, code, description, status)
        VALUES (
            v_tenant_id,
            'Organization Administrator',
            'ADMIN',
            'Full administrative authority over master data, vendors, clients, and laboratory operations',
            'ACTIVE'
        )
        RETURNING id INTO v_admin_role_id;
    END IF;

    -- 4. GRANT ALL SYSTEM PERMISSIONS TO THE ADMIN ROLE
    FOR v_perm IN SELECT id FROM permissions LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (v_admin_role_id, v_perm.id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;

    -- 5. UPSERT AUTH USERS IN auth.users SAFELY (BY EMAIL TO PREVENT DUPLICATE CONSTRAINT ERROR)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        
        -- User 1: admin@calibration.demo
        SELECT id INTO v_auth_user_id_1 
        FROM auth.users 
        WHERE email = 'admin@calibration.demo' 
        LIMIT 1;

        IF v_auth_user_id_1 IS NOT NULL THEN
            UPDATE auth.users 
            SET encrypted_password = v_hashed_password,
                email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
                raw_app_meta_data = '{"provider":"email","providers":["email"]}'::JSONB,
                raw_user_meta_data = '{"full_name":"Organization Administrator","role":"ADMIN"}'::JSONB,
                updated_at = NOW()
            WHERE id = v_auth_user_id_1;
        ELSE
            v_auth_user_id_1 := 'a1000000-0000-0000-0000-000000000001'::UUID;
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at
            ) VALUES (
                '00000000-0000-0000-0000-000000000000'::UUID,
                v_auth_user_id_1,
                'authenticated',
                'authenticated',
                'admin@calibration.demo',
                v_hashed_password,
                NOW(),
                '{"provider":"email","providers":["email"]}'::JSONB,
                '{"full_name":"Organization Administrator","role":"ADMIN"}'::JSONB,
                NOW(),
                NOW()
            );
        END IF;

        -- User 2: apex@gmail.com
        SELECT id INTO v_auth_user_id_2 
        FROM auth.users 
        WHERE email = 'apex@gmail.com' 
        LIMIT 1;

        IF v_auth_user_id_2 IS NOT NULL THEN
            UPDATE auth.users 
            SET encrypted_password = v_hashed_password,
                email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
                raw_app_meta_data = '{"provider":"email","providers":["email"]}'::JSONB,
                raw_user_meta_data = '{"full_name":"Apex Administrator","role":"ADMIN"}'::JSONB,
                updated_at = NOW()
            WHERE id = v_auth_user_id_2;
        ELSE
            v_auth_user_id_2 := 'a2000000-0000-0000-0000-000000000002'::UUID;
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at
            ) VALUES (
                '00000000-0000-0000-0000-000000000000'::UUID,
                v_auth_user_id_2,
                'authenticated',
                'authenticated',
                'apex@gmail.com',
                v_hashed_password,
                NOW(),
                '{"provider":"email","providers":["email"]}'::JSONB,
                '{"full_name":"Apex Administrator","role":"ADMIN"}'::JSONB,
                NOW(),
                NOW()
            );
        END IF;
    ELSE
        v_auth_user_id_1 := 'a1000000-0000-0000-0000-000000000001'::UUID;
        v_auth_user_id_2 := 'a2000000-0000-0000-0000-000000000002'::UUID;
    END IF;

    -- 6. CREATE OR UPDATE USER PROFILES IN public.user_profiles
    -- Profile 1: admin@calibration.demo
    SELECT id INTO v_user_profile_id_1 
    FROM user_profiles 
    WHERE email = 'admin@calibration.demo' 
    LIMIT 1;

    IF v_user_profile_id_1 IS NOT NULL THEN
        UPDATE user_profiles
        SET auth_user_id = COALESCE(v_auth_user_id_1, auth_user_id),
            tenant_id = v_tenant_id,
            organization_id = v_org_id,
            role_id = v_admin_role_id,
            role = 'ADMIN',
            role_name = 'Organization Administrator',
            tenant_name = 'Calibration Metrology Enterprise',
            organization_name = 'Central Calibration Laboratory',
            status = 'ACTIVE',
            updated_at = NOW()
        WHERE id = v_user_profile_id_1;
    ELSE
        INSERT INTO user_profiles (
            auth_user_id,
            tenant_id,
            organization_id,
            full_name,
            email,
            phone,
            status,
            role_id,
            role,
            role_name,
            tenant_name,
            organization_name
        ) VALUES (
            v_auth_user_id_1,
            v_tenant_id,
            v_org_id,
            'Organization Administrator',
            'admin@calibration.demo',
            '+91 9876543210',
            'ACTIVE',
            v_admin_role_id,
            'ADMIN',
            'Organization Administrator',
            'Calibration Metrology Enterprise',
            'Central Calibration Laboratory'
        ) RETURNING id INTO v_user_profile_id_1;
    END IF;

    -- Profile 2: apex@gmail.com
    SELECT id INTO v_user_profile_id_2 
    FROM user_profiles 
    WHERE email = 'apex@gmail.com' 
    LIMIT 1;

    IF v_user_profile_id_2 IS NOT NULL THEN
        UPDATE user_profiles
        SET auth_user_id = COALESCE(v_auth_user_id_2, auth_user_id),
            tenant_id = v_tenant_id,
            organization_id = v_org_id,
            role_id = v_admin_role_id,
            role = 'ADMIN',
            role_name = 'Organization Administrator',
            tenant_name = 'Calibration Metrology Enterprise',
            organization_name = 'Central Calibration Laboratory',
            status = 'ACTIVE',
            updated_at = NOW()
        WHERE id = v_user_profile_id_2;
    ELSE
        INSERT INTO user_profiles (
            auth_user_id,
            tenant_id,
            organization_id,
            full_name,
            email,
            phone,
            status,
            role_id,
            role,
            role_name,
            tenant_name,
            organization_name
        ) VALUES (
            v_auth_user_id_2,
            v_tenant_id,
            v_org_id,
            'Apex Administrator',
            'apex@gmail.com',
            '+91 85749 61235',
            'ACTIVE',
            v_admin_role_id,
            'ADMIN',
            'Organization Administrator',
            'Calibration Metrology Enterprise',
            'Central Calibration Laboratory'
        ) RETURNING id INTO v_user_profile_id_2;
    END IF;

    -- 7. ASSIGN ROLE IN public.user_roles
    IF v_user_profile_id_1 IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id)
        VALUES (v_user_profile_id_1, v_admin_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    IF v_user_profile_id_2 IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id)
        VALUES (v_user_profile_id_2, v_admin_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    RAISE NOTICE 'Admin users successfully configured with full permissions!';
END $$;

-- 8. ENHANCE get_current_user_context() WITH COMPREHENSIVE CONTEXT RESOLUTION
CREATE OR REPLACE FUNCTION get_current_user_context()
RETURNS TABLE (
    user_id UUID,
    tenant_id UUID,
    organization_id UUID
) AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_org_id UUID;
BEGIN
    -- 1. Try session settings (app.current_*)
    BEGIN
        v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
        v_tenant_id := NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
        v_org_id := NULLIF(current_setting('app.current_organization_id', true), '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
        v_tenant_id := NULL;
        v_org_id := NULL;
    END;

    -- 2. If missing, resolve via Supabase auth.uid()
    IF (v_user_id IS NULL OR v_tenant_id IS NULL OR v_org_id IS NULL) THEN
        SELECT up.id, up.tenant_id, up.organization_id
        INTO v_user_id, v_tenant_id, v_org_id
        FROM user_profiles up
        WHERE up.auth_user_id = auth.uid()
        LIMIT 1;
    END IF;

    -- 3. Fallback: if still missing, pick first active admin user
    IF (v_user_id IS NULL OR v_tenant_id IS NULL OR v_org_id IS NULL) THEN
        SELECT up.id, up.tenant_id, up.organization_id
        INTO v_user_id, v_tenant_id, v_org_id
        FROM user_profiles up
        WHERE up.status = 'ACTIVE' AND up.email IN ('admin@calibration.demo', 'apex@gmail.com')
        LIMIT 1;
    END IF;

    -- 4. Ultimate fallback to default demo UUID
    IF v_tenant_id IS NULL THEN
        v_tenant_id := '00000000-0000-0000-0000-000000000001'::UUID;
    END IF;
    IF v_org_id IS NULL THEN
        v_org_id := '00000000-0000-0000-0000-000000000001'::UUID;
    END IF;

    RETURN QUERY SELECT v_user_id, v_tenant_id, v_org_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_current_user_context IS 'Robust multi-tenant context resolution supporting session variables, Supabase auth.uid(), and fallback';
