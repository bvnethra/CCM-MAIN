import { Organization, OrganizationFormData } from '../types/organization';
import { mockStore } from '../mock/initialStore';
import { apiClient } from '../lib/api/apiClient';

export const organizationService = {
  async getAll(tenantId?: string): Promise<Organization[]> {
    try {
      const res = await apiClient.get('/api/master/organizations');
      if (res && res.success && Array.isArray(res.data)) {
        let orgs = res.data.map((o: any) => ({
          id: o.id,
          tenantId: o.tenant_id || o.tenantId || '00000000-0000-0000-0000-000000000001',
          companyName: o.companyName || o.name || 'Organization',
          companyCode: o.companyCode || o.code || 'ORG-001',
          companyType: o.companyType || 'Private Limited',
          businessType: o.businessType || 'Calibration',
          registrationNumber: o.registrationNumber || '',
          gstNumber: o.gstNumber || '',
          companyEmail: o.companyEmail || o.email || '',
          companyPhone: o.companyPhone || o.phone || '',
          addressLine1: o.addressLine1 || '',
          addressLine2: o.addressLine2 || '',
          city: o.city || 'Bangalore',
          state: o.state || 'Karnataka',
          country: o.country || 'India',
          pincode: o.pincode || '',
          timezone: o.timezone || 'Asia/Kolkata (IST)',
          currency: o.currency || 'INR (₹)',
          numberOfBranches: Number(o.numberOfBranches) || 1,
          numberOfWarehouses: Number(o.numberOfWarehouses) || 1,
          msmeNumber: o.msmeNumber || '',
          adminName: o.adminName || '',
          adminEmail: o.adminEmail || '',
          status: o.status || 'ACTIVE',
          createdDate: o.created_at?.split('T')[0] || o.createdDate || new Date().toISOString().split('T')[0],
          usersCount: o.usersCount || 0,
        }));
        if (tenantId) {
          orgs = orgs.filter((o: Organization) => o.tenantId === tenantId);
        }
        return orgs;
      }
    } catch (err) {
      console.warn('organizationService.getAll API warning:', err);
    }

    // Ensure every existing Tenant has an automatically provisioned Organization
    mockStore.data.tenants.forEach((t) => {
      const exists = mockStore.data.organizations.some((o) => o.tenantId === t.id);
      if (!exists) {
        mockStore.data.organizations.unshift({
          id: `org-auto-${t.id}`,
          tenantId: t.id,
          companyName: `${t.name} Organization`,
          companyCode: `${t.code}-ORG`,
          companyType: 'Private Limited',
          businessType: 'Calibration',
          registrationNumber: t.registrationNumber || '',
          gstNumber: t.gstNumber || '',
          companyEmail: t.contactEmail || '',
          companyPhone: t.contactPhone || '',
          addressLine1: t.addressLine1 || '',
          addressLine2: t.addressLine2 || '',
          city: t.city || 'Bangalore',
          state: t.state || 'Karnataka',
          country: t.country || 'India',
          pincode: t.pincode || '',
          timezone: t.timezone || 'Asia/Kolkata (IST)',
          currency: t.currency || 'INR (₹)',
          numberOfBranches: t.numberOfBranches || 1,
          numberOfWarehouses: 1,
          adminName: t.adminName || '',
          adminEmail: t.adminEmail || '',
          status: t.status === 'SUSPENDED' ? 'INACTIVE' : (t.status as any) || 'ACTIVE',
          createdDate: t.createdDate || new Date().toISOString().split('T')[0],
          usersCount: t.usersCount || 1,
        });
      }
    });

    if (tenantId) {
      return mockStore.data.organizations.filter((o) => o.tenantId === tenantId);
    }
    return [...mockStore.data.organizations];
  },

  async getById(id: string): Promise<Organization | null> {
    const list = await this.getAll();
    const org = list.find((o) => o.id === id);
    return org ? { ...org } : null;
  },

  async create(data: OrganizationFormData): Promise<Organization> {
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      tenantId: data.tenantId,
      companyName: data.companyName,
      companyCode: data.companyCode.toUpperCase(),
      companyType: data.companyType,
      businessType: data.businessType,
      registrationNumber: data.registrationNumber,
      gstNumber: data.gstNumber,
      companyEmail: data.companyEmail,
      companyPhone: data.companyPhone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      country: data.country,
      pincode: data.pincode,
      timezone: data.timezone,
      currency: data.currency,
      numberOfBranches: Number(data.numberOfBranches) || 1,
      numberOfWarehouses: Number(data.numberOfWarehouses) || 1,
      msmeNumber: data.msmeNumber,
      adminName: data.adminName,
      adminEmail: data.adminEmail,
      adminDesignation: data.adminDesignation || 'Facility Administrator',
      status: 'ACTIVE',
      createdDate: new Date().toISOString().split('T')[0],
      usersCount: 1,
    };
    mockStore.data.organizations.unshift(newOrg);
    mockStore.save();
    return newOrg;
  },

  async update(id: string, data: Partial<OrganizationFormData>): Promise<Organization> {
    const index = mockStore.data.organizations.findIndex((o) => o.id === id);
    if (index !== -1) {
      const updated: Organization = {
        ...mockStore.data.organizations[index],
        ...data,
      };
      mockStore.data.organizations[index] = updated;
      mockStore.save();
      return updated;
    }
    throw new Error('Organization not found');
  },

  async toggleStatus(id: string): Promise<Organization> {
    const index = mockStore.data.organizations.findIndex((o) => o.id === id);
    if (index !== -1) {
      const current = mockStore.data.organizations[index];
      const updated: Organization = {
        ...current,
        status: current.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      };
      mockStore.data.organizations[index] = updated;
      mockStore.save();
      return updated;
    }
    throw new Error('Organization not found');
  },

  async delete(id: string): Promise<void> {
    mockStore.data.organizations = mockStore.data.organizations.filter((o) => o.id !== id);
    mockStore.save();
  },
};
