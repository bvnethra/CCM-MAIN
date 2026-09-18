-- =============================================================================
-- Migration 064: Enable Multi-Tenant Row Level Security (RLS)
-- Task 76: Multi-Tenant RLS Hardening for All Application Tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SECURITY DEFINER CONTEXT & RBAC HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Helper: Check if current authenticated caller has platform Super Administrator privileges
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check JWT metadata claims
    IF (COALESCE(auth.jwt() ->> 'role', '') = 'super_admin' OR 
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('SUPER_ADMIN', 'super_admin') OR
        COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') IN ('SUPER_ADMIN', 'super_admin')) THEN
        RETURN TRUE;
    END IF;

    -- Check database user_profiles -> user_roles -> roles
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

-- Helper: Get current user's assigned tenant_id
CREATE OR REPLACE FUNCTION current_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: Get current user's assigned organization_id
CREATE OR REPLACE FUNCTION current_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: Get current user's user_profiles.id
CREATE OR REPLACE FUNCTION current_user_profile_id()
RETURNS UUID AS $$
    SELECT id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: Check if user holds a specific canonical permission code
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

-- -----------------------------------------------------------------------------
-- 2. ENABLE & FORCE RLS ON ALL TABLES
-- -----------------------------------------------------------------------------
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

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE async_jobs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. CORE IDENTITY & MULTI-TENANT POLICIES (WITH CHECK BARRIERS)
-- -----------------------------------------------------------------------------

-- 3.1 Tenants Policy
DROP POLICY IF EXISTS tenants_isolation_policy ON tenants;
CREATE POLICY tenants_isolation_policy ON tenants
    FOR ALL 
    USING (id = current_user_tenant_id() OR is_super_admin())
    WITH CHECK (is_super_admin());

-- 3.2 Organizations Policy
DROP POLICY IF EXISTS organizations_isolation_policy ON organizations;
CREATE POLICY organizations_isolation_policy ON organizations
    FOR ALL 
    USING (tenant_id = current_user_tenant_id() OR is_super_admin())
    WITH CHECK (tenant_id = current_user_tenant_id() OR is_super_admin());

-- 3.3 User Profiles Policy
DROP POLICY IF EXISTS user_profiles_isolation_policy ON user_profiles;
CREATE POLICY user_profiles_isolation_policy ON user_profiles
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
        OR auth_user_id = auth.uid()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- 3.4 Roles Policy
DROP POLICY IF EXISTS roles_isolation_policy ON roles;
CREATE POLICY roles_isolation_policy ON roles
    FOR ALL 
    USING (tenant_id = current_user_tenant_id() OR is_super_admin())
    WITH CHECK (tenant_id = current_user_tenant_id() OR is_super_admin());

-- 3.5 Permissions Catalog Policy (Readable by authenticated, manageable by Super Admin)
DROP POLICY IF EXISTS permissions_read_policy ON permissions;
CREATE POLICY permissions_read_policy ON permissions
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS permissions_admin_policy ON permissions;
CREATE POLICY permissions_admin_policy ON permissions
    FOR ALL TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- 3.6 User Roles Policy
DROP POLICY IF EXISTS user_roles_isolation_policy ON user_roles;
CREATE POLICY user_roles_isolation_policy ON user_roles
    FOR ALL 
    USING (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE tenant_id = current_user_tenant_id()
        )
        OR is_super_admin()
    )
    WITH CHECK (
        user_id IN (
            SELECT id FROM user_profiles 
            WHERE tenant_id = current_user_tenant_id()
        )
        OR is_super_admin()
    );

-- 3.7 Role Permissions Policy
DROP POLICY IF EXISTS role_permissions_isolation_policy ON role_permissions;
CREATE POLICY role_permissions_isolation_policy ON role_permissions
    FOR ALL 
    USING (
        role_id IN (
            SELECT id FROM roles 
            WHERE tenant_id = current_user_tenant_id()
        )
        OR is_super_admin()
    )
    WITH CHECK (
        role_id IN (
            SELECT id FROM roles 
            WHERE tenant_id = current_user_tenant_id()
        )
        OR is_super_admin()
    );

-- -----------------------------------------------------------------------------
-- 4. MASTER DATA POLICIES
-- -----------------------------------------------------------------------------

-- Clients
DROP POLICY IF EXISTS clients_isolation_policy ON clients;
CREATE POLICY clients_isolation_policy ON clients
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Vendors
DROP POLICY IF EXISTS vendors_isolation_policy ON vendors;
CREATE POLICY vendors_isolation_policy ON vendors
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Item Masters
DROP POLICY IF EXISTS item_masters_isolation_policy ON item_masters;
CREATE POLICY item_masters_isolation_policy ON item_masters
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Audit Logs
DROP POLICY IF EXISTS audit_logs_isolation_policy ON audit_logs;
CREATE POLICY audit_logs_isolation_policy ON audit_logs
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- -----------------------------------------------------------------------------
-- 5. CALIBRATION & LAB EXECUTION POLICIES
-- -----------------------------------------------------------------------------

-- Calibration Requests
DROP POLICY IF EXISTS calibration_requests_isolation_policy ON calibration_requests;
CREATE POLICY calibration_requests_isolation_policy ON calibration_requests
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Request Items
DROP POLICY IF EXISTS request_items_isolation_policy ON request_items;
CREATE POLICY request_items_isolation_policy ON request_items
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Lab Verifications
DROP POLICY IF EXISTS verifications_isolation_policy ON verifications;
CREATE POLICY verifications_isolation_policy ON verifications
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Calibrations
DROP POLICY IF EXISTS calibrations_isolation_policy ON calibrations;
CREATE POLICY calibrations_isolation_policy ON calibrations
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Calibration Measurements
DROP POLICY IF EXISTS calibration_measurements_isolation_policy ON calibration_measurements;
CREATE POLICY calibration_measurements_isolation_policy ON calibration_measurements
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Certificates
DROP POLICY IF EXISTS certificates_isolation_policy ON certificates;
CREATE POLICY certificates_isolation_policy ON certificates
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Faulty Services
DROP POLICY IF EXISTS faulty_services_isolation_policy ON faulty_services;
CREATE POLICY faulty_services_isolation_policy ON faulty_services
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Vendor Outsourcing
DROP POLICY IF EXISTS vendor_outsourcing_isolation_policy ON vendor_outsourcing;
CREATE POLICY vendor_outsourcing_isolation_policy ON vendor_outsourcing
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- -----------------------------------------------------------------------------
-- 6. COMMERCIAL & FINANCIAL POLICIES
-- -----------------------------------------------------------------------------

-- Quotations
DROP POLICY IF EXISTS quotations_isolation_policy ON quotations;
CREATE POLICY quotations_isolation_policy ON quotations
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Quotation Items
DROP POLICY IF EXISTS quotation_items_isolation_policy ON quotation_items;
CREATE POLICY quotation_items_isolation_policy ON quotation_items
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Approvals
DROP POLICY IF EXISTS approvals_isolation_policy ON approvals;
CREATE POLICY approvals_isolation_policy ON approvals
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Invoices
DROP POLICY IF EXISTS invoices_isolation_policy ON invoices;
CREATE POLICY invoices_isolation_policy ON invoices
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Invoice Items
DROP POLICY IF EXISTS invoice_items_isolation_policy ON invoice_items;
CREATE POLICY invoice_items_isolation_policy ON invoice_items
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Purchase Orders
DROP POLICY IF EXISTS purchase_orders_isolation_policy ON purchase_orders;
CREATE POLICY purchase_orders_isolation_policy ON purchase_orders
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Purchase Order Items
DROP POLICY IF EXISTS po_items_isolation_policy ON po_items;
CREATE POLICY po_items_isolation_policy ON po_items
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- -----------------------------------------------------------------------------
-- 7. LOGISTICS, SIGNATURES, DOCUMENTS & JOBS
-- -----------------------------------------------------------------------------

-- Digital Signatures
DROP POLICY IF EXISTS signatures_isolation_policy ON signatures;
CREATE POLICY signatures_isolation_policy ON signatures
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Dispatches
DROP POLICY IF EXISTS dispatches_isolation_policy ON dispatches;
CREATE POLICY dispatches_isolation_policy ON dispatches
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Dispatch Items
DROP POLICY IF EXISTS dispatch_items_isolation_policy ON dispatch_items;
CREATE POLICY dispatch_items_isolation_policy ON dispatch_items
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Deliveries
DROP POLICY IF EXISTS deliveries_isolation_policy ON deliveries;
CREATE POLICY deliveries_isolation_policy ON deliveries
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Documents
DROP POLICY IF EXISTS documents_isolation_policy ON documents;
CREATE POLICY documents_isolation_policy ON documents
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );

-- Async Jobs
DROP POLICY IF EXISTS async_jobs_isolation_policy ON async_jobs;
CREATE POLICY async_jobs_isolation_policy ON async_jobs
    FOR ALL 
    USING (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    )
    WITH CHECK (
        (tenant_id = current_user_tenant_id() AND organization_id = current_user_organization_id())
        OR is_super_admin()
    );
