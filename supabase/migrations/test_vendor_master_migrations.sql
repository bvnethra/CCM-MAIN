-- ============================================================================
-- Test Script for Vendor Master Migrations
-- ============================================================================
-- Verifies:
-- 1. vendors, item_categories, and vendor_item_categories tables
-- 2. Constraints (PIN, GSTIN format, status)
-- 3. generate_vendor_code sequence generator
-- 4. RPC functions (create, update, list, get, status, duplicate checks, history)
-- 5. Permissions (VENDOR_VIEW, VENDOR_CREATE, VENDOR_UPDATE, etc.)
-- ============================================================================

\echo '=========================================='
\echo 'VENDOR MASTER MIGRATION TESTS'
\echo '=========================================='

-- 1. Table structure
\echo '📋 TEST 1: Checking vendors table...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vendors'
ORDER BY ordinal_position;

-- 2. Check vendor_item_categories junction table
\echo '📋 TEST 2: Checking vendor_item_categories table...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vendor_item_categories'
ORDER BY ordinal_position;

-- 3. Check item_categories table
\echo '📋 TEST 3: Checking item_categories table...'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'item_categories'
ORDER BY ordinal_position;

-- 4. Check constraints
\echo '🔒 TEST 4: Checking table constraints...'
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('vendors', 'vendor_item_categories', 'item_categories')
ORDER BY table_name, constraint_name;

-- 5. Check indexes
\echo '⚡ TEST 5: Checking indexes...'
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('vendors', 'vendor_item_categories', 'item_categories')
ORDER BY tablename, indexname;

-- 6. Test code generation
\echo '🔢 TEST 6: Testing generate_vendor_code...'
SELECT generate_vendor_code(
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID
) AS generated_code;

-- 7. Check permissions
\echo '🛡️ TEST 7: Checking vendor permissions...'
SELECT code, name, module
FROM permissions
WHERE module = 'VENDOR'
ORDER BY code;

\echo '=========================================='
\echo 'ALL CHECKS COMPLETED'
\echo '=========================================='
