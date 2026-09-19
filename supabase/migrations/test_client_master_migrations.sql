-- ============================================================================
-- Test Script for Client Master Migrations
-- ============================================================================
-- Run this script AFTER executing all three migration files to verify
-- everything is working correctly.
-- ============================================================================

\echo '=========================================='
\echo 'CLIENT MASTER MIGRATION TESTS'
\echo '=========================================='
\echo ''

-- ===========================================
-- TEST 1: Check Clients Table Structure
-- ===========================================

\echo '📋 TEST 1: Checking clients table structure...'
\echo ''

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

\echo ''

-- ===========================================
-- TEST 2: Check Constraints
-- ===========================================

\echo '🔒 TEST 2: Checking table constraints...'
\echo ''

SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'clients'
ORDER BY constraint_type, constraint_name;

\echo ''

-- ===========================================
-- TEST 3: Check Indexes
-- ===========================================

\echo '⚡ TEST 3: Checking indexes...'
\echo ''

SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'clients'
ORDER BY indexname;

\echo ''

-- ===========================================
-- TEST 4: Check RLS Policies
-- ===========================================

\echo '🛡️  TEST 4: Checking RLS policies...'
\echo ''

SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY policyname;

\echo ''

-- ===========================================
-- TEST 5: Check Functions Exist
-- ===========================================

\echo '⚙️  TEST 5: Checking functions exist...'
\echo ''

SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_name LIKE '%client%' OR routine_name LIKE 'generate_client_code'
ORDER BY routine_name;

\echo ''

-- ===========================================
-- TEST 6: Check Permissions
-- ===========================================

\echo '🔑 TEST 6: Checking CLIENT permissions...'
\echo ''

SELECT 
    code,
    name,
    description,
    module
FROM permissions
WHERE module = 'CLIENT'
ORDER BY code;

\echo ''

-- ===========================================
-- TEST 7: Check Role Assignments
-- ===========================================

\echo '👥 TEST 7: Checking role permission assignments...'
\echo ''

SELECT 
    r.name as role_name,
    r.code as role_code,
    COUNT(rp.permission_id) as permission_count,
    STRING_AGG(p.code, ', ' ORDER BY p.code) as client_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.module = 'CLIENT'
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'ORGANIZATION_ADMIN', 'COMMERCIAL_USER', 'COLLECTION_AGENT', 'LAB_TECHNICIAN')
GROUP BY r.name, r.code
ORDER BY r.code;

\echo ''

-- ===========================================
-- TEST 8: Test Client Code Generation
-- ===========================================

\echo '🏷️  TEST 8: Testing client code generation...'
\echo ''
\echo 'Generating 3 sequential client codes...'
\echo ''

DO $$
DECLARE
    v_code1 VARCHAR;
    v_code2 VARCHAR;
    v_code3 VARCHAR;
    v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
    v_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    v_code1 := generate_client_code(v_tenant_id, v_org_id);
    v_code2 := generate_client_code(v_tenant_id, v_org_id);
    v_code3 := generate_client_code(v_tenant_id, v_org_id);
    
    RAISE NOTICE 'Generated Code 1: %', v_code1;
    RAISE NOTICE 'Generated Code 2: %', v_code2;
    RAISE NOTICE 'Generated Code 3: %', v_code3;
    
    -- Verify codes are sequential
    IF v_code2 > v_code1 AND v_code3 > v_code2 THEN
        RAISE NOTICE '✅ Client codes are sequential!';
    ELSE
        RAISE WARNING '❌ Client codes are NOT sequential!';
    END IF;
END $$;

\echo ''

-- ===========================================
-- TEST 9: Test Billing Address Trigger
-- ===========================================

\echo '📦 TEST 9: Testing billing address auto-copy trigger...'
\echo ''

DO $$
DECLARE
    v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
    v_org_id UUID := '00000000-0000-0000-0000-000000000001';
    v_user_id UUID;
    v_client_id UUID;
    v_billing_address TEXT;
BEGIN
    -- Get a user ID for testing
    SELECT id INTO v_user_id FROM user_profiles LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE WARNING '⚠️  No user found in user_profiles table. Skipping test.';
        RETURN;
    END IF;
    
    -- Insert test client without billing address
    INSERT INTO clients (
        tenant_id,
        organization_id,
        client_code,
        client_name,
        registered_address,
        billing_address, -- Empty!
        city,
        state,
        pin_code,
        gstin_tax_id,
        contact_person,
        phone,
        email,
        created_by
    ) VALUES (
        v_tenant_id,
        v_org_id,
        'TEST-2026-999999',
        'Test Trigger Client',
        '123 Registered Address Street',
        '', -- Empty billing address
        'Bangalore',
        'Karnataka',
        '560001',
        '29AAAAA9999A1Z9',
        'Test Person',
        '9876543210',
        'test@trigger.com',
        v_user_id
    ) RETURNING id, billing_address INTO v_client_id, v_billing_address;
    
    -- Check if billing address was auto-copied
    IF v_billing_address = '123 Registered Address Street' THEN
        RAISE NOTICE '✅ Billing address auto-copy trigger works!';
        RAISE NOTICE 'Billing Address: %', v_billing_address;
    ELSE
        RAISE WARNING '❌ Billing address trigger did NOT work!';
    END IF;
    
    -- Clean up test data
    DELETE FROM clients WHERE id = v_client_id;
    RAISE NOTICE 'Test client deleted.';
END $$;

\echo ''

-- ===========================================
-- TEST SUMMARY
-- ===========================================

\echo '=========================================='
\echo 'TEST SUMMARY'
\echo '=========================================='
\echo ''
\echo '✅ If all tests passed, migrations are successful!'
\echo ''
\echo 'Next Steps:'
\echo '1. Set up session context in frontend'
\echo '2. Implement frontend service layer to call RPC functions'
\echo '3. Build React components'
\echo ''
\echo '=========================================='
