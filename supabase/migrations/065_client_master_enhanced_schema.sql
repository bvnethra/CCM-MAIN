-- ============================================================================
-- Migration 065: Enhanced Client Master Schema
-- ============================================================================
-- This migration enhances the existing clients table with all required fields
-- from the Client Master requirements document.
-- ============================================================================

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

-- ============================================================================
-- END OF MIGRATION 065
-- ============================================================================
