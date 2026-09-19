-- ============================================================================
-- CLIENT MASTER COMPLETE MIGRATION
-- ============================================================================
-- Combined migration for Client Master module - Run this single file in
-- Supabase SQL Editor to set up the complete Client Master functionality.
-- 
-- This includes:
-- 1. Enhanced Client Master Schema (Migration 065)
-- 2. Client Master RPC Functions (Migration 066) 
-- 3. Client Master Permissions (Migration 067)
-- ============================================================================

-- ===========================================
-- PART 1: ENHANCED CLIENT MASTER SCHEMA
-- ===========================================

-- Drop existing clients table and recreate with enhanced schema
DROP TABLE IF EXISTS clients CASCADE;

-- Create enhanced clients table
CREATE TABLE clients (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant fields (NEVER sent from frontend, auto-populated from JWT)
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Client Identification
    client_code VARCHAR(50) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    
    -- Address Information
    registered_address TEXT NOT NULL,
    billing_address TEXT, -- Optional, defaults to registered_address if empty
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pin_code VARCHAR(6) NOT NULL,
    
    -- Tax and Contact Information
    gstin_tax_id VARCHAR(15) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Business Fields
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    payment_terms VARCHAR(20) NOT NULL DEFAULT '30_DAYS',
    
    -- Audit Fields (auto-populated, never sent from frontend)
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_by UUID REFERENCES user_profiles(id),
    modified_at TIMESTAMPTZ,
    
    -- ===========================================
    -- CONSTRAINTS
    -- ===========================================
    
    -- Uniqueness Constraints
    CONSTRAINT unique_tenant_org_client_code 
        UNIQUE (tenant_id, organization_id, client_code),
    
    CONSTRAINT unique_tenant_org_gstin 
        UNIQUE (tenant_id, organization_id, gstin_tax_id),
    
    -- Validation Constraints
    CONSTRAINT valid_pin_code 
        CHECK (pin_code ~ '^[0-9]{6}$'),
    
    CONSTRAINT valid_gstin 
        CHECK (gstin_tax_id ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'),
    
    CONSTRAINT valid_status 
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    
    CONSTRAINT valid_payment_terms 
        CHECK (payment_terms IN ('IMMEDIATE', '30_DAYS', '60_DAYS'))
);

-- Add table comment
COMMENT ON TABLE clients IS 'Customer companies that send items for calibration and generate business';

-- Add column comments
COMMENT ON COLUMN clients.client_code IS 'System-generated unique code in format CL-YYYY-NNNNNN';
COMMENT ON COLUMN clients.gstin_tax_id IS 'Indian GST Identification Number (15 characters)';
COMMENT ON COLUMN clients.pin_code IS 'Indian PIN code (6 digits)';
COMMENT ON COLUMN clients.payment_terms IS 'Payment terms: IMMEDIATE, 30_DAYS, or 60_DAYS';
COMMENT ON COLUMN clients.billing_address IS 'Defaults to registered_address if not provided';

-- ===========================================
-- INDEXES for Performance
-- ===========================================

-- Primary tenant/organization filtering
CREATE INDEX idx_clients_tenant_org 
    ON clients(tenant_id, organization_id);

-- Combined filters
CREATE INDEX idx_clients_tenant_org_status 
    ON clients(tenant_id, organization_id, status);

CREATE INDEX idx_clients_tenant_org_name 
    ON clients(tenant_id, organization_id, client_name);

CREATE INDEX idx_clients_tenant_org_gstin 
    ON clients(tenant_id, organization_id, gstin_tax_id);

-- Individual search fields
CREATE INDEX idx_clients_gstin 
    ON clients(gstin_tax_id);

CREATE INDEX idx_clients_client_code 
    ON clients(client_code);

CREATE INDEX idx_clients_city 
    ON clients(city);

CREATE INDEX idx_clients_state 
    ON clients(state);

CREATE INDEX idx_clients_status 
    ON clients(status);

CREATE INDEX idx_clients_payment_terms 
    ON clients(payment_terms);

-- Sorting
CREATE INDEX idx_clients_created_at 
    ON clients(created_at DESC);

CREATE INDEX idx_clients_client_name 
    ON clients(client_name);

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Trigger 1: Auto-update modified_at timestamp
DROP TRIGGER IF EXISTS trigger_clients_modified_at ON clients;
CREATE TRIGGER trigger_clients_modified_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger 2: Auto-copy billing address from registered address if empty
CREATE OR REPLACE FUNCTION set_default_billing_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.billing_address IS NULL OR TRIM(NEW.billing_address) = '' THEN
        NEW.billing_address := NEW.registered_address;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_default_billing_address ON clients;
CREATE TRIGGER trigger_default_billing_address
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION set_default_billing_address();

COMMENT ON FUNCTION set_default_billing_address() IS 'Auto-populate billing_address with registered_address if empty';

-- ===========================================
-- CLIENT CODE GENERATION FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION generate_client_code(
    p_tenant_id UUID,
    p_organization_id UUID
) RETURNS VARCHAR AS $$
DECLARE
    v_year VARCHAR(4);
    v_sequence INT;
    v_client_code VARCHAR(50);
BEGIN
    -- Get current year
    v_year := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    -- Get next sequence number for this tenant/org/year
    -- Thread-safe: uses SELECT FOR UPDATE to lock rows
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(
                    client_code 
                    FROM 'CL-[0-9]{4}-([0-9]+)'
                ) AS INTEGER
            )
        ),
        0
    ) + 1
    INTO v_sequence
    FROM clients
    WHERE tenant_id = p_tenant_id
        AND organization_id = p_organization_id
        AND client_code LIKE 'CL-' || v_year || '-%'
    FOR UPDATE;
    
    -- Format: CL-2026-000001, CL-2026-000002, etc.
    v_client_code := 'CL-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
    
    RETURN v_client_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_client_code IS 'Generate sequential client code in format CL-YYYY-NNNNNN per tenant/organization/year';

-- ===========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Users can only view clients from their tenant+organization
CREATE POLICY policy_clients_select ON clients
    FOR SELECT
    USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::UUID
        AND organization_id = (current_setting('app.current_organization_id', true))::UUID
    );

-- Policy 2: INSERT - Users can only insert into their tenant+organization
CREATE POLICY policy_clients_insert ON clients
    FOR INSERT
    WITH CHECK (
        tenant_id = (current_setting('app.current_tenant_id', true))::UUID
        AND organization_id = (current_setting('app.current_organization_id', true))::UUID
    );

-- Policy 3: UPDATE - Users can only update clients from their tenant+organization
CREATE POLICY policy_clients_update ON clients
    FOR UPDATE
    USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::UUID
        AND organization_id = (current_setting('app.current_organization_id', true))::UUID
    );

-- Policy 4: DELETE - Users can only delete clients from their tenant+organization
CREATE POLICY policy_clients_delete ON clients
    FOR DELETE
    USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::UUID
        AND organization_id = (current_setting('app.current_organization_id', true))::UUID
    );

COMMENT ON POLICY policy_clients_select ON clients IS 'Enforce tenant+organization isolation for SELECT operations';
COMMENT ON POLICY policy_clients_insert ON clients IS 'Enforce tenant+organization isolation for INSERT operations';
COMMENT ON POLICY policy_clients_update ON clients IS 'Enforce tenant+organization isolation for UPDATE operations';
COMMENT ON POLICY policy_clients_delete ON clients IS 'Enforce tenant+organization isolation for DELETE operations';

-- ===========================================
-- PART 2: CLIENT MASTER RPC FUNCTIONS
-- ===========================================

-- ===========================================
-- HELPER FUNCTION: Get Current User Context
-- ===========================================

CREATE OR REPLACE FUNCTION get_current_user_context()
RETURNS TABLE (
    user_id UUID,
    tenant_id UUID,
    organization_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (current_setting('app.current_user_id', true))::UUID,
        (current_setting('app.current_tenant_id', true))::UUID,
        (current_setting('app.current_organization_id', true))::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_current_user_context() IS 'Extract user, tenant, and organization IDs from current session settings';

-- ===========================================
-- RPC 1: CREATE CLIENT
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_create_client(
    p_client_name TEXT,
    p_registered_address TEXT,
    p_billing_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_pin_code TEXT DEFAULT NULL,
    p_gstin_tax_id TEXT DEFAULT NULL,
    p_contact_person TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'ACTIVE',
    p_payment_terms TEXT DEFAULT '30_DAYS'
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_organization_id UUID;
    v_client_code VARCHAR(50);
    v_existing_gstin_count INT;
    v_existing_name_count INT;
    v_has_name_duplicate_warning BOOLEAN := false;
    v_new_client clients%ROWTYPE;
    v_result JSON;
BEGIN
    -- Get current user context
    SELECT * INTO v_user_id, v_tenant_id, v_organization_id 
    FROM get_current_user_context();
    
    -- Validate required fields
    IF p_client_name IS NULL OR TRIM(p_client_name) = '' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Client name is required';
    END IF;
    
    IF p_registered_address IS NULL OR TRIM(p_registered_address) = '' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Registered address is required';
    END IF;
    
    IF p_city IS NULL OR TRIM(p_city) = '' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: City is required';
    END IF;
    
    IF p_state IS NULL OR TRIM(p_state) = '' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: State is required';
    END IF;
    
    IF p_pin_code IS NULL OR p_pin_code !~ '^[0-9]{6}$' THEN
        RAISE EXCEPTION 'INVALID_PIN_FORMAT: PIN code must be exactly 6 digits';
    END IF;
    
    IF p_gstin_tax_id IS NULL OR UPPER(p_gstin_tax_id) !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$' THEN
        RAISE EXCEPTION 'INVALID_GSTIN_FORMAT: Invalid GSTIN format';
    END IF;
    
    IF p_contact_person IS NULL OR TRIM(p_contact_person) = '' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Contact person is required';
    END IF;
    
    IF p_phone IS NULL OR p_phone !~ '^[6-9][0-9]{9}$' THEN
        RAISE EXCEPTION 'INVALID_PHONE_FORMAT: Phone must be a valid 10-digit Indian mobile number';
    END IF;
    
    IF p_email IS NULL OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
        RAISE EXCEPTION 'INVALID_EMAIL_FORMAT: Invalid email format';
    END IF;
    
    -- Check GSTIN duplicate (BLOCKING)
    SELECT COUNT(*) INTO v_existing_gstin_count
    FROM clients
    WHERE tenant_id = v_tenant_id
        AND organization_id = v_organization_id
        AND gstin_tax_id = UPPER(p_gstin_tax_id);
    
    IF v_existing_gstin_count > 0 THEN
        RAISE EXCEPTION 'DUPLICATE_GSTIN: Client with this GSTIN already exists';
    END IF;
    
    -- Check client name duplicate (WARNING ONLY)
    SELECT COUNT(*) INTO v_existing_name_count
    FROM clients
    WHERE tenant_id = v_tenant_id
        AND organization_id = v_organization_id
        AND LOWER(client_name) = LOWER(TRIM(p_client_name));
    
    IF v_existing_name_count > 0 THEN
        v_has_name_duplicate_warning := true;
    END IF;
    
    -- Generate client code
    v_client_code := generate_client_code(v_tenant_id, v_organization_id);
    
    -- Insert new client
    INSERT INTO clients (
        tenant_id,
        organization_id,
        client_code,
        client_name,
        registered_address,
        billing_address,
        city,
        state,
        pin_code,
        gstin_tax_id,
        contact_person,
        phone,
        email,
        status,
        payment_terms,
        created_by
    ) VALUES (
        v_tenant_id,
        v_organization_id,
        v_client_code,
        TRIM(p_client_name),
        TRIM(p_registered_address),
        CASE 
            WHEN p_billing_address IS NULL OR TRIM(p_billing_address) = '' 
            THEN TRIM(p_registered_address) 
            ELSE TRIM(p_billing_address) 
        END,
        TRIM(p_city),
        TRIM(p_state),
        p_pin_code,
        UPPER(p_gstin_tax_id),
        TRIM(p_contact_person),
        p_phone,
        LOWER(TRIM(p_email)),
        p_status,
        p_payment_terms,
        v_user_id
    ) RETURNING * INTO v_new_client;
    
    -- Build result JSON
    v_result := json_build_object(
        'client', row_to_json(v_new_client),
        'has_name_duplicate_warning', v_has_name_duplicate_warning
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION rpc_create_client IS 'Create new client with business logic validation and duplicate checking';
-- ===========================================
-- RPC 2: UPDATE CLIENT
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_update_client(
    p_client_id UUID,
    p_client_name TEXT DEFAULT NULL,
    p_registered_address TEXT DEFAULT NULL,
    p_billing_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_pin_code TEXT DEFAULT NULL,
    p_gstin_tax_id TEXT DEFAULT NULL,
    p_contact_person TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_payment_terms TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_organization_id UUID;
    v_existing_client clients%ROWTYPE;
    v_existing_gstin_count INT;
    v_updated_client clients%ROWTYPE;
BEGIN
    -- Get current user context
    SELECT * INTO v_user_id, v_tenant_id, v_organization_id 
    FROM get_current_user_context();
    
    -- Fetch existing client (RLS will enforce tenant/org)
    SELECT * INTO v_existing_client
    FROM clients
    WHERE id = p_client_id
        AND tenant_id = v_tenant_id
        AND organization_id = v_organization_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CLIENT_NOT_FOUND: Client not found';
    END IF;
    
    -- Validate PIN code if provided
    IF p_pin_code IS NOT NULL AND p_pin_code !~ '^[0-9]{6}$' THEN
        RAISE EXCEPTION 'INVALID_PIN_FORMAT: PIN code must be exactly 6 digits';
    END IF;
    
    -- Validate GSTIN if provided and check for duplicates
    IF p_gstin_tax_id IS NOT NULL THEN
        IF UPPER(p_gstin_tax_id) !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$' THEN
            RAISE EXCEPTION 'INVALID_GSTIN_FORMAT: Invalid GSTIN format';
        END IF;
        
        -- Check if GSTIN changed and is duplicate
        IF UPPER(p_gstin_tax_id) != v_existing_client.gstin_tax_id THEN
            SELECT COUNT(*) INTO v_existing_gstin_count
            FROM clients
            WHERE tenant_id = v_tenant_id
                AND organization_id = v_organization_id
                AND gstin_tax_id = UPPER(p_gstin_tax_id)
                AND id != p_client_id;
            
            IF v_existing_gstin_count > 0 THEN
                RAISE EXCEPTION 'DUPLICATE_GSTIN: Client with this GSTIN already exists';
            END IF;
        END IF;
    END IF;
    
    -- Validate phone if provided
    IF p_phone IS NOT NULL AND p_phone !~ '^[6-9][0-9]{9}$' THEN
        RAISE EXCEPTION 'INVALID_PHONE_FORMAT: Phone must be a valid 10-digit Indian mobile number';
    END IF;
    
    -- Validate email if provided
    IF p_email IS NOT NULL AND p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
        RAISE EXCEPTION 'INVALID_EMAIL_FORMAT: Invalid email format';
    END IF;
    
    -- Update client (only provided fields)
    UPDATE clients
    SET
        client_name = COALESCE(TRIM(p_client_name), client_name),
        registered_address = COALESCE(TRIM(p_registered_address), registered_address),
        billing_address = COALESCE(TRIM(p_billing_address), billing_address),
        city = COALESCE(TRIM(p_city), city),
        state = COALESCE(TRIM(p_state), state),
        pin_code = COALESCE(p_pin_code, pin_code),
        gstin_tax_id = COALESCE(UPPER(p_gstin_tax_id), gstin_tax_id),
        contact_person = COALESCE(TRIM(p_contact_person), contact_person),
        phone = COALESCE(p_phone, phone),
        email = COALESCE(LOWER(TRIM(p_email)), email),
        status = COALESCE(p_status, status),
        payment_terms = COALESCE(p_payment_terms, payment_terms),
        modified_by = v_user_id,
        modified_at = NOW()
    WHERE id = p_client_id
        AND tenant_id = v_tenant_id
        AND organization_id = v_organization_id
    RETURNING * INTO v_updated_client;
    
    RETURN row_to_json(v_updated_client);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION rpc_update_client IS 'Update existing client with validation (client_code cannot be changed)';

-- ===========================================
-- RPC 3: LIST CLIENTS
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_list_clients(
    p_page INT DEFAULT 0,
    p_size INT DEFAULT 20,
    p_search TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_payment_terms TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'created_at',
    p_sort_order TEXT DEFAULT 'desc'
)
RETURNS JSON AS $$
DECLARE
    v_tenant_id UUID;
    v_organization_id UUID;
    v_offset INT;
    v_total_count INT;
    v_total_pages INT;
    v_clients JSON;
    v_result JSON;
    v_where_clause TEXT := '';
    v_order_clause TEXT;
BEGIN
    -- Get current user context
    SELECT tenant_id, organization_id INTO v_tenant_id, v_organization_id 
    FROM get_current_user_context();
    
    -- Calculate offset
    v_offset := p_page * p_size;
    
    -- Build WHERE clause for search and filters
    IF p_search IS NOT NULL AND TRIM(p_search) != '' THEN
        v_where_clause := v_where_clause || format(
            ' AND (LOWER(client_name) LIKE LOWER(%L) OR LOWER(client_code) LIKE LOWER(%L) OR LOWER(city) LIKE LOWER(%L) OR LOWER(gstin_tax_id) LIKE LOWER(%L))',
            '%' || p_search || '%',
            '%' || p_search || '%',
            '%' || p_search || '%',
            '%' || p_search || '%'
        );
    END IF;
    
    IF p_status IS NOT NULL THEN
        v_where_clause := v_where_clause || format(' AND status = %L', p_status);
    END IF;
    
    IF p_city IS NOT NULL THEN
        v_where_clause := v_where_clause || format(' AND LOWER(city) = LOWER(%L)', p_city);
    END IF;
    
    IF p_state IS NOT NULL THEN
        v_where_clause := v_where_clause || format(' AND LOWER(state) = LOWER(%L)', p_state);
    END IF;
    
    IF p_payment_terms IS NOT NULL THEN
        v_where_clause := v_where_clause || format(' AND payment_terms = %L', p_payment_terms);
    END IF;
    
    -- Build ORDER clause
    v_order_clause := CASE p_sort_by
        WHEN 'client_code' THEN 'client_code'
        WHEN 'client_name' THEN 'client_name'
        WHEN 'city' THEN 'city'
        WHEN 'state' THEN 'state'
        WHEN 'status' THEN 'status'
        ELSE 'created_at'
    END;
    
    IF UPPER(p_sort_order) = 'ASC' THEN
        v_order_clause := v_order_clause || ' ASC';
    ELSE
        v_order_clause := v_order_clause || ' DESC';
    END IF;
    
    -- Count total matching records
    EXECUTE format(
        'SELECT COUNT(*) FROM clients WHERE tenant_id = %L AND organization_id = %L %s',
        v_tenant_id,
        v_organization_id,
        v_where_clause
    ) INTO v_total_count;
    
    -- Calculate total pages
    v_total_pages := CEIL(v_total_count::NUMERIC / p_size);
    
    -- Fetch paginated clients
    EXECUTE format(
        'SELECT json_agg(row_to_json(t)) FROM (
            SELECT * FROM clients 
            WHERE tenant_id = %L AND organization_id = %L %s
            ORDER BY %s
            LIMIT %s OFFSET %s
        ) t',
        v_tenant_id,
        v_organization_id,
        v_where_clause,
        v_order_clause,
        p_size,
        v_offset
    ) INTO v_clients;
    
    -- Build result JSON
    v_result := json_build_object(
        'clients', COALESCE(v_clients, '[]'::JSON),
        'pagination', json_build_object(
            'page', p_page,
            'size', p_size,
            'total', v_total_count,
            'total_pages', v_total_pages
        )
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION rpc_list_clients IS 'List clients with pagination, search, filters, and sorting';
-- ===========================================
-- RPC 4: GET CLIENT DETAILS
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_get_client_details(
    p_client_id UUID,
    p_include_history BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
DECLARE
    v_tenant_id UUID;
    v_organization_id UUID;
    v_client clients%ROWTYPE;
    v_history JSON;
    v_result JSON;
BEGIN
    -- Get current user context
    SELECT tenant_id, organization_id INTO v_tenant_id, v_organization_id 
    FROM get_current_user_context();
    
    -- Fetch client (RLS enforced)
    SELECT * INTO v_client
    FROM clients
    WHERE id = p_client_id
        AND tenant_id = v_tenant_id
        AND organization_id = v_organization_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CLIENT_NOT_FOUND: Client not found';
    END IF;
    
    -- Fetch history if requested
    IF p_include_history THEN
        -- TODO: Query related requests, quotations, invoices when modules are ready
        v_history := json_build_object(
            'requests', '[]'::JSON,
            'quotations', '[]'::JSON,
            'invoices', '[]'::JSON
        );
    ELSE
        v_history := NULL;
    END IF;
    
    -- Build result
    v_result := json_build_object(
        'client', row_to_json(v_client),
        'history', v_history
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION rpc_get_client_details IS 'Get single client details with optional history';
-- ===========================================
-- RPC 5: UPDATE CLIENT STATUS
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_update_client_status(
    p_client_id UUID,
    p_status TEXT
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_organization_id UUID;
    v_existing_client clients%ROWTYPE;
    v_updated_client clients%ROWTYPE;
BEGIN
    -- Get current user context
    SELECT * INTO v_user_id, v_tenant_id, v_organization_id 
    FROM get_current_user_context();
    
    -- Validate status
    IF p_status NOT IN ('ACTIVE', 'INACTIVE') THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Status must be ACTIVE or INACTIVE';
    END IF;
    
    -- Fetch existing client
    SELECT * INTO v_existing_client
    FROM clients
    WHERE id = p_client_id
        AND tenant_id = v_tenant_id
        AND organization_id = v_organization_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CLIENT_NOT_FOUND: Client not found';
    END IF;
    
    -- TODO: Check for active requests before deactivating (when request module is ready)
    -- IF p_status = 'INACTIVE' THEN
    --     -- Check if client has active requests
    --     -- RAISE EXCEPTION 'CLIENT_HAS_ACTIVE_REQUESTS' if found
    -- END IF;
    
    -- Update status
    UPDATE clients
    SET
        status = p_status,
        modified_by = v_user_id,
        modified_at = NOW()
    WHERE id = p_client_id
        AND tenant_id = v_tenant_id
        AND organization_id = v_organization_id
    RETURNING * INTO v_updated_client;
    
    RETURN row_to_json(v_updated_client);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION rpc_update_client_status IS 'Activate or deactivate client with business rule validation';
-- ===========================================
-- RPC 6: CHECK GSTIN DUPLICATE
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_check_gstin_duplicate(
    p_gstin_tax_id TEXT,
    p_exclude_client_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_tenant_id UUID;
    v_organization_id UUID;
    v_existing_client clients%ROWTYPE;
    v_result JSON;
BEGIN
    -- Get current user context
    SELECT tenant_id, organization_id INTO v_tenant_id, v_organization_id 
    FROM get_current_user_context();
    
    -- Check for duplicate
    SELECT * INTO v_existing_client
    FROM clients
    WHERE tenant_id = v_tenant_id
        AND organization_id = v_organization_id
        AND gstin_tax_id = UPPER(p_gstin_tax_id)
        AND (p_exclude_client_id IS NULL OR id != p_exclude_client_id)
    LIMIT 1;
    
    IF FOUND THEN
        v_result := json_build_object(
            'is_duplicate', true,
            'existing_client_id', v_existing_client.id,
            'existing_client_name', v_existing_client.client_name,
            'existing_client_code', v_existing_client.client_code
        );
    ELSE
        v_result := json_build_object(
            'is_duplicate', false
        );
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION rpc_check_gstin_duplicate IS 'Check if GSTIN already exists (for real-time validation)';

-- ===========================================
-- RPC 7: CHECK NAME DUPLICATE
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_check_name_duplicate(
    p_client_name TEXT,
    p_exclude_client_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_tenant_id UUID;
    v_organization_id UUID;
    v_duplicate_count INT;
    v_result JSON;
BEGIN
    -- Get current user context
    SELECT tenant_id, organization_id INTO v_tenant_id, v_organization_id 
    FROM get_current_user_context();
    
    -- Count duplicates
    SELECT COUNT(*) INTO v_duplicate_count
    FROM clients
    WHERE tenant_id = v_tenant_id
        AND organization_id = v_organization_id
        AND LOWER(client_name) = LOWER(TRIM(p_client_name))
        AND (p_exclude_client_id IS NULL OR id != p_exclude_client_id);
    
    v_result := json_build_object(
        'is_duplicate', v_duplicate_count > 0,
        'count', v_duplicate_count
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION rpc_check_name_duplicate IS 'Check if client name already exists (warning only, non-blocking)';

-- ===========================================
-- PART 3: CLIENT MASTER PERMISSIONS
-- ===========================================

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
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Client Master migration completed successfully!' as result;