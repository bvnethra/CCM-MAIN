import { Tenant, TenantFormData } from '../types/tenant';
import { mockStore } from '../mock/initialStore';
import { apiClient } from '../lib/api/apiClient';

export const tenantService = {
  async getAll(): Promise<Tenant[]> {
    try {
      const res = await apiClient.get('/api/master/tenants');
      if (res && res.success && Array.isArray(res.data)) {
        return res.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          code: t.code,
          tenantType: t.tenantType || 'Enterprise',
          registrationNumber: t.registrationNumber || '',
          gstNumber: t.gstNumber || '',
          contactEmail: t.contactEmail || t.contact_email || '',
          contactPhone: t.contactPhone || t.contact_phone || '',
          addressLine1: t.addressLine1 || '',
          addressLine2: t.addressLine2 || '',
          city: t.city || 'Bangalore',
          state: t.state || 'Karnataka',
          country: t.country || 'India',
          pincode: t.pincode || '',
          timezone: t.timezone || 'Asia/Kolkata (IST)',
          currency: t.currency || 'INR (₹)',
          numberOfBranches: Number(t.numberOfBranches) || 1,
          adminName: t.adminName || '',
          adminEmail: t.adminEmail || '',
          status: t.status || 'ACTIVE',
          organizationsCount: t.organizationsCount || 0,
          usersCount: t.usersCount || 0,
          createdDate: t.created_at?.split('T')[0] || t.createdDate || new Date().toISOString().split('T')[0],
          updatedDate: t.updated_at?.split('T')[0] || t.updatedDate || new Date().toISOString().split('T')[0],
          description: t.description || '',
        }));
      }
    } catch (err) {
      console.warn('tenantService.getAll API warning:', err);
    }
    return [...mockStore.data.tenants];
  },

  async getById(id: string): Promise<Tenant | null> {
    const list = await this.getAll();
    const tenant = list.find((item) => item.id === id || item.code === id);
    if (!tenant) return null;
    const orgCount = mockStore.data.organizations.filter((o) => o.tenantId === tenant.id || o.tenantId === tenant.code).length;
    return {
      ...tenant,
      organizationsCount: orgCount,
    };
  },

  async create(data: TenantFormData): Promise<Tenant> {
    const newTenantId = `ten-${Date.now()}`;
    const newTenant: Tenant = {
      id: newTenantId,
      name: data.name,
      code: data.code.toUpperCase(),
      tenantType: data.tenantType || 'Enterprise',
      registrationNumber: data.registrationNumber || '',
      gstNumber: data.gstNumber ? data.gstNumber.toUpperCase() : '',
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      addressLine1: data.addressLine1 || '',
      addressLine2: data.addressLine2 || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || 'India',
      pincode: data.pincode || '',
      timezone: data.timezone || 'Asia/Kolkata (IST)',
      currency: data.currency || 'INR (₹)',
      numberOfBranches: Number(data.numberOfBranches) || 1,
      adminName: data.adminName || '',
      adminEmail: data.adminEmail || '',
      adminDesignation: data.adminDesignation || 'Super Administrator',
      status: 'ACTIVE',
      organizationsCount: 1,
      usersCount: 1,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      description: data.description || '',
    };
    mockStore.data.tenants.unshift(newTenant);

    const orgsToProvision = (data.organizations && data.organizations.length > 0)
      ? data.organizations
      : [
          {
            companyName: `${newTenant.name} Organization`,
            companyCode: `${newTenant.code}-ORG`,
            companyType: 'Private Limited',
            businessType: 'Calibration',
            registrationNumber: newTenant.registrationNumber,
            gstNumber: newTenant.gstNumber,
            companyEmail: newTenant.contactEmail,
            companyPhone: newTenant.contactPhone,
            addressLine1: newTenant.addressLine1 || 'Main Facility Campus',
            addressLine2: newTenant.addressLine2,
            city: newTenant.city || 'Bangalore',
            state: newTenant.state || 'Karnataka',
            country: newTenant.country || 'India',
            pincode: newTenant.pincode || '560001',
            timezone: newTenant.timezone || 'Asia/Kolkata (IST)',
            currency: newTenant.currency || 'INR (₹)',
            numberOfBranches: Number(newTenant.numberOfBranches) || 1,
            numberOfWarehouses: 1,
            adminName: newTenant.adminName || 'Admin',
            adminEmail: newTenant.adminEmail || newTenant.contactEmail,
            adminDesignation: 'Laboratory Director',
          },
        ];

    newTenant.organizationsCount = orgsToProvision.length;

    orgsToProvision.forEach((orgItem, idx) => {
      const orgObj = {
        id: `org-${Date.now()}-${idx}`,
        tenantId: newTenant.id,
        companyName: orgItem.companyName || `${newTenant.name} Org ${idx + 1}`,
        companyCode: (orgItem.companyCode || `${newTenant.code}-ORG${idx + 1}`).toUpperCase(),
        companyType: orgItem.companyType || 'Private Limited',
        businessType: orgItem.businessType || 'Calibration',
        registrationNumber: orgItem.registrationNumber || newTenant.registrationNumber || '',
        gstNumber: orgItem.gstNumber || newTenant.gstNumber || '',
        companyEmail: orgItem.companyEmail || newTenant.contactEmail,
        companyPhone: orgItem.companyPhone || newTenant.contactPhone,
        addressLine1: orgItem.addressLine1 || newTenant.addressLine1 || '',
        addressLine2: orgItem.addressLine2 || '',
        city: orgItem.city || newTenant.city || 'Bangalore',
        state: orgItem.state || newTenant.state || 'Karnataka',
        country: orgItem.country || newTenant.country || 'India',
        pincode: orgItem.pincode || newTenant.pincode || '',
        timezone: orgItem.timezone || newTenant.timezone || 'Asia/Kolkata (IST)',
        currency: orgItem.currency || newTenant.currency || 'INR (₹)',
        numberOfBranches: Number(orgItem.numberOfBranches) || 1,
        numberOfWarehouses: Number(orgItem.numberOfWarehouses) || 1,
        adminName: orgItem.adminName || newTenant.adminName || 'Admin',
        adminEmail: orgItem.adminEmail || newTenant.adminEmail || newTenant.contactEmail,
        adminDesignation: orgItem.adminDesignation || 'Facility Administrator',
        status: 'ACTIVE' as const,
        createdDate: new Date().toISOString().split('T')[0],
        usersCount: 1,
      };
      mockStore.data.organizations.unshift(orgObj);
    });

    // Audit log for tenant provisioning
    mockStore.data.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      userId: 'usr-001',
      userName: 'Super Administrator',
      role: 'Super Admin',
      tenantId: newTenant.id,
      organizationId: orgsToProvision[0]?.companyCode || 'ALL',
      module: 'tenant',
      action: 'tenant_created',
      recordId: newTenant.id,
      recordIdentifier: newTenant.code,
      oldValue: 'None',
      newValue: `Provisioned enterprise tenant ${newTenant.name} (${newTenant.code}) with ${orgsToProvision.length} organization(s)`,
      ipAddress: '127.0.0.1',
      result: 'SUCCESS',
    });

    mockStore.save();
    return newTenant;
  },

  async update(id: string, data: Partial<TenantFormData>): Promise<Tenant> {
    const index = mockStore.data.tenants.findIndex((t) => t.id === id);
    if (index !== -1) {
      const updated: Tenant = {
        ...mockStore.data.tenants[index],
        ...data,
        updatedDate: new Date().toISOString().split('T')[0],
      };
      mockStore.data.tenants[index] = updated;

      // Automatically sync corresponding Organization
      const orgIdx = mockStore.data.organizations.findIndex((o) => o.tenantId === id);
      if (orgIdx !== -1) {
        mockStore.data.organizations[orgIdx] = {
          ...mockStore.data.organizations[orgIdx],
          companyName: data.name ? `${data.name} Organization` : mockStore.data.organizations[orgIdx].companyName,
          companyEmail: data.contactEmail || mockStore.data.organizations[orgIdx].companyEmail,
          companyPhone: data.contactPhone || mockStore.data.organizations[orgIdx].companyPhone,
          addressLine1: data.addressLine1 || mockStore.data.organizations[orgIdx].addressLine1,
          city: data.city || mockStore.data.organizations[orgIdx].city,
          state: data.state || mockStore.data.organizations[orgIdx].state,
          pincode: data.pincode || mockStore.data.organizations[orgIdx].pincode,
          status: (data.status as any) || mockStore.data.organizations[orgIdx].status,
        };
      }

      mockStore.save();
      return updated;
    }
    throw new Error('Tenant not found');
  },

  async delete(id: string): Promise<void> {
    mockStore.data.tenants = mockStore.data.tenants.filter((t) => t.id !== id);
    mockStore.data.organizations = mockStore.data.organizations.filter((o) => o.tenantId !== id);
    mockStore.save();
  },
};
