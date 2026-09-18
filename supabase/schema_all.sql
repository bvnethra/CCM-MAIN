-- =============================================================================
-- CALIBRATION COMMERCIAL MODULE - STEP 1, STEP 2, STEP 3, STEP 4 & STEP 5 UNIFIED SCHEMA
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    BEGIN
        CREATE SCHEMA IF NOT EXISTS auth;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        CREATE TABLE IF NOT EXISTS auth.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid()
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        CREATE OR REPLACE FUNCTION auth.uid()
        RETURNS UUID AS $func$
            SELECT '00000000-0000-0000-0000-000000000000'::UUID;
        $func$ LANGUAGE sql STABLE;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
            CREATE ROLE authenticated;
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
            CREATE ROLE anon;
        END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- Automatic updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. TENANTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    admin_name VARCHAR(255),
    admin_email VARCHAR(255),
    admin_designation VARCHAR(150),
    admin_role VARCHAR(100) DEFAULT 'SUPER_ADMIN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 2. ORGANIZATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    admin_name VARCHAR(255),
    admin_email VARCHAR(255),
    admin_designation VARCHAR(150),
    admin_role VARCHAR(100) DEFAULT 'ADMIN',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_code UNIQUE (tenant_id, code)
);

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. USER PROFILES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_user_email UNIQUE (tenant_id, email)
);

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 4. RBAC TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_role_code UNIQUE (tenant_id, code)
);

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    module VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

-- -----------------------------------------------------------------------------
-- 5. MASTER DATA TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_code VARCHAR(50) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    address TEXT,
    billing_address TEXT,
    gst_tax_number VARCHAR(50),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_client_code UNIQUE (tenant_id, organization_id, client_code)
);

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_code VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    address TEXT,
    gst_tax_number VARCHAR(50),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    serviced_categories TEXT[] DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_vendor_code UNIQUE (tenant_id, organization_id, vendor_code)
);

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS item_masters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(100),
    measurement_range VARCHAR(255),
    least_count VARCHAR(100),
    standard_cost NUMERIC(12, 2) DEFAULT 0.00,
    calibration_frequency INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'RETIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_item_code UNIQUE (tenant_id, organization_id, item_code),
    CONSTRAINT unique_tenant_org_serial UNIQUE (tenant_id, organization_id, serial_number)
);

DROP TRIGGER IF EXISTS update_item_masters_updated_at ON item_masters;
CREATE TRIGGER update_item_masters_updated_at
BEFORE UPDATE ON item_masters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 6. AUDIT LOGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. CALIBRATION REQUESTS TABLE (STEP 2)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS calibration_request_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS calibration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_number VARCHAR(50) NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    collection_agent_id UUID REFERENCES user_profiles(id) ON DELETE RESTRICT,
    collection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'URGENT')),
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'COLLECTED', 'LAB_QUEUE', 'VERIFICATION', 'READY_TO_DISPATCH', 'DISPATCHED', 'CLIENT_RECEIVED', 'DELIVERY_SIGNED', 'COMPLETED', 'ON_HOLD', 'DISCREPANCY', 'REJECTED', 'CANCELLED', 'PARTIALLY_COMPLETED')),
    remarks TEXT,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_request_num UNIQUE (tenant_id, organization_id, request_number)
);

ALTER TABLE calibration_requests DROP CONSTRAINT IF EXISTS calibration_requests_status_check;
ALTER TABLE calibration_requests ADD CONSTRAINT calibration_requests_status_check CHECK (status IN ('CREATED', 'COLLECTED', 'LAB_QUEUE', 'VERIFICATION', 'READY_TO_DISPATCH', 'DISPATCHED', 'CLIENT_RECEIVED', 'DELIVERY_SIGNED', 'COMPLETED', 'ON_HOLD', 'DISCREPANCY', 'REJECTED', 'CANCELLED', 'PARTIALLY_COMPLETED'));

CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
    v_seq_num BIGINT;
BEGIN
    IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
        v_seq_num := nextval('calibration_request_seq');
        NEW.request_number := 'CAL-REQ-' || LPAD(v_seq_num::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_request_number ON calibration_requests;
CREATE TRIGGER trigger_generate_request_number
BEFORE INSERT ON calibration_requests
FOR EACH ROW
EXECUTE FUNCTION generate_request_number();

DROP TRIGGER IF EXISTS update_calibration_requests_updated_at ON calibration_requests;
CREATE TRIGGER update_calibration_requests_updated_at
BEFORE UPDATE ON calibration_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 8. REQUEST ITEMS TABLE (STEP 2)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    item_master_id UUID NOT NULL REFERENCES item_masters(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    received_quantity INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
    item_condition VARCHAR(30) NOT NULL DEFAULT 'GOOD' CHECK (item_condition IN ('GOOD', 'DAMAGED', 'FAULTY', 'UNKNOWN')),
    status VARCHAR(30) NOT NULL DEFAULT 'ADDED' CHECK (status IN ('ADDED', 'RECEIVED', 'VERIFICATION_PENDING', 'VERIFIED', 'DISCREPANCY', 'SHORT', 'REJECTED', 'ON_HOLD')),
    document_requirement_status VARCHAR(30) NOT NULL DEFAULT 'DOCUMENT_PENDING' CHECK (document_requirement_status IN ('DOCUMENT_REQUIRED', 'DOCUMENT_PENDING', 'DOCUMENT_RECEIVED', 'DOCUMENT_VERIFIED')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_request_items_updated_at ON request_items;
CREATE TRIGGER update_request_items_updated_at
BEFORE UPDATE ON request_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 9. VERIFICATIONS TABLE (STEP 2)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    request_item_id UUID NOT NULL REFERENCES request_items(id) ON DELETE CASCADE,
    verified_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    verified_quantity INTEGER NOT NULL CHECK (verified_quantity >= 0),
    expected_quantity INTEGER NOT NULL CHECK (expected_quantity > 0),
    observed_serial_number VARCHAR(100),
    observed_item_condition VARCHAR(30) NOT NULL CHECK (observed_item_condition IN ('GOOD', 'DAMAGED', 'FAULTY', 'UNKNOWN')),
    result VARCHAR(30) NOT NULL CHECK (result IN ('VERIFIED', 'DISCREPANCY', 'SHORT', 'REJECTED', 'ON_HOLD')),
    discrepancy_reason TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_verifications_updated_at ON verifications;
CREATE TRIGGER update_verifications_updated_at
BEFORE UPDATE ON verifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 10. LAB QUEUE VIEW (STEP 2)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_lab_queue AS
SELECT 
    ri.id AS request_item_id,
    cr.id AS request_id,
    cr.tenant_id,
    cr.organization_id,
    cr.request_number,
    cr.priority,
    cr.status AS request_status,
    cr.collection_date,
    c.id AS client_id,
    c.client_name,
    c.client_code,
    im.id AS item_master_id,
    im.item_code,
    im.item_name,
    im.item_type,
    im.serial_number AS expected_serial_number,
    ri.quantity AS expected_quantity,
    ri.received_quantity,
    ri.item_condition AS reported_item_condition,
    ri.status AS item_status,
    ri.document_requirement_status,
    ri.remarks AS item_remarks,
    ri.created_at AS item_created_at
FROM request_items ri
JOIN calibration_requests cr ON ri.request_id = cr.id
JOIN clients c ON cr.client_id = c.id
JOIN item_masters im ON ri.item_master_id = im.id
WHERE cr.status IN ('LAB_QUEUE', 'VERIFICATION', 'ON_HOLD', 'DISCREPANCY');

-- -----------------------------------------------------------------------------
-- 11. CALIBRATIONS TABLE (STEP 3)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS calibration_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS calibrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    request_item_id UUID NOT NULL REFERENCES request_items(id) ON DELETE CASCADE,
    calibration_number VARCHAR(50) NOT NULL,
    calibrated_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    calibration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    calibration_method VARCHAR(255),
    calibration_location VARCHAR(255),
    result VARCHAR(20) NOT NULL CHECK (result IN ('PASS', 'FAIL')),
    outcome VARCHAR(30) NOT NULL DEFAULT 'CALIBRATED' CHECK (outcome IN ('CALIBRATED', 'FAULTY', 'OUTSOURCED')),
    remarks TEXT,
    calibration_frequency INTEGER,
    next_due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_cal_num UNIQUE (tenant_id, organization_id, calibration_number)
);

CREATE OR REPLACE FUNCTION generate_calibration_number()
RETURNS TRIGGER AS $$
DECLARE
    v_seq_num BIGINT;
BEGIN
    IF NEW.calibration_number IS NULL OR NEW.calibration_number = '' THEN
        v_seq_num := nextval('calibration_seq');
        NEW.calibration_number := 'CAL-' || LPAD(v_seq_num::TEXT, 6, '0');
    END IF;
    
    IF NEW.next_due_date IS NULL AND NEW.calibration_frequency IS NOT NULL AND NEW.calibration_frequency > 0 THEN
        NEW.next_due_date := NEW.calibration_date + (NEW.calibration_frequency || ' days')::INTERVAL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_calibration_number ON calibrations;
CREATE TRIGGER trigger_generate_calibration_number
BEFORE INSERT ON calibrations
FOR EACH ROW
EXECUTE FUNCTION generate_calibration_number();

DROP TRIGGER IF EXISTS update_calibrations_updated_at ON calibrations;
CREATE TRIGGER update_calibrations_updated_at
BEFORE UPDATE ON calibrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 12. CALIBRATION MEASUREMENTS TABLE (STEP 3)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calibration_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    calibration_id UUID NOT NULL REFERENCES calibrations(id) ON DELETE CASCADE,
    parameter_name VARCHAR(255) NOT NULL,
    nominal_value NUMERIC(15, 4) NOT NULL,
    measured_value NUMERIC(15, 4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    tolerance_min NUMERIC(15, 4) NOT NULL,
    tolerance_max NUMERIC(15, 4) NOT NULL,
    result VARCHAR(20) NOT NULL CHECK (result IN ('PASS', 'FAIL')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_calibration_measurements_updated_at ON calibration_measurements;
CREATE TRIGGER update_calibration_measurements_updated_at
BEFORE UPDATE ON calibration_measurements
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 13. CERTIFICATES TABLE (STEP 3)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS certificate_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    calibration_id UUID NOT NULL REFERENCES calibrations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    request_item_id UUID NOT NULL REFERENCES request_items(id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) NOT NULL,
    certificate_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    certificate_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (certificate_status IN ('DRAFT', 'GENERATING', 'GENERATED', 'ISSUED', 'REVOKED')),
    certificate_version INTEGER NOT NULL DEFAULT 1,
    issued_at TIMESTAMPTZ,
    issued_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    storage_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_cert_num UNIQUE (tenant_id, organization_id, certificate_number)
);

CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER AS $$
DECLARE
    v_seq_num BIGINT;
    v_year TEXT;
BEGIN
    IF NEW.certificate_number IS NULL OR NEW.certificate_number = '' THEN
        v_seq_num := nextval('certificate_seq');
        v_year := TO_CHAR(NOW(), 'YYYY');
        NEW.certificate_number := 'CERT-' || v_year || '-' || LPAD(v_seq_num::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_certificate_number ON certificates;
CREATE TRIGGER trigger_generate_certificate_number
BEFORE INSERT ON certificates
FOR EACH ROW
EXECUTE FUNCTION generate_certificate_number();

DROP TRIGGER IF EXISTS update_certificates_updated_at ON certificates;
CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON certificates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 14. DUE LIST VIEW (STEP 3)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_due_list AS
SELECT 
    cal.id AS calibration_id,
    cal.tenant_id,
    cal.organization_id,
    cal.calibration_number,
    cal.calibration_date,
    cal.calibration_frequency,
    cal.next_due_date,
    cal.result AS calibration_result,
    cal.outcome AS calibration_outcome,
    im.id AS item_master_id,
    im.item_code,
    im.item_name,
    im.item_type,
    im.manufacturer,
    im.model,
    im.serial_number,
    c.id AS client_id,
    c.client_name,
    c.client_code,
    CASE 
        WHEN cal.next_due_date < NOW() THEN 'OVERDUE'
        WHEN cal.next_due_date <= NOW() + INTERVAL '30 days' THEN 'DUE_SOON'
        ELSE 'UPCOMING'
    END AS due_status
FROM calibrations cal
JOIN request_items ri ON cal.request_item_id = ri.id
JOIN calibration_requests cr ON cal.request_id = cr.id
JOIN clients c ON cr.client_id = c.id
JOIN item_masters im ON ri.item_master_id = im.id;

-- -----------------------------------------------------------------------------
-- 15. FAULTY SERVICES TABLE (STEP 4)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS faulty_service_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS faulty_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    request_item_id UUID NOT NULL REFERENCES request_items(id) ON DELETE CASCADE,
    calibration_id UUID REFERENCES calibrations(id) ON DELETE SET NULL,
    service_number VARCHAR(50) NOT NULL,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('INTERNAL_SERVICE', 'REPAIR', 'MAINTENANCE', 'ADJUSTMENT', 'INSPECTION')),
    fault_description TEXT NOT NULL,
    service_required TEXT,
    service_status VARCHAR(30) NOT NULL DEFAULT 'CREATED' CHECK (service_status IN ('CREATED', 'IN_SERVICE', 'ON_HOLD', 'SERVICE_COMPLETED', 'RETURNED_TO_CALIBRATION', 'CANCELLED')),
    service_start_date TIMESTAMPTZ,
    expected_completion_date TIMESTAMPTZ,
    actual_completion_date TIMESTAMPTZ,
    service_notes TEXT,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_service_num UNIQUE (tenant_id, organization_id, service_number)
);

CREATE OR REPLACE FUNCTION generate_faulty_service_number()
RETURNS TRIGGER AS $$
DECLARE
    v_seq_num BIGINT;
    v_year TEXT;
BEGIN
    IF NEW.service_number IS NULL OR NEW.service_number = '' THEN
        v_seq_num := nextval('faulty_service_seq');
        v_year := TO_CHAR(NOW(), 'YYYY');
        NEW.service_number := 'FS-' || v_year || '-' || LPAD(v_seq_num::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_faulty_service_number ON faulty_services;
CREATE TRIGGER trigger_generate_faulty_service_number
BEFORE INSERT ON faulty_services
FOR EACH ROW
EXECUTE FUNCTION generate_faulty_service_number();

DROP TRIGGER IF EXISTS update_faulty_services_updated_at ON faulty_services;
CREATE TRIGGER update_faulty_services_updated_at
BEFORE UPDATE ON faulty_services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 16. VENDOR OUTSOURCING TABLE (STEP 4)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS vendor_outsourcing_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS vendor_outsourcing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    request_item_id UUID NOT NULL REFERENCES request_items(id) ON DELETE CASCADE,
    calibration_id UUID REFERENCES calibrations(id) ON DELETE SET NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    outsourcing_number VARCHAR(50) NOT NULL,
    outsourcing_reason TEXT NOT NULL,
    vendor_reference_number VARCHAR(100),
    sent_date TIMESTAMPTZ,
    expected_return_date TIMESTAMPTZ,
    actual_return_date TIMESTAMPTZ,
    outsourcing_status VARCHAR(30) NOT NULL DEFAULT 'CREATED' CHECK (outsourcing_status IN ('CREATED', 'SENT_TO_VENDOR', 'IN_PROGRESS', 'ON_HOLD', 'RETURNED', 'VERIFIED', 'REJECTED', 'CANCELLED')),
    vendor_notes TEXT,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_outsourcing_num UNIQUE (tenant_id, organization_id, outsourcing_number)
);

CREATE OR REPLACE FUNCTION generate_outsourcing_number()
RETURNS TRIGGER AS $$
DECLARE
    v_seq_num BIGINT;
    v_year TEXT;
BEGIN
    IF NEW.outsourcing_number IS NULL OR NEW.outsourcing_number = '' THEN
        v_seq_num := nextval('vendor_outsourcing_seq');
        v_year := TO_CHAR(NOW(), 'YYYY');
        NEW.outsourcing_number := 'VO-' || v_year || '-' || LPAD(v_seq_num::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_outsourcing_number ON vendor_outsourcing;
CREATE TRIGGER trigger_generate_outsourcing_number
BEFORE INSERT ON vendor_outsourcing
FOR EACH ROW
EXECUTE FUNCTION generate_outsourcing_number();

DROP TRIGGER IF EXISTS update_vendor_outsourcing_updated_at ON vendor_outsourcing;
CREATE TRIGGER update_vendor_outsourcing_updated_at
BEFORE UPDATE ON vendor_outsourcing
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 17. QUOTATIONS TABLE (STEP 5)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS quotation_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    quotation_number VARCHAR(50) NOT NULL,
    quotation_version INTEGER NOT NULL DEFAULT 1,
    parent_quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    quotation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    quotation_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (quotation_status IN ('DRAFT', 'SUBMITTED', 'UNDER_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED')),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    notes TEXT,
    terms_and_conditions TEXT,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_quotation_num UNIQUE (tenant_id, organization_id, quotation_number, quotation_version)
);

CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TRIGGER AS $$
DECLARE
    v_seq_num BIGINT;
    v_year TEXT;
BEGIN
    IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
        v_seq_num := nextval('quotation_seq');
        v_year := TO_CHAR(NOW(), 'YYYY');
        NEW.quotation_number := 'QT-' || v_year || '-' || LPAD(v_seq_num::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_quotation_number ON quotations;
CREATE TRIGGER trigger_generate_quotation_number
BEFORE INSERT ON quotations
FOR EACH ROW
EXECUTE FUNCTION generate_quotation_number();

DROP TRIGGER IF EXISTS update_quotations_updated_at ON quotations;
CREATE TRIGGER update_quotations_updated_at
BEFORE UPDATE ON quotations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 18. QUOTATION ITEMS TABLE (STEP 5)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    request_item_id UUID REFERENCES request_items(id) ON DELETE SET NULL,
    item_master_id UUID REFERENCES item_masters(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    item_type VARCHAR(30) NOT NULL DEFAULT 'CALIBRATION' CHECK (item_type IN ('CALIBRATION', 'SERVICE', 'OUTSOURCING', 'OTHER')),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0),
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    line_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (line_total >= 0),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_quotation_items_updated_at ON quotation_items;
CREATE TRIGGER update_quotation_items_updated_at
BEFORE UPDATE ON quotation_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 19. APPROVALS TABLE (STEP 5)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    approval_level INTEGER NOT NULL DEFAULT 1 CHECK (approval_level > 0),
    approver_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    approval_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action_at TIMESTAMPTZ,
    comments TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_approvals_updated_at ON approvals;
CREATE TRIGGER update_approvals_updated_at
BEFORE UPDATE ON approvals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 20. INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_org ON user_profiles(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user ON user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_org ON clients(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_client_id ON clients(tenant_id, id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_code ON clients(tenant_id, client_code);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_vendors_tenant_id ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant_org ON vendors(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant_code ON vendors(tenant_id, vendor_code);

CREATE INDEX IF NOT EXISTS idx_item_masters_tenant_id ON item_masters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_item_masters_tenant_org ON item_masters(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_item_masters_tenant_item_code ON item_masters(tenant_id, item_code);
CREATE INDEX IF NOT EXISTS idx_item_masters_tenant_serial ON item_masters(tenant_id, serial_number);
CREATE INDEX IF NOT EXISTS idx_item_masters_created_at ON item_masters(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_item_masters_status ON item_masters(tenant_id, organization_id, status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_org ON audit_logs(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(tenant_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_cal_req_tenant_req_num ON calibration_requests(tenant_id, request_number);
CREATE INDEX IF NOT EXISTS idx_cal_req_tenant_client ON calibration_requests(tenant_id, client_id);
CREATE INDEX IF NOT EXISTS idx_cal_req_tenant_status ON calibration_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cal_req_tenant_org_status ON calibration_requests(tenant_id, organization_id, status);
CREATE INDEX IF NOT EXISTS idx_cal_req_tenant_created ON calibration_requests(tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_req_items_request_id ON request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_req_items_tenant_org ON request_items(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_req_items_tenant_status ON request_items(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_req_items_item_master ON request_items(item_master_id);

CREATE INDEX IF NOT EXISTS idx_verifications_req_item ON verifications(request_item_id);
CREATE INDEX IF NOT EXISTS idx_verifications_request_id ON verifications(request_id);
CREATE INDEX IF NOT EXISTS idx_verifications_tenant_org ON verifications(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_verifications_result ON verifications(tenant_id, result);

CREATE INDEX IF NOT EXISTS idx_calibrations_tenant_cal_num ON calibrations(tenant_id, calibration_number);
CREATE INDEX IF NOT EXISTS idx_calibrations_tenant_req ON calibrations(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_tenant_req_item ON calibrations(tenant_id, request_item_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_tenant_due ON calibrations(tenant_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_calibrations_tenant_cal_date ON calibrations(tenant_id, calibration_date);
CREATE INDEX IF NOT EXISTS idx_calibrations_tenant_org_due ON calibrations(tenant_id, organization_id, next_due_date);

CREATE INDEX IF NOT EXISTS idx_cal_measurements_cal_id ON calibration_measurements(calibration_id);
CREATE INDEX IF NOT EXISTS idx_cal_measurements_tenant_org ON calibration_measurements(tenant_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_certificates_cal_id ON certificates(calibration_id);
CREATE INDEX IF NOT EXISTS idx_certificates_tenant_cert_num ON certificates(tenant_id, certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_tenant_org ON certificates(tenant_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_faulty_services_tenant_num ON faulty_services(tenant_id, service_number);
CREATE INDEX IF NOT EXISTS idx_faulty_services_tenant_org ON faulty_services(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_faulty_services_req ON faulty_services(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_faulty_services_req_item ON faulty_services(tenant_id, request_item_id);
CREATE INDEX IF NOT EXISTS idx_faulty_services_cal ON faulty_services(tenant_id, calibration_id);
CREATE INDEX IF NOT EXISTS idx_faulty_services_status ON faulty_services(tenant_id, service_status);

CREATE INDEX IF NOT EXISTS idx_outsourcing_tenant_num ON vendor_outsourcing(tenant_id, outsourcing_number);
CREATE INDEX IF NOT EXISTS idx_outsourcing_tenant_org ON vendor_outsourcing(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_outsourcing_req ON vendor_outsourcing(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_outsourcing_req_item ON vendor_outsourcing(tenant_id, request_item_id);
CREATE INDEX IF NOT EXISTS idx_outsourcing_vendor ON vendor_outsourcing(tenant_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_outsourcing_status ON vendor_outsourcing(tenant_id, outsourcing_status);

CREATE INDEX IF NOT EXISTS idx_quotations_tenant_num ON quotations(tenant_id, quotation_number);
CREATE INDEX IF NOT EXISTS idx_quotations_tenant_org ON quotations(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_quotations_req ON quotations(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client ON quotations(tenant_id, client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(tenant_id, quotation_status);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quot_id ON quotation_items(tenant_id, quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_req ON quotation_items(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_req_item ON quotation_items(tenant_id, request_item_id);

CREATE INDEX IF NOT EXISTS idx_approvals_quot_id ON approvals(tenant_id, quotation_id);
CREATE INDEX IF NOT EXISTS idx_approvals_req ON approvals(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON approvals(tenant_id, approver_user_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(tenant_id, approval_status);

-- -----------------------------------------------------------------------------
-- 21. ROW LEVEL SECURITY (RLS) & HELPER FUNCTIONS
-- -----------------------------------------------------------------------------
-- Helper: Check if current authenticated caller has platform Super Administrator privileges
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    IF (COALESCE(auth.jwt() ->> 'role', '') = 'super_admin' OR 
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('SUPER_ADMIN', 'super_admin') OR
        COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('SUPER_ADMIN', 'super_admin')) THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 
        FROM user_profiles up
        JOIN user_roles ur ON ur.user_id = up.id
        JOIN roles r ON r.id = ur.role_id
        WHERE up.auth_user_id = auth.uid()
          AND (r.code = 'SUPER_ADMIN' OR UPPER(r.name) = 'SUPER ADMINISTRATOR')
          AND r.status = 'ACTIVE'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_profile_id()
RETURNS UUID AS $$
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_has_permission(p_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF is_super_admin() THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM user_profiles up
        JOIN user_roles ur ON ur.user_id = up.id
        JOIN role_permissions rp ON rp.role_id = ur.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE up.auth_user_id = auth.uid()
          AND p.code = p_code
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE calibration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

ALTER TABLE faulty_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_outsourcing ENABLE ROW LEVEL SECURITY;

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_isolation_policy ON tenants;
CREATE POLICY tenants_isolation_policy ON tenants FOR ALL USING (id = current_user_tenant_id());

DROP POLICY IF EXISTS organizations_isolation_policy ON organizations;
CREATE POLICY organizations_isolation_policy ON organizations FOR ALL USING (tenant_id = current_user_tenant_id());

DROP POLICY IF EXISTS user_profiles_isolation_policy ON user_profiles;
CREATE POLICY user_profiles_isolation_policy ON user_profiles FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS roles_isolation_policy ON roles;
CREATE POLICY roles_isolation_policy ON roles FOR ALL USING (tenant_id = current_user_tenant_id());

DROP POLICY IF EXISTS permissions_read_policy ON permissions;
CREATE POLICY permissions_read_policy ON permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS user_roles_isolation_policy ON user_roles;
CREATE POLICY user_roles_isolation_policy ON user_roles FOR ALL USING (
    user_id IN (
        SELECT id FROM user_profiles 
        WHERE tenant_id = current_user_tenant_id() 
        AND organization_id = current_user_organization_id()
    )
);

DROP POLICY IF EXISTS role_permissions_isolation_policy ON role_permissions;
CREATE POLICY role_permissions_isolation_policy ON role_permissions FOR ALL USING (
    role_id IN (
        SELECT id FROM roles WHERE tenant_id = current_user_tenant_id()
    )
);

DROP POLICY IF EXISTS clients_isolation_policy ON clients;
CREATE POLICY clients_isolation_policy ON clients FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS vendors_isolation_policy ON vendors;
CREATE POLICY vendors_isolation_policy ON vendors FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS item_masters_isolation_policy ON item_masters;
CREATE POLICY item_masters_isolation_policy ON item_masters FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS audit_logs_isolation_policy ON audit_logs;
CREATE POLICY audit_logs_isolation_policy ON audit_logs FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS calibration_requests_isolation_policy ON calibration_requests;
CREATE POLICY calibration_requests_isolation_policy ON calibration_requests FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS request_items_isolation_policy ON request_items;
CREATE POLICY request_items_isolation_policy ON request_items FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS verifications_isolation_policy ON verifications;
CREATE POLICY verifications_isolation_policy ON verifications FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS calibrations_isolation_policy ON calibrations;
CREATE POLICY calibrations_isolation_policy ON calibrations FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS calibration_measurements_isolation_policy ON calibration_measurements;
CREATE POLICY calibration_measurements_isolation_policy ON calibration_measurements FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS certificates_isolation_policy ON certificates;
CREATE POLICY certificates_isolation_policy ON certificates FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS faulty_services_isolation_policy ON faulty_services;
CREATE POLICY faulty_services_isolation_policy ON faulty_services FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS vendor_outsourcing_isolation_policy ON vendor_outsourcing;
CREATE POLICY vendor_outsourcing_isolation_policy ON vendor_outsourcing FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS quotations_isolation_policy ON quotations;
CREATE POLICY quotations_isolation_policy ON quotations FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS quotation_items_isolation_policy ON quotation_items;
CREATE POLICY quotation_items_isolation_policy ON quotation_items FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS approvals_isolation_policy ON approvals;
CREATE POLICY approvals_isolation_policy ON approvals FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

-- -----------------------------------------------------------------------------
-- 22. INVOICES TABLE & TRIGGERS (STEP 6)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS invoice_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    invoice_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (invoice_status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    balance_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance_amount >= 0),
    notes TEXT,
    terms_and_conditions TEXT,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_invoice_num UNIQUE (tenant_id, organization_id, invoice_number),
    CONSTRAINT check_paid_amount_le_total CHECK (paid_amount <= total_amount),
    CONSTRAINT check_balance_equals_total_minus_paid CHECK (balance_amount = (total_amount - paid_amount))
);

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    v_seq_num BIGINT;
    v_year TEXT;
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        v_seq_num := nextval('invoice_seq');
        v_year := TO_CHAR(NOW(), 'YYYY');
        NEW.invoice_number := 'INV-' || v_year || '-' || LPAD(v_seq_num::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON invoices;
CREATE TRIGGER trigger_generate_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION generate_invoice_number();

CREATE OR REPLACE FUNCTION validate_invoice_quotation()
RETURNS TRIGGER AS $$
DECLARE
    v_q_status VARCHAR(30);
    v_q_tenant UUID;
    v_q_org UUID;
    v_q_req UUID;
    v_q_client UUID;
BEGIN
    SELECT quotation_status, tenant_id, organization_id, request_id, client_id
    INTO v_q_status, v_q_tenant, v_q_org, v_q_req, v_q_client
    FROM quotations
    WHERE id = NEW.quotation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced quotation % does not exist.', NEW.quotation_id;
    END IF;

    IF v_q_status != 'APPROVED' THEN
        RAISE EXCEPTION 'Invoices can only be created from APPROVED quotations. Current quotation status: %', v_q_status;
    END IF;

    IF v_q_tenant != NEW.tenant_id OR v_q_org != NEW.organization_id THEN
        RAISE EXCEPTION 'Invoice tenant/organization does not match the referenced quotation.';
    END IF;

    IF v_q_req != NEW.request_id OR v_q_client != NEW.client_id THEN
        RAISE EXCEPTION 'Invoice request/client does not match the referenced quotation.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_invoice_quotation ON invoices;
CREATE TRIGGER trigger_validate_invoice_quotation
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION validate_invoice_quotation();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 23. INVOICE ITEMS TABLE (STEP 6)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    request_item_id UUID REFERENCES request_items(id) ON DELETE SET NULL,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    quotation_item_id UUID REFERENCES quotation_items(id) ON DELETE SET NULL,
    item_master_id UUID REFERENCES item_masters(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0),
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    line_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (line_total >= 0),
    item_type VARCHAR(30) NOT NULL DEFAULT 'CALIBRATION' CHECK (item_type IN ('CALIBRATION', 'SERVICE', 'OUTSOURCING', 'OTHER')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items;
CREATE TRIGGER update_invoice_items_updated_at
BEFORE UPDATE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 24. PURCHASE ORDERS TABLE & TRIGGERS (STEP 6)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS po_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    po_number VARCHAR(50) NOT NULL,
    po_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_date TIMESTAMPTZ,
    po_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (po_status IN ('DRAFT', 'ISSUED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    notes TEXT,
    terms_and_conditions TEXT,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_po_num UNIQUE (tenant_id, organization_id, po_number)
);

CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
DECLARE
    v_seq_num BIGINT;
    v_year TEXT;
BEGIN
    IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
        v_seq_num := nextval('po_seq');
        v_year := TO_CHAR(NOW(), 'YYYY');
        NEW.po_number := 'PO-' || v_year || '-' || LPAD(v_seq_num::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_po_number ON purchase_orders;
CREATE TRIGGER trigger_generate_po_number
BEFORE INSERT ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION generate_po_number();

CREATE OR REPLACE FUNCTION validate_po_quotation()
RETURNS TRIGGER AS $$
DECLARE
    v_q_status VARCHAR(30);
    v_q_tenant UUID;
    v_q_org UUID;
    v_q_req UUID;
    v_q_client UUID;
BEGIN
    SELECT quotation_status, tenant_id, organization_id, request_id, client_id
    INTO v_q_status, v_q_tenant, v_q_org, v_q_req, v_q_client
    FROM quotations
    WHERE id = NEW.quotation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced quotation % does not exist.', NEW.quotation_id;
    END IF;

    IF v_q_status != 'APPROVED' THEN
        RAISE EXCEPTION 'Purchase orders can only be created from APPROVED quotations. Current quotation status: %', v_q_status;
    END IF;

    IF v_q_tenant != NEW.tenant_id OR v_q_org != NEW.organization_id THEN
        RAISE EXCEPTION 'Purchase order tenant/organization does not match the referenced quotation.';
    END IF;

    IF v_q_req != NEW.request_id OR v_q_client != NEW.client_id THEN
        RAISE EXCEPTION 'Purchase order request/client does not match the referenced quotation.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_po_quotation ON purchase_orders;
CREATE TRIGGER trigger_validate_po_quotation
BEFORE INSERT OR UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION validate_po_quotation();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 25. PO ITEMS TABLE (STEP 6)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS po_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    request_item_id UUID REFERENCES request_items(id) ON DELETE SET NULL,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    quotation_item_id UUID REFERENCES quotation_items(id) ON DELETE SET NULL,
    item_master_id UUID REFERENCES item_masters(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0),
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    line_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (line_total >= 0),
    item_type VARCHAR(30) NOT NULL DEFAULT 'CALIBRATION' CHECK (item_type IN ('CALIBRATION', 'SERVICE', 'OUTSOURCING', 'OTHER')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_po_items_updated_at ON po_items;
CREATE TRIGGER update_po_items_updated_at
BEFORE UPDATE ON po_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 26. STEP 6 INDEXES & RLS POLICIES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_org ON invoices(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_request ON invoices(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_quotation ON invoices(tenant_id, quotation_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_client ON invoices(tenant_id, client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, invoice_status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_number ON invoices(tenant_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_date ON invoices(tenant_id, invoice_date);

CREATE INDEX IF NOT EXISTS idx_invoice_items_tenant ON invoice_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_tenant_org ON invoice_items(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_tenant_invoice ON invoice_items(tenant_id, invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_tenant_request ON invoice_items(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_tenant_req_item ON invoice_items(tenant_id, request_item_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_tenant_quot_item ON invoice_items(tenant_id, quotation_item_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_org ON purchase_orders(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_request ON purchase_orders(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_quotation ON purchase_orders(tenant_id, quotation_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_client ON purchase_orders(tenant_id, client_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_status ON purchase_orders(tenant_id, po_status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_number ON purchase_orders(tenant_id, po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_date ON purchase_orders(tenant_id, po_date);

CREATE INDEX IF NOT EXISTS idx_po_items_tenant ON po_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_po_items_tenant_org ON po_items(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_po_items_tenant_po ON po_items(tenant_id, purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_tenant_request ON po_items(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_po_items_tenant_req_item ON po_items(tenant_id, request_item_id);
CREATE INDEX IF NOT EXISTS idx_po_items_tenant_quot_item ON po_items(tenant_id, quotation_item_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoices_isolation_policy ON invoices;
CREATE POLICY invoices_isolation_policy ON invoices FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS invoice_items_isolation_policy ON invoice_items;
CREATE POLICY invoice_items_isolation_policy ON invoice_items FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS purchase_orders_isolation_policy ON purchase_orders;
CREATE POLICY purchase_orders_isolation_policy ON purchase_orders FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS po_items_isolation_policy ON po_items;
CREATE POLICY po_items_isolation_policy ON po_items FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

-- -----------------------------------------------------------------------------
-- 27. SIGNATURES TABLE (STEP 7)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    signature_type VARCHAR(50) NOT NULL CHECK (signature_type IN ('CLIENT_INVOICE', 'CLIENT_DELIVERY')),
    signed_by_name VARCHAR(255) NOT NULL,
    signed_by_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    signature_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (signature_status IN ('PENDING', 'SIGNED', 'REJECTED', 'CANCELLED')),
    signed_at TIMESTAMPTZ,
    signature_reference VARCHAR(255),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_signatures_updated_at ON signatures;
CREATE TRIGGER update_signatures_updated_at
BEFORE UPDATE ON signatures
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 28. DISPATCHES TABLE & TRIGGERS (STEP 7)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS dispatch_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    dispatch_number VARCHAR(50) NOT NULL,
    dispatch_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dispatch_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (dispatch_status IN ('DRAFT', 'READY', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
    courier_name VARCHAR(255),
    tracking_number VARCHAR(100),
    tracking_url TEXT,
    expected_delivery_date TIMESTAMPTZ,
    actual_dispatch_date TIMESTAMPTZ,
    remarks TEXT,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_dispatch_num UNIQUE (tenant_id, organization_id, dispatch_number)
);

CREATE OR REPLACE FUNCTION generate_dispatch_number()
RETURNS TRIGGER AS $$
DECLARE
    v_seq_num BIGINT;
    v_year TEXT;
BEGIN
    IF NEW.dispatch_number IS NULL OR NEW.dispatch_number = '' THEN
        v_seq_num := nextval('dispatch_seq');
        v_year := TO_CHAR(NOW(), 'YYYY');
        NEW.dispatch_number := 'DSP-' || v_year || '-' || LPAD(v_seq_num::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_dispatch_number ON dispatches;
CREATE TRIGGER trigger_generate_dispatch_number
BEFORE INSERT ON dispatches
FOR EACH ROW
EXECUTE FUNCTION generate_dispatch_number();

CREATE OR REPLACE FUNCTION validate_dispatch_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    v_signed_count INTEGER;
BEGIN
    IF NEW.dispatch_status IN ('READY', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED') THEN
        SELECT COUNT(*) INTO v_signed_count
        FROM signatures
        WHERE request_id = NEW.request_id
          AND tenant_id = NEW.tenant_id
          AND organization_id = NEW.organization_id
          AND signature_type = 'CLIENT_INVOICE'
          AND signature_status = 'SIGNED';

        IF v_signed_count = 0 THEN
            RAISE EXCEPTION 'Dispatch cannot proceed to % status until Client Invoice Signature is completed and SIGNED for request %.', NEW.dispatch_status, NEW.request_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_dispatch_eligibility ON dispatches;
CREATE TRIGGER trigger_validate_dispatch_eligibility
BEFORE INSERT OR UPDATE ON dispatches
FOR EACH ROW
EXECUTE FUNCTION validate_dispatch_eligibility();

DROP TRIGGER IF EXISTS update_dispatches_updated_at ON dispatches;
CREATE TRIGGER update_dispatches_updated_at
BEFORE UPDATE ON dispatches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 29. DISPATCH ITEMS TABLE (STEP 7)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dispatch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dispatch_id UUID NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    request_item_id UUID NOT NULL REFERENCES request_items(id) ON DELETE CASCADE,
    item_master_id UUID REFERENCES item_masters(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_dispatch_items_updated_at ON dispatch_items;
CREATE TRIGGER update_dispatch_items_updated_at
BEFORE UPDATE ON dispatch_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 30. DELIVERIES TABLE, TRIGGERS & COMPLETION FUNCTION (STEP 7)
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS delivery_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES calibration_requests(id) ON DELETE CASCADE,
    dispatch_id UUID NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
    delivery_number VARCHAR(50) NOT NULL,
    delivery_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (delivery_status IN ('PENDING', 'IN_TRANSIT', 'CLIENT_RECEIVED', 'DELIVERY_SIGNED', 'FAILED', 'CANCELLED')),
    received_by_name VARCHAR(255),
    received_by_contact VARCHAR(100),
    delivery_remarks TEXT,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_org_delivery_num UNIQUE (tenant_id, organization_id, delivery_number)
);

CREATE OR REPLACE FUNCTION generate_delivery_number()
RETURNS TRIGGER AS $$
DECLARE
    v_seq_num BIGINT;
    v_year TEXT;
BEGIN
    IF NEW.delivery_number IS NULL OR NEW.delivery_number = '' THEN
        v_seq_num := nextval('delivery_seq');
        v_year := TO_CHAR(NOW(), 'YYYY');
        NEW.delivery_number := 'DEL-' || v_year || '-' || LPAD(v_seq_num::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_delivery_number ON deliveries;
CREATE TRIGGER trigger_generate_delivery_number
BEFORE INSERT ON deliveries
FOR EACH ROW
EXECUTE FUNCTION generate_delivery_number();

CREATE OR REPLACE FUNCTION validate_delivery_dispatch_match()
RETURNS TRIGGER AS $$
DECLARE
    v_dsp_req UUID;
    v_dsp_tenant UUID;
    v_dsp_org UUID;
BEGIN
    SELECT request_id, tenant_id, organization_id
    INTO v_dsp_req, v_dsp_tenant, v_dsp_org
    FROM dispatches
    WHERE id = NEW.dispatch_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced dispatch % does not exist.', NEW.dispatch_id;
    END IF;

    IF v_dsp_req != NEW.request_id THEN
        RAISE EXCEPTION 'Delivery request_id % does not match dispatch request_id %.', NEW.request_id, v_dsp_req;
    END IF;

    IF v_dsp_tenant != NEW.tenant_id OR v_dsp_org != NEW.organization_id THEN
        RAISE EXCEPTION 'Delivery tenant/organization does not match referenced dispatch.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_delivery_dispatch_match ON deliveries;
CREATE TRIGGER trigger_validate_delivery_dispatch_match
BEFORE INSERT OR UPDATE ON deliveries
FOR EACH ROW
EXECUTE FUNCTION validate_delivery_dispatch_match();

DROP TRIGGER IF EXISTS update_deliveries_updated_at ON deliveries;
CREATE TRIGGER update_deliveries_updated_at
BEFORE UPDATE ON deliveries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION complete_calibration_request(
    p_request_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_tenant_id UUID;
    v_org_id UUID;
    v_req_status VARCHAR(30);
    v_quot_approved INTEGER;
    v_invoice_sig_signed INTEGER;
    v_dispatch_completed INTEGER;
    v_delivery_received INTEGER;
    v_delivery_sig_signed INTEGER;
BEGIN
    SELECT tenant_id, organization_id, status
    INTO v_tenant_id, v_org_id, v_req_status
    FROM calibration_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Calibration Request % not found.', p_request_id;
    END IF;

    SELECT COUNT(*) INTO v_quot_approved
    FROM quotations
    WHERE request_id = p_request_id AND quotation_status = 'APPROVED';
    IF v_quot_approved = 0 THEN
        RAISE EXCEPTION 'Cannot complete request: No APPROVED quotation found for request %.', p_request_id;
    END IF;

    SELECT COUNT(*) INTO v_invoice_sig_signed
    FROM signatures
    WHERE request_id = p_request_id AND signature_type = 'CLIENT_INVOICE' AND signature_status = 'SIGNED';
    IF v_invoice_sig_signed = 0 THEN
        RAISE EXCEPTION 'Cannot complete request: Client Invoice Signature is missing or not SIGNED for request %.', p_request_id;
    END IF;

    SELECT COUNT(*) INTO v_dispatch_completed
    FROM dispatches
    WHERE request_id = p_request_id AND dispatch_status IN ('DISPATCHED', 'IN_TRANSIT', 'DELIVERED');
    IF v_dispatch_completed = 0 THEN
        RAISE EXCEPTION 'Cannot complete request: Dispatch is incomplete or missing for request %.', p_request_id;
    END IF;

    SELECT COUNT(*) INTO v_delivery_received
    FROM deliveries
    WHERE request_id = p_request_id AND delivery_status IN ('CLIENT_RECEIVED', 'DELIVERY_SIGNED');
    IF v_delivery_received = 0 THEN
        RAISE EXCEPTION 'Cannot complete request: Delivery record is not CLIENT_RECEIVED or DELIVERY_SIGNED for request %.', p_request_id;
    END IF;

    SELECT COUNT(*) INTO v_delivery_sig_signed
    FROM signatures
    WHERE request_id = p_request_id AND signature_type = 'CLIENT_DELIVERY' AND signature_status = 'SIGNED';
    IF v_delivery_sig_signed = 0 THEN
        RAISE EXCEPTION 'Cannot complete request: Delivery Signature is missing or not SIGNED for request %.', p_request_id;
    END IF;

    UPDATE calibration_requests
    SET status = 'COMPLETED',
        updated_at = NOW()
    WHERE id = p_request_id;

    INSERT INTO audit_logs (
        tenant_id, organization_id, user_id, action, entity_type, entity_id, new_data
    ) VALUES (
        v_tenant_id, v_org_id, p_user_id, 'REQUEST_MARKED_COMPLETED', 'calibration_requests', p_request_id,
        jsonb_build_object('request_id', p_request_id, 'status', 'COMPLETED', 'completed_at', NOW())
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 31. STEP 7 INDEXES & RLS POLICIES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_signatures_tenant ON signatures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_signatures_tenant_org ON signatures(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_signatures_tenant_request ON signatures(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_signatures_tenant_type ON signatures(tenant_id, signature_type);
CREATE INDEX IF NOT EXISTS idx_signatures_tenant_status ON signatures(tenant_id, signature_status);

CREATE INDEX IF NOT EXISTS idx_dispatches_tenant ON dispatches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_tenant_org ON dispatches(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_tenant_request ON dispatches(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_tenant_status ON dispatches(tenant_id, dispatch_status);
CREATE INDEX IF NOT EXISTS idx_dispatches_tenant_number ON dispatches(tenant_id, dispatch_number);
CREATE INDEX IF NOT EXISTS idx_dispatches_tenant_tracking ON dispatches(tenant_id, tracking_number);

CREATE INDEX IF NOT EXISTS idx_dispatch_items_tenant ON dispatch_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_items_tenant_org ON dispatch_items(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_items_tenant_dispatch ON dispatch_items(tenant_id, dispatch_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_items_tenant_request ON dispatch_items(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_items_tenant_req_item ON dispatch_items(tenant_id, request_item_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_tenant ON deliveries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_org ON deliveries(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_request ON deliveries(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_dispatch ON deliveries(tenant_id, dispatch_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_status ON deliveries(tenant_id, delivery_status);
CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_number ON deliveries(tenant_id, delivery_number);

ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS signatures_isolation_policy ON signatures;
CREATE POLICY signatures_isolation_policy ON signatures FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS dispatches_isolation_policy ON dispatches;
CREATE POLICY dispatches_isolation_policy ON dispatches FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS dispatch_items_isolation_policy ON dispatch_items;
CREATE POLICY dispatch_items_isolation_policy ON dispatch_items FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

DROP POLICY IF EXISTS deliveries_isolation_policy ON deliveries;
CREATE POLICY deliveries_isolation_policy ON deliveries FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

-- STEP 9: DOCUMENTS TABLE, PERMISSIONS, INDEXES & RLS
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_id UUID REFERENCES calibration_requests(id) ON DELETE SET NULL,
    request_item_id UUID REFERENCES request_items(id) ON DELETE SET NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'VERIFICATION_PROOF', 'CALIBRATION_DOCUMENT', 'CALIBRATION_CERTIFICATE',
        'QUOTATION_DOCUMENT', 'APPROVAL_DOCUMENT', 'INVOICE_DOCUMENT',
        'PURCHASE_ORDER_DOCUMENT', 'CLIENT_SIGNATURE', 'DISPATCH_DOCUMENT',
        'DELIVERY_DOCUMENT', 'OTHER'
    )),
    file_name VARCHAR(255) NOT NULL,
    file_extension VARCHAR(20),
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    storage_provider VARCHAR(50) NOT NULL DEFAULT 'CLOUDFLARE_R2',
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'ccm-documents',
    storage_key TEXT NOT NULL,
    document_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (document_status IN (
        'UPLOADING', 'UPLOADED', 'ACTIVE', 'REPLACED', 'ARCHIVED', 'DELETED'
    )),
    uploaded_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    is_current BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_org ON documents(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_request ON documents(tenant_id, request_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_req_item ON documents(tenant_id, request_item_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_type ON documents(tenant_id, document_type);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_status ON documents(tenant_id, document_status);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_created ON documents(tenant_id, created_at DESC);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documents_isolation_policy ON documents;
CREATE POLICY documents_isolation_policy ON documents FOR ALL USING (
    tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id()
);

-- STEP 10: PDF GENERATION PERMISSIONS
DO $$
DECLARE
    v_admin_role_id UUID;
    v_lab_role_id UUID;
    v_comm_role_id UUID;
BEGIN
    INSERT INTO permissions (code, name, description, module) VALUES
    ('CERTIFICATE_GENERATE', 'Generate Calibration Certificate PDF', 'Allows generating official PDF certificates from calibration records', 'Documents'),
    ('QUOTATION_PDF_GENERATE', 'Generate Quotation PDF', 'Allows generating PDF document for approved quotations', 'Documents'),
    ('INVOICE_PDF_GENERATE', 'Generate Invoice PDF', 'Allows generating PDF document for issued invoices', 'Documents'),
    ('PURCHASE_ORDER_PDF_GENERATE', 'Generate Purchase Order PDF', 'Allows generating PDF document for client purchase orders', 'Documents'),
    ('DOCUMENT_GENERATE', 'Generate All Business Documents', 'Full administrative authority to generate all document PDFs', 'Documents')
    ON CONFLICT (code) DO NOTHING;

    SELECT id INTO v_admin_role_id FROM roles WHERE code = 'ADMIN' LIMIT 1;
    IF v_admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT v_admin_role_id, id FROM permissions WHERE code IN (
            'CERTIFICATE_GENERATE', 'QUOTATION_PDF_GENERATE', 'INVOICE_PDF_GENERATE', 'PURCHASE_ORDER_PDF_GENERATE', 'DOCUMENT_GENERATE'
        )
        ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO v_lab_role_id FROM roles WHERE code = 'LAB_USER' LIMIT 1;
    IF v_lab_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT v_lab_role_id, id FROM permissions WHERE code IN ('CERTIFICATE_GENERATE')
        ON CONFLICT DO NOTHING;
    END IF;

    SELECT id INTO v_comm_role_id FROM roles WHERE code = 'COMMERCIAL_USER' LIMIT 1;
    IF v_comm_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT v_comm_role_id, id FROM permissions WHERE code IN ('QUOTATION_PDF_GENERATE', 'INVOICE_PDF_GENERATE', 'PURCHASE_ORDER_PDF_GENERATE')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;






-- ====================================
-- 059_create_async_jobs.sql
-- ====================================
-- Migration 059: Create async_jobs Table

CREATE TABLE IF NOT EXISTS async_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_type VARCHAR(100) NOT NULL CHECK (job_type IN (
        'GENERATE_CALIBRATION_CERTIFICATE',
        'GENERATE_QUOTATION_PDF',
        'GENERATE_INVOICE_PDF',
        'GENERATE_PURCHASE_ORDER_PDF'
    )),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
        'CERTIFICATE',
        'QUOTATION',
        'INVOICE',
        'PURCHASE_ORDER'
    )),
    entity_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED' CHECK (status IN (
        'QUEUED',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'CANCELLED'
    )),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
    requested_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_code VARCHAR(100),
    error_message TEXT,
    result_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_async_jobs_updated_at ON async_jobs;
CREATE TRIGGER update_async_jobs_updated_at
BEFORE UPDATE ON async_jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();



-- ====================================
-- 060_create_step11_permissions.sql
-- ====================================
-- Migration 060: Step 11 Permissions for Async Jobs & Background Workflows

DO $$
DECLARE
    v_admin_role_id UUID;
    v_lab_role_id UUID;
    v_comm_role_id UUID;
BEGIN
    -- 1. Register Async Job Permissions
    INSERT INTO permissions (code, name, description, module) VALUES
    ('ASYNC_JOB_VIEW', 'View Async Jobs', 'Allows viewing status and details of background async processing jobs', 'AsyncProcessing'),
    ('ASYNC_JOB_CANCEL', 'Cancel Async Job', 'Allows cancelling queued background jobs', 'AsyncProcessing'),
    ('ASYNC_JOB_RETRY', 'Retry Async Job', 'Allows retrying failed background jobs', 'AsyncProcessing'),
    ('ASYNC_JOB_MANAGE', 'Manage Async Jobs', 'Full administrative control over background job queues and workflows', 'AsyncProcessing')
    ON CONFLICT (code) DO NOTHING;

    -- 2. Map Permissions to Admin Role
    SELECT id INTO v_admin_role_id FROM roles WHERE code = 'ADMIN' LIMIT 1;
    IF v_admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT v_admin_role_id, id FROM permissions WHERE code IN (
            'ASYNC_JOB_VIEW', 'ASYNC_JOB_CANCEL', 'ASYNC_JOB_RETRY', 'ASYNC_JOB_MANAGE'
        )
        ON CONFLICT DO NOTHING;
    END IF;

    -- 3. Map Permissions to Lab Role
    SELECT id INTO v_lab_role_id FROM roles WHERE code = 'LAB_USER' LIMIT 1;
    IF v_lab_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT v_lab_role_id, id FROM permissions WHERE code IN ('ASYNC_JOB_VIEW', 'ASYNC_JOB_RETRY')
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4. Map Permissions to Commercial Role
    SELECT id INTO v_comm_role_id FROM roles WHERE code = 'COMMERCIAL_USER' LIMIT 1;
    IF v_comm_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT v_comm_role_id, id FROM permissions WHERE code IN ('ASYNC_JOB_VIEW', 'ASYNC_JOB_CANCEL', 'ASYNC_JOB_RETRY')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;



-- ====================================
-- 061_create_step11_indexes.sql
-- ====================================
-- Migration 061: Indexes for Async Jobs Table

CREATE INDEX IF NOT EXISTS idx_async_jobs_tenant_org ON async_jobs (tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_async_jobs_status ON async_jobs (status);
CREATE INDEX IF NOT EXISTS idx_async_jobs_type ON async_jobs (job_type);
CREATE INDEX IF NOT EXISTS idx_async_jobs_entity ON async_jobs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_async_jobs_created_at ON async_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_async_jobs_requested_by ON async_jobs (requested_by);



-- ====================================
-- 062_create_step11_rls.sql
-- ====================================
-- Migration 062: Row Level Security (RLS) for Async Jobs Table

ALTER TABLE async_jobs ENABLE ROW LEVEL SECURITY;

-- 1. Select Policy: Users can view async jobs in their tenant and organization
DROP POLICY IF EXISTS async_jobs_select_policy ON async_jobs;
CREATE POLICY async_jobs_select_policy ON async_jobs
    FOR SELECT
    USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::uuid
        AND organization_id = (current_setting('app.current_organization_id', true))::uuid
    );

-- 2. Insert Policy: Users can create async jobs in their tenant and organization
DROP POLICY IF EXISTS async_jobs_insert_policy ON async_jobs;
CREATE POLICY async_jobs_insert_policy ON async_jobs
    FOR INSERT
    WITH CHECK (
        tenant_id = (current_setting('app.current_tenant_id', true))::uuid
        AND organization_id = (current_setting('app.current_organization_id', true))::uuid
    );

-- 3. Update Policy: Users can update async jobs in their tenant and organization
DROP POLICY IF EXISTS async_jobs_update_policy ON async_jobs;
CREATE POLICY async_jobs_update_policy ON async_jobs
    FOR UPDATE
    USING (
        tenant_id = (current_setting('app.current_tenant_id', true))::uuid
        AND organization_id = (current_setting('app.current_organization_id', true))::uuid
    );

