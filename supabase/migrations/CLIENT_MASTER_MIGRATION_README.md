# Client Master Module - Database Migration Guide

## 📋 Overview

This guide covers the database setup for the Client Master module using Supabase PostgreSQL with RPC functions for business logic.

## 📁 Migration Files

Three migration files have been created:

1. **065_client_master_enhanced_schema.sql** - Database schema, triggers, and RLS policies
2. **066_client_master_rpc_functions.sql** - Business logic RPC functions
3. **067_client_master_permissions.sql** - Permissions and role assignments

## 🚀 How to Run Migrations

### Option 1: Supabase CLI (Recommended)

```bash
# Navigate to project root
cd a:\cloudflareccm

# Run migrations in order
supabase migration up
```

### Option 2: Supabase Dashboard (SQL Editor)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and execute each file in order:
   - First: `065_client_master_enhanced_schema.sql`
   - Second: `066_client_master_rpc_functions.sql`
   - Third: `067_client_master_permissions.sql`

## ✅ What Gets Created

### 1. Enhanced Clients Table

**Fields:**
- `id` - UUID primary key
- `tenant_id`, `organization_id` - Multi-tenant isolation
- `client_code` - System-generated (CL-2026-000001)
- `client_name` - Required
- `registered_address` - Required
- `billing_address` - Optional (auto-copies from registered_address)
- `city`, `state`, `pin_code` - Required
- `gstin_tax_id` - Required, validated format
- `contact_person`, `phone`, `email` - Required
- `status` - ACTIVE/INACTIVE
- `payment_terms` - IMMEDIATE/30_DAYS/60_DAYS
- `created_by`, `created_at`, `modified_by`, `modified_at` - Audit fields

**Constraints:**
- UNIQUE: (tenant_id, organization_id, client_code)
- UNIQUE: (tenant_id, organization_id, gstin_tax_id)
- CHECK: pin_code (6 digits)
- CHECK: gstin_tax_id (Indian GSTIN format)
- CHECK: status (ACTIVE/INACTIVE)
- CHECK: payment_terms (IMMEDIATE/30_DAYS/60_DAYS)

**Indexes:**
- Performance indexes on tenant_id, organization_id, status, client_name, gstin_tax_id, city, state, etc.

**Triggers:**
- Auto-update `modified_at` on UPDATE
- Auto-copy `registered_address` to `billing_address` if empty

**RLS Policies:**
- Enforce tenant+organization isolation on SELECT, INSERT, UPDATE, DELETE

### 2. Database Functions

**Client Code Generation:**
- `generate_client_code(tenant_id, organization_id)` - Generates sequential codes: CL-2026-000001

**Helper Function:**
- `get_current_user_context()` - Extracts user, tenant, org from session settings

### 3. RPC Functions

All business logic is in these functions:

| Function | Purpose | Key Features |
|----------|---------|--------------|
| `rpc_create_client` | Create new client | GSTIN duplicate check (blocks), name duplicate (warns), auto-generate code |
| `rpc_update_client` | Update existing client | GSTIN validation, client_code immutable |
| `rpc_list_clients` | List with pagination | Search, filters, sorting, pagination |
| `rpc_get_client_details` | Get single client | Includes optional history |
| `rpc_update_client_status` | Activate/deactivate | Business rule validation |
| `rpc_check_gstin_duplicate` | Real-time GSTIN check | Returns existing client if duplicate |
| `rpc_check_name_duplicate` | Real-time name check | Warning only, non-blocking |

### 4. Permissions

**Created Permissions:**
- `CLIENT_VIEW` - View clients
- `CLIENT_CREATE` - Create clients
- `CLIENT_UPDATE` - Edit clients
- `CLIENT_STATUS_UPDATE` - Activate/deactivate
- `CLIENT_HISTORY_VIEW` - View history
- `CLIENT_DELETE` - Delete (prefer deactivation)

**Default Role Assignments:**
- **SUPER_ADMIN**: All permissions
- **ADMIN/ORGANIZATION_ADMIN**: All except DELETE
- **COMMERCIAL_USER**: VIEW, CREATE, UPDATE, HISTORY_VIEW
- **COLLECTION_AGENT**: VIEW, HISTORY_VIEW only
- **LAB_TECHNICIAN**: VIEW only

## 🧪 Testing Migrations

### 1. Test Schema Creation

```sql
-- Check if clients table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'clients';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'clients';
```

### 2. Test Client Code Generation

```sql
-- Test client code generation
SELECT generate_client_code(
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID
);
-- Expected: CL-2026-000001
```

### 3. Test RPC Functions

```sql
-- Set session context (required for RLS)
SET app.current_tenant_id = '00000000-0000-0000-0000-000000000001';
SET app.current_organization_id = '00000000-0000-0000-0000-000000000001';
SET app.current_user_id = 'YOUR_USER_ID_HERE';

-- Test create client
SELECT rpc_create_client(
    p_client_name := 'Test Client Pvt Ltd',
    p_registered_address := '123 Test Street, Test Area',
    p_city := 'Bangalore',
    p_state := 'Karnataka',
    p_pin_code := '560001',
    p_gstin_tax_id := '29AAACA1234F1Z5',
    p_contact_person := 'John Doe',
    p_phone := '9876543210',
    p_email := 'john@testclient.com'
);

-- Test list clients
SELECT rpc_list_clients(
    p_page := 0,
    p_size := 10
);

-- Test GSTIN duplicate check
SELECT rpc_check_gstin_duplicate(
    p_gstin_tax_id := '29AAACA1234F1Z5'
);
```

### 4. Test Permissions

```sql
-- Check if permissions were created
SELECT code, name, module
FROM permissions
WHERE module = 'CLIENT'
ORDER BY code;

-- Check role assignments
SELECT 
    r.name as role_name,
    p.code as permission_code,
    p.name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.module = 'CLIENT'
ORDER BY r.name, p.code;
```

## ⚠️ Important Notes

### Session Context Setup

The RPC functions and RLS policies rely on session settings:
- `app.current_user_id`
- `app.current_tenant_id`
- `app.current_organization_id`

**Frontend must set these before calling RPC functions.**

### Frontend Implementation Required

After running migrations, implement:
1. Set session context in Supabase client initialization
2. Call RPC functions from frontend service layer
3. Handle errors returned by RPC functions

### Error Codes

RPC functions throw these error codes:
- `VALIDATION_ERROR` - Missing/invalid required fields
- `INVALID_PIN_FORMAT` - PIN code not 6 digits
- `INVALID_GSTIN_FORMAT` - GSTIN doesn't match pattern
- `INVALID_PHONE_FORMAT` - Phone not 10 digits starting with 6-9
- `INVALID_EMAIL_FORMAT` - Invalid email
- `DUPLICATE_GSTIN` - GSTIN already exists
- `CLIENT_NOT_FOUND` - Client ID not found

### Performance Considerations

- All queries are tenant+organization scoped (RLS enforced)
- Indexes created for common query patterns
- Client code generation uses SELECT FOR UPDATE (thread-safe)

## 🔄 Rolling Back

If you need to rollback:

```sql
-- Drop in reverse order
DROP TABLE IF EXISTS clients CASCADE;
DROP FUNCTION IF EXISTS rpc_create_client CASCADE;
DROP FUNCTION IF EXISTS rpc_update_client CASCADE;
DROP FUNCTION IF EXISTS rpc_list_clients CASCADE;
DROP FUNCTION IF EXISTS rpc_get_client_details CASCADE;
DROP FUNCTION IF EXISTS rpc_update_client_status CASCADE;
DROP FUNCTION IF EXISTS rpc_check_gstin_duplicate CASCADE;
DROP FUNCTION IF EXISTS rpc_check_name_duplicate CASCADE;
DROP FUNCTION IF EXISTS generate_client_code CASCADE;
DROP FUNCTION IF EXISTS get_current_user_context CASCADE;
DROP FUNCTION IF EXISTS set_default_billing_address CASCADE;

-- Remove permissions
DELETE FROM role_permissions 
WHERE permission_id IN (
    SELECT id FROM permissions WHERE module = 'CLIENT'
);

DELETE FROM permissions WHERE module = 'CLIENT';
```

## 📚 Next Steps

After migrations are complete:

1. ✅ **Phase 1 Complete** - Database schema and RPC functions ready
2. ⏭️ **Phase 2** - Frontend implementation
   - Update type definitions
   - Create Zod validation schemas
   - Implement service layer (call RPC functions)
   - Build React components

## 🤝 Support

If you encounter any issues:
1. Check Supabase logs for detailed error messages
2. Verify session context is set correctly
3. Test RPC functions individually in SQL Editor
4. Check RLS policies are enabled

---

**Migration Status:**
- [ ] 065_client_master_enhanced_schema.sql
- [ ] 066_client_master_rpc_functions.sql
- [ ] 067_client_master_permissions.sql

Mark each checkbox as you complete the migrations.
