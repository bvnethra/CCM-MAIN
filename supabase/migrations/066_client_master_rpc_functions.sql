-- ============================================================================
-- Migration 066: Client Master RPC Functions
-- ============================================================================
-- This migration creates all RPC (Remote Procedure Call) functions for
-- Client Master business logic.
-- ============================================================================

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

-- ============================================================================
-- END OF MIGRATION 066
-- ============================================================================
