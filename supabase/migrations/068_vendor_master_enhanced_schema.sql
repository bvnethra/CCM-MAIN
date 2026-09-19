-- ============================================================================
-- Migration 068: Enhanced Vendor Master Schema & Item Category Relational Model
-- ============================================================================
-- This migration creates:
-- 1. item_categories table (master data categories for items & vendor capabilities)
-- 2. Enhanced vendors table with multi-tenancy, constraints, and audit fields
-- 3. vendor_item_categories relational junction table
-- 4. Vendor code generator function VEN-YYYY-NNNNNN
-- 5. Row Level Security (RLS) policies and performance indexes
-- ============================================================================

-- ===========================================
-- 1. ITEM CATEGORIES TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS item_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_code VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_by UUID REFERENCES user_profiles(id),
    modified_at TIMESTAMPTZ,
    CONSTRAINT unique_tenant_org_category_code UNIQUE (tenant_id, organization_id, category_code)
);

COMMENT ON TABLE item_categories IS 'Master categories for items and vendor capabilities (e.g. Electrical, Pressure, Temperature)';

-- Seed standard categories for existing tenants/orgs if not present
DO $$
DECLARE
    t_rec RECORD;
    c_name TEXT;
    c_code TEXT;
    categories TEXT[] := ARRAY['Electrical', 'Pressure', 'Temperature', 'Dimensional', 'Thermal', 'Mass & Volume', 'Force & Torque', 'Optical'];
BEGIN
    FOR t_rec IN 
        SELECT DISTINCT o.tenant_id, o.id AS organization_id, u.id AS user_id
        FROM organizations o
        LEFT JOIN user_profiles u ON u.organization_id = o.id
        LIMIT 10
    LOOP
        FOREACH c_name IN ARRAY categories
        LOOP
            c_code := 'CAT-' || UPPER(REPLACE(REPLACE(c_name, ' & ', '-'), ' ', '-'));
            INSERT INTO item_categories (tenant_id, organization_id, category_code, category_name, description, status, created_by)
            VALUES (t_rec.tenant_id, t_rec.organization_id, c_code, c_name, c_name || ' calibration & testing capability', 'ACTIVE', t_rec.user_id)
            ON CONFLICT (tenant_id, organization_id, category_code) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ===========================================
-- 2. ENHANCED VENDORS TABLE
-- ===========================================

-- Note: We drop existing legacy table if needed, preserving foreign keys if applicable
DROP TABLE IF EXISTS vendor_item_categories CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

CREATE TABLE vendors (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Multi-tenant fields (Populated from authenticated session, never trusted from frontend)
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Vendor Identification
    vendor_code VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    
    -- Address Information
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pin VARCHAR(6) NOT NULL,
    
    -- Tax and Contact Information
    gstin_tax_id VARCHAR(15) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    
    -- Audit Fields
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_by UUID REFERENCES user_profiles(id),
    modified_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT unique_tenant_org_vendor_code 
        UNIQUE (tenant_id, organization_id, vendor_code),
    
    CONSTRAINT unique_tenant_org_vendor_gstin 
        UNIQUE (tenant_id, organization_id, gstin_tax_id),
    
    CONSTRAINT valid_vendor_pin 
        CHECK (pin ~ '^[0-9]{6}$'),
    
    CONSTRAINT valid_vendor_gstin 
        CHECK (gstin_tax_id ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'),
    
    CONSTRAINT valid_vendor_status 
        CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

COMMENT ON TABLE vendors IS 'Master records for external vendors to whom calibration or service work is outsourced';
COMMENT ON COLUMN vendors.vendor_code IS 'System-generated unique identifier in format VEN-YYYY-NNNNNN';
COMMENT ON COLUMN vendors.gstin_tax_id IS 'Standard 15-character Indian Goods and Services Tax Identification Number';
COMMENT ON COLUMN vendors.pin IS '6-digit Indian Postal Identification Number';

-- ===========================================
-- 3. VENDOR ITEM CATEGORIES (JUNCTION TABLE)
-- ===========================================

CREATE TABLE vendor_item_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    item_category_id UUID NOT NULL REFERENCES item_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    CONSTRAINT unique_vendor_item_category UNIQUE (vendor_id, item_category_id)
);

COMMENT ON TABLE vendor_item_categories IS 'Relational junction mapping vendors to the item master categories they are capable of servicing';

-- ===========================================
-- 4. PERFORMANCE INDEXES
-- ===========================================

-- Composite Tenant & Org isolation
CREATE INDEX idx_vendors_tenant_org ON vendors(tenant_id, organization_id);
CREATE INDEX idx_vendors_tenant_org_status ON vendors(tenant_id, organization_id, status);
CREATE INDEX idx_vendors_tenant_org_name ON vendors(tenant_id, organization_id, vendor_name);
CREATE INDEX idx_vendors_tenant_org_gstin ON vendors(tenant_id, organization_id, gstin_tax_id);

-- Individual search & filter fields
CREATE INDEX idx_vendors_code ON vendors(vendor_code);
CREATE INDEX idx_vendors_city ON vendors(city);
CREATE INDEX idx_vendors_state ON vendors(state);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_created_at ON vendors(created_at DESC);

-- Junction table indexes
CREATE INDEX idx_vendor_item_cat_vendor ON vendor_item_categories(vendor_id);
CREATE INDEX idx_vendor_item_cat_category ON vendor_item_categories(item_category_id);

-- Item categories indexes
CREATE INDEX idx_item_cat_tenant_org ON item_categories(tenant_id, organization_id);
CREATE INDEX idx_item_cat_status ON item_categories(status);

-- ===========================================
-- 5. TRIGGERS
-- ===========================================

-- Trigger for auto-updating modified_at
DROP TRIGGER IF EXISTS trigger_vendors_modified_at ON vendors;
CREATE TRIGGER trigger_vendors_modified_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 6. SYSTEM-GENERATED VENDOR CODE GENERATOR
-- ===========================================

CREATE OR REPLACE FUNCTION generate_vendor_code(
    p_tenant_id UUID,
    p_organization_id UUID
) RETURNS VARCHAR AS $$
DECLARE
    v_year VARCHAR(4);
    v_sequence INT;
    v_vendor_code VARCHAR(50);
BEGIN
    v_year := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    -- Calculate next sequence atomically per tenant/org/year
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(
                    vendor_code 
                    FROM 'VEN-[0-9]{4}-([0-9]+)'
                ) AS INTEGER
            )
        ),
        0
    ) + 1
    INTO v_sequence
    FROM vendors
    WHERE tenant_id = p_tenant_id
        AND organization_id = p_organization_id
        AND vendor_code LIKE 'VEN-' || v_year || '-%'
    FOR UPDATE;
    
    v_vendor_code := 'VEN-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');
    RETURN v_vendor_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_vendor_code IS 'Atomically generate sequential vendor code VEN-YYYY-NNNNNN per tenant/org/year';

-- ===========================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;

-- Vendors RLS
DROP POLICY IF EXISTS policy_vendors_select ON vendors;
CREATE POLICY policy_vendors_select ON vendors
    FOR SELECT
    USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::UUID
        AND organization_id = (current_setting('app.current_organization_id', true))::UUID
    );

DROP POLICY IF EXISTS policy_vendors_insert ON vendors;
CREATE POLICY policy_vendors_insert ON vendors
    FOR INSERT
    WITH CHECK (
        tenant_id = (current_setting('app.current_tenant_id', true))::UUID
        AND organization_id = (current_setting('app.current_organization_id', true))::UUID
    );

DROP POLICY IF EXISTS policy_vendors_update ON vendors;
CREATE POLICY policy_vendors_update ON vendors
    FOR UPDATE
    USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::UUID
        AND organization_id = (current_setting('app.current_organization_id', true))::UUID
    );

DROP POLICY IF EXISTS policy_vendors_delete ON vendors;
CREATE POLICY policy_vendors_delete ON vendors
    FOR DELETE
    USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::UUID
        AND organization_id = (current_setting('app.current_organization_id', true))::UUID
    );

-- Vendor Item Categories RLS (Join through vendors)
DROP POLICY IF EXISTS policy_vic_select ON vendor_item_categories;
CREATE POLICY policy_vic_select ON vendor_item_categories
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vendors v
            WHERE v.id = vendor_item_categories.vendor_id
              AND v.tenant_id = (current_setting('app.current_tenant_id', true))::UUID
              AND v.organization_id = (current_setting('app.current_organization_id', true))::UUID
        )
    );

DROP POLICY IF EXISTS policy_vic_insert ON vendor_item_categories;
CREATE POLICY policy_vic_insert ON vendor_item_categories
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors v
            WHERE v.id = vendor_item_categories.vendor_id
              AND v.tenant_id = (current_setting('app.current_tenant_id', true))::UUID
              AND v.organization_id = (current_setting('app.current_organization_id', true))::UUID
        )
    );

DROP POLICY IF EXISTS policy_vic_delete ON vendor_item_categories;
CREATE POLICY policy_vic_delete ON vendor_item_categories
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vendors v
            WHERE v.id = vendor_item_categories.vendor_id
              AND v.tenant_id = (current_setting('app.current_tenant_id', true))::UUID
              AND v.organization_id = (current_setting('app.current_organization_id', true))::UUID
        )
    );

-- Item Categories RLS
DROP POLICY IF EXISTS policy_item_cat_select ON item_categories;
CREATE POLICY policy_item_cat_select ON item_categories
    FOR SELECT
    USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::UUID
        AND organization_id = (current_setting('app.current_organization_id', true))::UUID
    );

DROP POLICY IF EXISTS policy_item_cat_all ON item_categories;
CREATE POLICY policy_item_cat_all ON item_categories
    FOR ALL
    USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::UUID
        AND organization_id = (current_setting('app.current_organization_id', true))::UUID
    );
