-- ============================================================================
-- Migration 069: Vendor Master RPC Functions
-- ============================================================================
-- Transactional business logic functions for Vendor Master:
-- 1. rpc_create_vendor
-- 2. rpc_update_vendor
-- 3. rpc_list_vendors
-- 4. rpc_get_vendor_details
-- 5. rpc_update_vendor_status
-- 6. rpc_check_vendor_gstin_duplicate
-- 7. rpc_check_vendor_name_duplicate
-- 8. rpc_get_vendor_history
-- 9. rpc_list_item_categories
-- ============================================================================

-- ===========================================
-- RPC 1: CREATE VENDOR
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_create_vendor(
    p_vendor_name TEXT,
    p_address TEXT,
    p_city TEXT,
    p_state TEXT,
    p_pin TEXT,
    p_gstin_tax_id TEXT,
    p_contact_person TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_item_category_ids UUID[] DEFAULT '{}',
    p_status TEXT DEFAULT 'ACTIVE'
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_organization_id UUID;
    v_vendor_code VARCHAR(50);
    v_existing_gstin_count INT;
    v_existing_name_count INT;
    v_has_name_duplicate_warning BOOLEAN := false;
    v_new_vendor vendors%ROWTYPE;
    v_category_id UUID;
    v_categories_json JSON;
    v_result JSON;
BEGIN
    -- Extract context
    SELECT user_id, tenant_id, organization_id INTO v_user_id, v_tenant_id, v_organization_id 
    FROM get_current_user_context();

    IF v_tenant_id IS NULL OR v_organization_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_ERROR: Missing tenant or organization context';
    END IF;

    -- Validate required fields
    IF p_vendor_name IS NULL OR TRIM(p_vendor_name) = '' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Vendor name is required';
    END IF;

    IF p_address IS NULL OR TRIM(p_address) = '' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Address is required';
    END IF;

    IF p_city IS NULL OR TRIM(p_city) = '' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: City is required';
    END IF;

    IF p_state IS NULL OR TRIM(p_state) = '' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: State is required';
    END IF;

    IF p_pin IS NULL OR TRIM(p_pin) !~ '^[0-9]{6}$' THEN
        RAISE EXCEPTION 'INVALID_PIN_FORMAT: PIN must contain exactly 6 digits';
    END IF;

    IF p_gstin_tax_id IS NULL OR UPPER(TRIM(p_gstin_tax_id)) !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$' THEN
        RAISE EXCEPTION 'INVALID_GSTIN_FORMAT: Invalid GSTIN format. Expected standard 15-character GSTIN';
    END IF;

    IF p_contact_person IS NULL OR TRIM(p_contact_person) = '' THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Contact person is required';
    END IF;

    IF p_phone IS NULL OR TRIM(p_phone) !~ '^[6-9][0-9]{9}$' THEN
        RAISE EXCEPTION 'INVALID_PHONE_FORMAT: Invalid phone number. Expected 10-digit Indian mobile number';
    END IF;

    IF p_email IS NULL OR TRIM(p_email) !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
        RAISE EXCEPTION 'INVALID_EMAIL_FORMAT: Invalid email address';
    END IF;

    IF p_status NOT IN ('ACTIVE', 'INACTIVE') THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Status must be ACTIVE or INACTIVE';
    END IF;

    -- Duplicate GSTIN check (BLOCKING)
    SELECT COUNT(*) INTO v_existing_gstin_count
    FROM vendors
    WHERE tenant_id = v_tenant_id
        AND organization_id = v_organization_id
        AND gstin_tax_id = UPPER(TRIM(p_gstin_tax_id));

    IF v_existing_gstin_count > 0 THEN
        RAISE EXCEPTION 'DUPLICATE_GSTIN: Vendor with this GSTIN already exists';
    END IF;

    -- Duplicate Vendor Name check (WARNING ONLY)
    SELECT COUNT(*) INTO v_existing_name_count
    FROM vendors
    WHERE tenant_id = v_tenant_id
        AND organization_id = v_organization_id
        AND LOWER(TRIM(vendor_name)) = LOWER(TRIM(p_vendor_name));

    IF v_existing_name_count > 0 THEN
        v_has_name_duplicate_warning := true;
    END IF;

    -- Generate Vendor Code securely
    v_vendor_code := generate_vendor_code(v_tenant_id, v_organization_id);

    -- Insert Vendor
    INSERT INTO vendors (
        tenant_id,
        organization_id,
        vendor_code,
        vendor_name,
        address,
        city,
        state,
        pin,
        gstin_tax_id,
        contact_person,
        phone,
        email,
        status,
        created_by
    ) VALUES (
        v_tenant_id,
        v_organization_id,
        v_vendor_code,
        TRIM(p_vendor_name),
        TRIM(p_address),
        TRIM(p_city),
        TRIM(p_state),
        TRIM(p_pin),
        UPPER(TRIM(p_gstin_tax_id)),
        TRIM(p_contact_person),
        TRIM(p_phone),
        LOWER(TRIM(p_email)),
        p_status,
        v_user_id
    ) RETURNING * INTO v_new_vendor;

    -- Insert category relationships if provided
    IF p_item_category_ids IS NOT NULL AND array_length(p_item_category_ids, 1) > 0 THEN
        FOREACH v_category_id IN ARRAY p_item_category_ids
        LOOP
            INSERT INTO vendor_item_categories (vendor_id, item_category_id, created_by)
            VALUES (v_new_vendor.id, v_category_id, v_user_id)
            ON CONFLICT (vendor_id, item_category_id) DO NOTHING;
        END LOOP;
    END IF;

    -- Create Audit Log
    INSERT INTO audit_logs (
        tenant_id,
        organization_id,
        user_id,
        action,
        entity_type,
        entity_id,
        new_data
    ) VALUES (
        v_tenant_id,
        v_organization_id,
        v_user_id,
        'VENDOR_CREATED',
        'VENDOR',
        v_new_vendor.id,
        jsonb_build_object(
            'vendor_code', v_new_vendor.vendor_code,
            'vendor_name', v_new_vendor.vendor_name,
            'gstin_tax_id', v_new_vendor.gstin_tax_id,
            'status', v_new_vendor.status
        )
    );

    -- Fetch linked categories for return
    SELECT COALESCE(json_agg(json_build_object(
        'id', ic.id,
        'category_code', ic.category_code,
        'category_name', ic.category_name
    )), '[]'::JSON) INTO v_categories_json
    FROM vendor_item_categories vic
    JOIN item_categories ic ON ic.id = vic.item_category_id
    WHERE vic.vendor_id = v_new_vendor.id;

    v_result := json_build_object(
        'vendor', row_to_json(v_new_vendor),
        'categories', v_categories_json,
        'has_name_duplicate_warning', v_has_name_duplicate_warning
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION rpc_create_vendor IS 'Transactional creation of vendor, code generation, category relationships, and audit logging';

-- ===========================================
-- RPC 2: UPDATE VENDOR
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_update_vendor(
    p_vendor_id UUID,
    p_vendor_name TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_pin TEXT DEFAULT NULL,
    p_gstin_tax_id TEXT DEFAULT NULL,
    p_contact_person TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_item_category_ids UUID[] DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_organization_id UUID;
    v_existing_vendor vendors%ROWTYPE;
    v_updated_vendor vendors%ROWTYPE;
    v_existing_gstin_count INT;
    v_category_id UUID;
    v_categories_json JSON;
    v_old_data JSONB;
BEGIN
    SELECT user_id, tenant_id, organization_id INTO v_user_id, v_tenant_id, v_organization_id 
    FROM get_current_user_context();

    SELECT * INTO v_existing_vendor
    FROM vendors
    WHERE id = p_vendor_id
        AND tenant_id = v_tenant_id
        AND organization_id = v_organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'VENDOR_NOT_FOUND: Vendor not found';
    END IF;

    -- Format validations if values are supplied
    IF p_pin IS NOT NULL AND TRIM(p_pin) !~ '^[0-9]{6}$' THEN
        RAISE EXCEPTION 'INVALID_PIN_FORMAT: PIN must contain exactly 6 digits';
    END IF;

    IF p_gstin_tax_id IS NOT NULL THEN
        IF UPPER(TRIM(p_gstin_tax_id)) !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$' THEN
            RAISE EXCEPTION 'INVALID_GSTIN_FORMAT: Invalid GSTIN format';
        END IF;

        IF UPPER(TRIM(p_gstin_tax_id)) != v_existing_vendor.gstin_tax_id THEN
            SELECT COUNT(*) INTO v_existing_gstin_count
            FROM vendors
            WHERE tenant_id = v_tenant_id
                AND organization_id = v_organization_id
                AND gstin_tax_id = UPPER(TRIM(p_gstin_tax_id))
                AND id != p_vendor_id;

            IF v_existing_gstin_count > 0 THEN
                RAISE EXCEPTION 'DUPLICATE_GSTIN: Vendor with this GSTIN already exists';
            END IF;
        END IF;
    END IF;

    IF p_phone IS NOT NULL AND TRIM(p_phone) !~ '^[6-9][0-9]{9}$' THEN
        RAISE EXCEPTION 'INVALID_PHONE_FORMAT: Phone must be a valid 10-digit Indian mobile number';
    END IF;

    IF p_email IS NOT NULL AND TRIM(p_email) !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
        RAISE EXCEPTION 'INVALID_EMAIL_FORMAT: Invalid email address';
    END IF;

    IF p_status IS NOT NULL AND p_status NOT IN ('ACTIVE', 'INACTIVE') THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Status must be ACTIVE or INACTIVE';
    END IF;

    v_old_data := to_jsonb(v_existing_vendor);

    -- Update Vendor (vendor_code is immutable)
    UPDATE vendors
    SET
        vendor_name = COALESCE(TRIM(p_vendor_name), vendor_name),
        address = COALESCE(TRIM(p_address), address),
        city = COALESCE(TRIM(p_city), city),
        state = COALESCE(TRIM(p_state), state),
        pin = COALESCE(TRIM(p_pin), pin),
        gstin_tax_id = COALESCE(UPPER(TRIM(p_gstin_tax_id)), gstin_tax_id),
        contact_person = COALESCE(TRIM(p_contact_person), contact_person),
        phone = COALESCE(TRIM(p_phone), phone),
        email = COALESCE(LOWER(TRIM(p_email)), email),
        status = COALESCE(p_status, status),
        modified_by = v_user_id,
        modified_at = NOW()
    WHERE id = p_vendor_id
        AND tenant_id = v_tenant_id
        AND organization_id = v_organization_id
    RETURNING * INTO v_updated_vendor;

    -- Update categories if provided
    IF p_item_category_ids IS NOT NULL THEN
        DELETE FROM vendor_item_categories WHERE vendor_id = p_vendor_id;
        
        IF array_length(p_item_category_ids, 1) > 0 THEN
            FOREACH v_category_id IN ARRAY p_item_category_ids
            LOOP
                INSERT INTO vendor_item_categories (vendor_id, item_category_id, created_by)
                VALUES (p_vendor_id, v_category_id, v_user_id)
                ON CONFLICT (vendor_id, item_category_id) DO NOTHING;
            END LOOP;
        END IF;
    END IF;

    -- Record audit log
    INSERT INTO audit_logs (
        tenant_id,
        organization_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data
    ) VALUES (
        v_tenant_id,
        v_organization_id,
        v_user_id,
        'VENDOR_UPDATED',
        'VENDOR',
        p_vendor_id,
        v_old_data,
        to_jsonb(v_updated_vendor)
    );

    -- Fetch linked categories
    SELECT COALESCE(json_agg(json_build_object(
        'id', ic.id,
        'category_code', ic.category_code,
        'category_name', ic.category_name
    )), '[]'::JSON) INTO v_categories_json
    FROM vendor_item_categories vic
    JOIN item_categories ic ON ic.id = vic.item_category_id
    WHERE vic.vendor_id = p_vendor_id;

    RETURN json_build_object(
        'vendor', row_to_json(v_updated_vendor),
        'categories', v_categories_json
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION rpc_update_vendor IS 'Update vendor with validation, category synchronization, and audit logging';

-- ===========================================
-- RPC 3: LIST VENDORS (Search, Filter, Pagination)
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_list_vendors(
    p_page INT DEFAULT 0,
    p_size INT DEFAULT 20,
    p_search TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
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
    v_vendors JSON;
    v_where_clause TEXT := '';
    v_order_clause TEXT;
BEGIN
    SELECT tenant_id, organization_id INTO v_tenant_id, v_organization_id 
    FROM get_current_user_context();

    v_offset := p_page * p_size;

    -- Build search condition
    IF p_search IS NOT NULL AND TRIM(p_search) != '' THEN
        v_where_clause := v_where_clause || format(
            ' AND (LOWER(v.vendor_name) LIKE LOWER(%L) OR LOWER(v.vendor_code) LIKE LOWER(%L) OR LOWER(v.city) LIKE LOWER(%L) OR LOWER(v.gstin_tax_id) LIKE LOWER(%L))',
            '%' || p_search || '%',
            '%' || p_search || '%',
            '%' || p_search || '%',
            '%' || p_search || '%'
        );
    END IF;

    -- Filters
    IF p_status IS NOT NULL AND p_status != '' THEN
        v_where_clause := v_where_clause || format(' AND v.status = %L', p_status);
    END IF;

    IF p_state IS NOT NULL AND p_state != '' THEN
        v_where_clause := v_where_clause || format(' AND LOWER(v.state) = LOWER(%L)', p_state);
    END IF;

    IF p_category_id IS NOT NULL THEN
        v_where_clause := v_where_clause || format(
            ' AND EXISTS (SELECT 1 FROM vendor_item_categories vic WHERE vic.vendor_id = v.id AND vic.item_category_id = %L)',
            p_category_id
        );
    END IF;

    -- Sorting
    v_order_clause := CASE p_sort_by
        WHEN 'vendor_code' THEN 'v.vendor_code'
        WHEN 'vendor_name' THEN 'v.vendor_name'
        WHEN 'city' THEN 'v.city'
        WHEN 'state' THEN 'v.state'
        WHEN 'status' THEN 'v.status'
        ELSE 'v.created_at'
    END;

    IF UPPER(p_sort_order) = 'ASC' THEN
        v_order_clause := v_order_clause || ' ASC';
    ELSE
        v_order_clause := v_order_clause || ' DESC';
    END IF;

    -- Total count query
    EXECUTE format(
        'SELECT COUNT(*) FROM vendors v WHERE v.tenant_id = %L AND v.organization_id = %L %s',
        v_tenant_id,
        v_organization_id,
        v_where_clause
    ) INTO v_total_count;

    v_total_pages := CEIL(v_total_count::NUMERIC / p_size);

    -- Fetch paginated results with aggregated categories
    EXECUTE format(
        'SELECT json_agg(row_to_json(t)) FROM (
            SELECT 
                v.*,
                COALESCE((
                    SELECT json_agg(json_build_object(
                        ''id'', ic.id,
                        ''category_code'', ic.category_code,
                        ''category_name'', ic.category_name
                    ))
                    FROM vendor_item_categories vic
                    JOIN item_categories ic ON ic.id = vic.item_category_id
                    WHERE vic.vendor_id = v.id
                ), ''[]''::json) AS categories
            FROM vendors v
            WHERE v.tenant_id = %L AND v.organization_id = %L %s
            ORDER BY %s
            LIMIT %s OFFSET %s
        ) t',
        v_tenant_id,
        v_organization_id,
        v_where_clause,
        v_order_clause,
        p_size,
        v_offset
    ) INTO v_vendors;

    RETURN json_build_object(
        'vendors', COALESCE(v_vendors, '[]'::JSON),
        'pagination', json_build_object(
            'page', p_page,
            'size', p_size,
            'total', v_total_count,
            'total_pages', v_total_pages
        )
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION rpc_list_vendors IS 'List vendors with database-level search, filtering, category join, and pagination';

-- ===========================================
-- RPC 4: GET VENDOR DETAILS
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_get_vendor_details(
    p_vendor_id UUID,
    p_include_history BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
DECLARE
    v_tenant_id UUID;
    v_organization_id UUID;
    v_vendor RECORD;
    v_categories JSON;
    v_history JSON;
BEGIN
    SELECT tenant_id, organization_id INTO v_tenant_id, v_organization_id 
    FROM get_current_user_context();

    SELECT 
        v.*,
        u1.full_name AS created_by_name,
        u2.full_name AS modified_by_name
    INTO v_vendor
    FROM vendors v
    LEFT JOIN user_profiles u1 ON u1.id = v.created_by
    LEFT JOIN user_profiles u2 ON u2.id = v.modified_by
    WHERE v.id = p_vendor_id
        AND v.tenant_id = v_tenant_id
        AND v.organization_id = v_organization_id;

    IF v_vendor.id IS NULL THEN
        RAISE EXCEPTION 'VENDOR_NOT_FOUND: Vendor not found';
    END IF;

    -- Fetch categories
    SELECT COALESCE(json_agg(json_build_object(
        'id', ic.id,
        'category_code', ic.category_code,
        'category_name', ic.category_name
    )), '[]'::JSON) INTO v_categories
    FROM vendor_item_categories vic
    JOIN item_categories ic ON ic.id = vic.item_category_id
    WHERE vic.vendor_id = p_vendor_id;

    -- Aggregate history if requested
    IF p_include_history THEN
        SELECT rpc_get_vendor_history(p_vendor_id) INTO v_history;
    ELSE
        v_history := NULL;
    END IF;

    RETURN json_build_object(
        'vendor', row_to_json(v_vendor),
        'categories', v_categories,
        'history', v_history
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION rpc_get_vendor_details IS 'Fetch complete vendor profile, categories, and optional historical transactions';

-- ===========================================
-- RPC 5: UPDATE VENDOR STATUS (Activate / Deactivate)
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_update_vendor_status(
    p_vendor_id UUID,
    p_status TEXT
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_organization_id UUID;
    v_existing_vendor vendors%ROWTYPE;
    v_updated_vendor vendors%ROWTYPE;
    v_action_name TEXT;
BEGIN
    SELECT user_id, tenant_id, organization_id INTO v_user_id, v_tenant_id, v_organization_id 
    FROM get_current_user_context();

    IF p_status NOT IN ('ACTIVE', 'INACTIVE') THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Status must be ACTIVE or INACTIVE';
    END IF;

    SELECT * INTO v_existing_vendor
    FROM vendors
    WHERE id = p_vendor_id
        AND tenant_id = v_tenant_id
        AND organization_id = v_organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'VENDOR_NOT_FOUND: Vendor not found';
    END IF;

    UPDATE vendors
    SET
        status = p_status,
        modified_by = v_user_id,
        modified_at = NOW()
    WHERE id = p_vendor_id
        AND tenant_id = v_tenant_id
        AND organization_id = v_organization_id
    RETURNING * INTO v_updated_vendor;

    v_action_name := CASE WHEN p_status = 'ACTIVE' THEN 'VENDOR_ACTIVATED' ELSE 'VENDOR_DEACTIVATED' END;

    INSERT INTO audit_logs (
        tenant_id,
        organization_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data
    ) VALUES (
        v_tenant_id,
        v_organization_id,
        v_user_id,
        v_action_name,
        'VENDOR',
        p_vendor_id,
        jsonb_build_object('status', v_existing_vendor.status),
        jsonb_build_object('status', v_updated_vendor.status)
    );

    RETURN row_to_json(v_updated_vendor);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION rpc_update_vendor_status IS 'Controlled activation / deactivation with audit logging';

-- ===========================================
-- RPC 6: CHECK VENDOR GSTIN DUPLICATE
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_check_vendor_gstin_duplicate(
    p_gstin_tax_id TEXT,
    p_exclude_vendor_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_tenant_id UUID;
    v_organization_id UUID;
    v_existing_vendor vendors%ROWTYPE;
BEGIN
    SELECT tenant_id, organization_id INTO v_tenant_id, v_organization_id 
    FROM get_current_user_context();

    SELECT * INTO v_existing_vendor
    FROM vendors
    WHERE tenant_id = v_tenant_id
        AND organization_id = v_organization_id
        AND gstin_tax_id = UPPER(TRIM(p_gstin_tax_id))
        AND (p_exclude_vendor_id IS NULL OR id != p_exclude_vendor_id)
    LIMIT 1;

    IF FOUND THEN
        RETURN json_build_object(
            'is_duplicate', true,
            'existing_vendor_id', v_existing_vendor.id,
            'existing_vendor_name', v_existing_vendor.vendor_name,
            'existing_vendor_code', v_existing_vendor.vendor_code
        );
    ELSE
        RETURN json_build_object(
            'is_duplicate', false
        );
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION rpc_check_vendor_gstin_duplicate IS 'Real-time GSTIN duplicate detection for frontend validation';

-- ===========================================
-- RPC 7: CHECK VENDOR NAME DUPLICATE
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_check_vendor_name_duplicate(
    p_vendor_name TEXT,
    p_exclude_vendor_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_tenant_id UUID;
    v_organization_id UUID;
    v_duplicate_count INT;
BEGIN
    SELECT tenant_id, organization_id INTO v_tenant_id, v_organization_id 
    FROM get_current_user_context();

    SELECT COUNT(*) INTO v_duplicate_count
    FROM vendors
    WHERE tenant_id = v_tenant_id
        AND organization_id = v_organization_id
        AND LOWER(TRIM(vendor_name)) = LOWER(TRIM(p_vendor_name))
        AND (p_exclude_vendor_id IS NULL OR id != p_exclude_vendor_id);

    RETURN json_build_object(
        'is_duplicate', v_duplicate_count > 0,
        'count', v_duplicate_count
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION rpc_check_vendor_name_duplicate IS 'Real-time duplicate vendor name detection (non-blocking warning)';

-- ===========================================
-- RPC 8: GET VENDOR HISTORY ROLL-UP
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_get_vendor_history(
    p_vendor_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_tenant_id UUID;
    v_organization_id UUID;
    v_pos JSON;
    v_items_serviced JSON;
    v_outstanding_received JSON;
BEGIN
    SELECT tenant_id, organization_id INTO v_tenant_id, v_organization_id 
    FROM get_current_user_context();

    -- 1. PURCHASE ORDERS
    -- Aggregated from vendor_outsourcing and future vendor PO tables
    SELECT COALESCE(json_agg(json_build_object(
        'po_number', vo.outsourcing_number,
        'po_date', vo.created_at,
        'status', vo.outsourcing_status,
        'amount', NULL,
        'outstanding_received_status', CASE 
            WHEN vo.actual_return_date IS NOT NULL THEN 'RECEIVED'
            WHEN vo.sent_date IS NOT NULL THEN 'OUTSTANDING'
            ELSE 'PENDING_DISPATCH'
        END
    )), '[]'::JSON) INTO v_pos
    FROM vendor_outsourcing vo
    WHERE vo.vendor_id = p_vendor_id
        AND vo.tenant_id = v_tenant_id
        AND vo.organization_id = v_organization_id;

    -- 2. ITEMS SERVICED
    SELECT COALESCE(json_agg(json_build_object(
        'item', COALESCE(im.item_name, 'Calibration Item'),
        'item_code', COALESCE(im.item_code, 'N/A'),
        'service_calibration', vo.outsourcing_reason,
        'service_date', COALESCE(vo.actual_return_date, vo.sent_date, vo.created_at),
        'status', vo.outsourcing_status
    )), '[]'::JSON) INTO v_items_serviced
    FROM vendor_outsourcing vo
    LEFT JOIN request_items ri ON ri.id = vo.request_item_id
    LEFT JOIN item_masters im ON im.id = ri.item_id
    WHERE vo.vendor_id = p_vendor_id
        AND vo.tenant_id = v_tenant_id
        AND vo.organization_id = v_organization_id;

    -- 3. OUTSTANDING / RECEIVED
    SELECT COALESCE(json_agg(json_build_object(
        'po_number', vo.outsourcing_number,
        'item', COALESCE(im.item_name, 'Calibration Item'),
        'status', vo.outsourcing_status,
        'received_date', vo.actual_return_date
    )), '[]'::JSON) INTO v_outstanding_received
    FROM vendor_outsourcing vo
    LEFT JOIN request_items ri ON ri.id = vo.request_item_id
    LEFT JOIN item_masters im ON im.id = ri.item_id
    WHERE vo.vendor_id = p_vendor_id
        AND vo.tenant_id = v_tenant_id
        AND vo.organization_id = v_organization_id;

    RETURN json_build_object(
        'purchase_orders', v_pos,
        'items_serviced', v_items_serviced,
        'outstanding_received', v_outstanding_received
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION rpc_get_vendor_history IS 'Aggregates read-only history roll-up: purchase orders, serviced items, outstanding/received status';

-- ===========================================
-- RPC 9: LIST ITEM CATEGORIES
-- ===========================================

CREATE OR REPLACE FUNCTION rpc_list_item_categories()
RETURNS JSON AS $$
DECLARE
    v_tenant_id UUID;
    v_organization_id UUID;
    v_categories JSON;
BEGIN
    SELECT tenant_id, organization_id INTO v_tenant_id, v_organization_id 
    FROM get_current_user_context();

    SELECT COALESCE(json_agg(row_to_json(ic) ORDER BY ic.category_name ASC), '[]'::JSON)
    INTO v_categories
    FROM item_categories ic
    WHERE ic.tenant_id = v_tenant_id
        AND ic.organization_id = v_organization_id
        AND ic.status = 'ACTIVE';

    RETURN v_categories;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION rpc_list_item_categories IS 'List all active item master categories for multi-select';
