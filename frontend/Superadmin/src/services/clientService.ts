import { Client, ClientFormData } from '../types/client';
import { Vendor, VendorFormData } from '../types/vendor';
import { Item, ItemFormData, ItemStatus } from '../types/item';
import { mockStore } from '../mock/initialStore';
import { apiClient } from '../lib/api/apiClient';

function parseList(res: any): any[] | null {
  if (!res || !res.success) return null;
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
}

export const clientService = {
  async getAll(): Promise<Client[]> {
    try {
      const res = await apiClient.get('/api/master/clients');
      const list = parseList(res);
      if (list !== null) {
        return list.map((c: any) => ({
          id: c.id,
          tenantId: c.tenant_id || c.tenantId || '00000000-0000-0000-0000-000000000001',
          organizationId: c.organization_id || c.organizationId || '00000000-0000-0000-0000-000000000001',
          clientName: c.clientName || c.name || 'Client',
          clientCode: c.clientCode || c.code || 'CLI-001',
          businessType: c.businessType || c.business_type || 'Manufacturing',
          gstNumber: c.gstNumber || c.gstin || '',
          contactPersonName: c.contactPersonName || c.contactPerson || c.contact_person || 'Contact',
          contactPersonContactNumber: c.contactPersonContactNumber || c.phone || '',
          email: c.email || '',
          phone: c.phone || c.phoneNumber || '',
          phoneNumber: c.phoneNumber || c.phone || '',
          address: c.address || '',
          city: c.city || 'Bangalore',
          state: c.state || 'Karnataka',
          country: c.country || 'India',
          pincode: c.pincode || '560001',
          currency: c.currency || 'INR',
          numberOfBranches: Number(c.numberOfBranches) || 1,
          numberOfWarehouses: Number(c.numberOfWarehouses) || 1,
          onboardingDate: c.onboardingDate || c.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          accountStatus: (c.status === 'ACTIVE' || c.accountStatus === 'Active') ? 'Active' : 'Inactive',
          msmeNumber: c.msmeNumber || '',
          activeRequestsCount: c.activeRequestsCount || 0,
          createdAt: c.created_at || c.createdAt || new Date().toISOString().split('T')[0],
        }));
      }
    } catch (err) {
      console.warn('clientService.getAll API fetch warning:', err);
    }
    return [...mockStore.data.clients];
  },

  async getById(id: string): Promise<Client | null> {
    try {
      const res = await apiClient.get(`/api/master/clients/${id}`);
      if (res && res.success && res.data) {
        const c = res.data;
        return {
          id: c.id,
          tenantId: c.tenant_id || c.tenantId || '00000000-0000-0000-0000-000000000001',
          organizationId: c.organization_id || c.organizationId || '00000000-0000-0000-0000-000000000001',
          clientName: c.clientName || c.name,
          clientCode: c.clientCode || c.code,
          businessType: c.businessType || c.business_type || 'Manufacturing',
          gstNumber: c.gstNumber || c.gstin,
          contactPersonName: c.contactPersonName || c.contactPerson,
          contactPersonContactNumber: c.contactPersonContactNumber || c.phone,
          email: c.email,
          phone: c.phone || c.phoneNumber || '',
          phoneNumber: c.phoneNumber || c.phone,
          address: c.address,
          city: c.city || 'Bangalore',
          state: c.state || 'Karnataka',
          country: c.country || 'India',
          pincode: c.pincode || '560001',
          currency: c.currency || 'INR',
          numberOfBranches: Number(c.numberOfBranches) || 1,
          numberOfWarehouses: Number(c.numberOfWarehouses) || 1,
          onboardingDate: c.onboardingDate || c.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          accountStatus: (c.status === 'ACTIVE' || c.accountStatus === 'Active') ? 'Active' : 'Inactive',
          msmeNumber: c.msmeNumber,
          activeRequestsCount: c.activeRequestsCount || 0,
          createdAt: c.created_at || c.createdAt || new Date().toISOString().split('T')[0],
        };
      }
    } catch (err) {
      console.warn('clientService.getById API fetch warning:', err);
    }
    const client = mockStore.data.clients.find((c) => c.id === id);
    return client ? { ...client } : null;
  },

  async create(data: ClientFormData): Promise<Client> {
    try {
      const payload = {
        name: data.clientName,
        code: data.clientCode.toUpperCase(),
        contactPerson: data.contactPersonName,
        email: data.email || undefined,
        phone: data.phoneNumber || undefined,
        address: data.address || undefined,
        gstin: data.gstNumber || undefined,
        status: data.accountStatus === 'Active' ? 'ACTIVE' : 'INACTIVE'
      };
      const res = await apiClient.post('/api/master/clients', payload);
      if (res && res.success && res.data) {
        const c = res.data;
        const phoneVal = data.phone || data.phoneNumber || '';
        const newClient: Client = {
          id: c.id,
          tenantId: '00000000-0000-0000-0000-000000000001',
          organizationId: '00000000-0000-0000-0000-000000000001',
          clientName: c.name || data.clientName,
          clientCode: c.code || data.clientCode,
          businessType: data.businessType,
          gstNumber: data.gstNumber,
          contactPersonName: data.contactPersonName,
          contactPersonContactNumber: phoneVal,
          email: data.email,
          phone: phoneVal,
          phoneNumber: phoneVal,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          pincode: data.pincode,
          currency: data.currency,
          numberOfBranches: Number(data.numberOfBranches) || 1,
          numberOfWarehouses: Number(data.numberOfWarehouses) || 1,
          onboardingDate: data.onboardingDate || new Date().toISOString().split('T')[0],
          accountStatus: data.accountStatus || 'Active',
          msmeNumber: data.msmeNumber,
          activeRequestsCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
        };
        mockStore.data.clients.unshift(newClient);
        return newClient;
      }
    } catch (err) {
      console.warn('clientService.create API warning:', err);
    }
    const phoneVal = data.phone || data.phoneNumber || '';
    const newClient: Client = {
      id: `cli-${Date.now()}`,
      tenantId: '00000000-0000-0000-0000-000000000001',
      organizationId: '00000000-0000-0000-0000-000000000001',
      clientName: data.clientName,
      clientCode: data.clientCode.toUpperCase(),
      businessType: data.businessType,
      gstNumber: data.gstNumber,
      contactPersonName: data.contactPersonName,
      contactPersonContactNumber: phoneVal,
      email: data.email,
      phone: phoneVal,
      phoneNumber: phoneVal,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      pincode: data.pincode,
      currency: data.currency,
      numberOfBranches: Number(data.numberOfBranches) || 1,
      numberOfWarehouses: Number(data.numberOfWarehouses) || 1,
      onboardingDate: data.onboardingDate || new Date().toISOString().split('T')[0],
      accountStatus: data.accountStatus || 'Active',
      msmeNumber: data.msmeNumber,
      activeRequestsCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    mockStore.data.clients.unshift(newClient);
    return newClient;
  },

  async update(id: string, data: Partial<ClientFormData>): Promise<Client> {
    try {
      const payload = {
        name: data.clientName,
        code: data.clientCode ? data.clientCode.toUpperCase() : undefined,
        contactPerson: data.contactPersonName,
        email: data.email,
        phone: data.phoneNumber,
        address: data.address,
        gstin: data.gstNumber,
        status: data.accountStatus ? (data.accountStatus === 'Active' ? 'ACTIVE' : 'INACTIVE') : undefined
      };
      await apiClient.put(`/api/master/clients/${id}`, payload);
    } catch (err) {
      console.warn('clientService.update API warning:', err);
    }
    const index = mockStore.data.clients.findIndex((c) => c.id === id);
    if (index !== -1) {
      const updated: Client = {
        ...mockStore.data.clients[index],
        ...data,
        clientCode: data.clientCode ? data.clientCode.toUpperCase() : mockStore.data.clients[index].clientCode,
        numberOfBranches: data.numberOfBranches !== undefined ? Number(data.numberOfBranches) : mockStore.data.clients[index].numberOfBranches,
        numberOfWarehouses: data.numberOfWarehouses !== undefined ? Number(data.numberOfWarehouses) : mockStore.data.clients[index].numberOfWarehouses,
      };
      mockStore.data.clients[index] = updated;
      return updated;
    }
    return null as any;
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.put(`/api/master/clients/${id}`, { status: 'INACTIVE' });
    } catch (err) {
      console.warn('clientService.delete API warning:', err);
    }
    mockStore.data.clients = mockStore.data.clients.filter((c) => c.id !== id);
  },
};

export const vendorService = {
  async getAll(): Promise<Vendor[]> {
    try {
      const res = await apiClient.get('/api/master/vendors');
      const list = parseList(res);
      if (list !== null) {
        return list.map((v: any) => ({
          id: v.id,
          tenantId: v.tenant_id || v.tenantId || '00000000-0000-0000-0000-000000000001',
          organizationId: v.organization_id || v.organizationId || '00000000-0000-0000-0000-000000000001',
          vendorName: v.vendorName || v.name || 'Vendor',
          vendorCode: v.vendorCode || v.code || 'VEN-001',
          businessType: v.businessType || v.business_type || 'Calibration Laboratory',
          contactPersonName: v.contactPersonName || v.contactPerson || v.contact_person || 'Contact',
          gstNumber: v.gstNumber || v.gstin || '',
          panNumber: v.panNumber || '',
          email: v.email || '',
          phone: v.phone || v.phoneNumber || '',
          phoneNumber: v.phoneNumber || v.phone || '',
          address: v.address || '',
          city: v.city || 'Bangalore',
          state: v.state || 'Karnataka',
          country: v.country || 'India',
          pincode: v.pincode || '560001',
          creditScore: Number(v.creditScore) || 85,
          creditLevel: v.creditLevel || 'Gold Tier',
          paymentDetails: v.paymentDetails || 'Net 30 Days',
          termsAndConditions: v.termsAndConditions || 'Standard Vendor Agreement',
          status: v.status || 'ACTIVE',
          activePOCount: v.activePOCount || 0,
          createdAt: v.created_at || v.createdAt || new Date().toISOString().split('T')[0],
        }));
      }
    } catch (err) {
      console.warn('vendorService.getAll API fetch warning:', err);
    }
    return [...mockStore.data.vendors];
  },

  async getById(id: string): Promise<Vendor | null> {
    try {
      const res = await apiClient.get(`/api/master/vendors/${id}`);
      if (res && res.success && res.data) {
        const v = res.data;
        return {
          id: v.id,
          tenantId: v.tenant_id || v.tenantId || '00000000-0000-0000-0000-000000000001',
          organizationId: v.organization_id || v.organizationId || '00000000-0000-0000-0000-000000000001',
          vendorName: v.vendorName || v.name,
          vendorCode: v.vendorCode || v.code,
          businessType: v.businessType || 'Calibration Laboratory',
          contactPersonName: v.contactPersonName || v.contactPerson,
          gstNumber: v.gstNumber || v.gstin,
          panNumber: v.panNumber,
          email: v.email,
          phone: v.phone || v.phoneNumber || '',
          phoneNumber: v.phoneNumber || v.phone,
          address: v.address,
          city: v.city || 'Bangalore',
          state: v.state || 'Karnataka',
          country: v.country || 'India',
          pincode: v.pincode || '560001',
          creditScore: Number(v.creditScore) || 85,
          creditLevel: v.creditLevel || 'Gold Tier',
          paymentDetails: v.paymentDetails || 'Net 30 Days',
          termsAndConditions: v.termsAndConditions || 'Standard Vendor Agreement',
          status: v.status || 'ACTIVE',
          activePOCount: v.activePOCount || 0,
          createdAt: v.created_at || v.createdAt || new Date().toISOString().split('T')[0],
        };
      }
    } catch (err) {
      console.warn('vendorService.getById API fetch warning:', err);
    }
    const vendor = mockStore.data.vendors.find((v) => v.id === id);
    return vendor ? { ...vendor } : null;
  },

  async create(data: VendorFormData): Promise<Vendor> {
    try {
      const payload = {
        name: data.vendorName,
        code: data.vendorCode.toUpperCase(),
        contactPerson: data.contactPersonName,
        email: data.email || undefined,
        phone: data.phoneNumber || undefined,
        address: data.address || undefined,
        gstin: data.gstNumber || undefined,
        status: 'ACTIVE'
      };
      const res = await apiClient.post('/api/master/vendors', payload);
      if (res && res.success && res.data) {
        const v = res.data;
        const newVendor: Vendor = {
          id: v.id,
          tenantId: '00000000-0000-0000-0000-000000000001',
          organizationId: '00000000-0000-0000-0000-000000000001',
          vendorName: v.name || data.vendorName,
          vendorCode: v.code || data.vendorCode,
          businessType: data.businessType,
          contactPersonName: data.contactPersonName,
          gstNumber: data.gstNumber,
          panNumber: data.panNumber,
          email: data.email,
          phoneNumber: data.phoneNumber,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          pincode: data.pincode,
          creditScore: Number(data.creditScore) || 75,
          creditLevel: data.creditLevel,
          paymentDetails: data.paymentDetails,
          termsAndConditions: data.termsAndConditions,
          status: 'ACTIVE',
          activePOCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
        };
        mockStore.data.vendors.unshift(newVendor);
        return newVendor;
      }
    } catch (err) {
      console.warn('vendorService.create API warning:', err);
    }
    const newVendor: Vendor = {
      id: `ven-${Date.now()}`,
      tenantId: '00000000-0000-0000-0000-000000000001',
      organizationId: '00000000-0000-0000-0000-000000000001',
      vendorName: data.vendorName,
      vendorCode: data.vendorCode.toUpperCase(),
      businessType: data.businessType,
      contactPersonName: data.contactPersonName,
      gstNumber: data.gstNumber,
      panNumber: data.panNumber,
      email: data.email,
      phoneNumber: data.phoneNumber,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      pincode: data.pincode,
      creditScore: Number(data.creditScore) || 75,
      creditLevel: data.creditLevel,
      paymentDetails: data.paymentDetails,
      termsAndConditions: data.termsAndConditions,
      status: 'ACTIVE',
      activePOCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    mockStore.data.vendors.unshift(newVendor);
    return newVendor;
  },

  async update(id: string, data: Partial<VendorFormData>): Promise<Vendor> {
    try {
      const payload = {
        name: data.vendorName,
        code: data.vendorCode ? data.vendorCode.toUpperCase() : undefined,
        contactPerson: data.contactPersonName,
        email: data.email,
        phone: data.phoneNumber,
        address: data.address,
        gstin: data.gstNumber,
      };
      await apiClient.put(`/api/master/vendors/${id}`, payload);
    } catch (err) {
      console.warn('vendorService.update API warning:', err);
    }
    const index = mockStore.data.vendors.findIndex((v) => v.id === id);
    if (index !== -1) {
      const updated: Vendor = {
        ...mockStore.data.vendors[index],
        ...data,
        vendorCode: data.vendorCode ? data.vendorCode.toUpperCase() : mockStore.data.vendors[index].vendorCode,
        creditScore: data.creditScore !== undefined ? Number(data.creditScore) : mockStore.data.vendors[index].creditScore,
      };
      mockStore.data.vendors[index] = updated;
      return updated;
    }
    return null as any;
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.put(`/api/master/vendors/${id}`, { status: 'INACTIVE' });
    } catch (err) {
      console.warn('vendorService.delete API warning:', err);
    }
    mockStore.data.vendors = mockStore.data.vendors.filter((v) => v.id !== id);
  },
};

export const itemService = {
  async getAll(): Promise<Item[]> {
    try {
      const res = await apiClient.get('/api/master/items');
      const list = parseList(res);
      if (list !== null) {
        return list.map((i: any) => ({
          id: i.id,
          tenantId: i.tenant_id || i.tenantId || '00000000-0000-0000-0000-000000000001',
          organizationId: i.organization_id || i.organizationId || '00000000-0000-0000-0000-000000000001',
          itemCode: i.itemCode || i.code || 'ITM-001',
          itemName: i.itemName || i.name || 'Item',
          itemType: i.itemType || i.category || 'Thermal Instrument',
          manufacturer: i.manufacturer || 'Fluke Calibration',
          model: i.model || '5522A',
          serialNumber: i.serialNumber || i.serial_number || 'SN-100234',
          measurementRange: i.measurementRange || '0-1000V',
          leastCount: i.leastCount || '0.001V',
          standardCost: Number(i.standardCost || i.standard_cost) || 1500,
          calibrationFrequencyMonths: Number(i.calibrationFrequencyMonths) || 12,
          status: (i.status === 'ACTIVE' || i.status === 'ACTIVE') ? 'ACTIVE' : (i.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'INACTIVE') as ItemStatus,
          description: i.description || '',
          createdAt: i.created_at || i.createdAt || new Date().toISOString().split('T')[0],
        }));
      }
    } catch (err) {
      console.warn('itemService.getAll API fetch warning:', err);
    }
    return [...mockStore.data.items];
  },

  async getById(id: string): Promise<Item | null> {
    try {
      const res = await apiClient.get(`/api/master/items/${id}`);
      if (res && res.success && res.data) {
        const i = res.data;
        return {
          id: i.id,
          tenantId: i.tenant_id || i.tenantId || '00000000-0000-0000-0000-000000000001',
          organizationId: i.organization_id || i.organizationId || '00000000-0000-0000-0000-000000000001',
          itemCode: i.itemCode || i.code,
          itemName: i.itemName || i.name,
          itemType: i.itemType || i.category || 'Thermal Instrument',
          manufacturer: i.manufacturer || 'Fluke Calibration',
          model: i.model || '5522A',
          serialNumber: i.serialNumber || i.serial_number || 'SN-100234',
          measurementRange: i.measurementRange || '0-1000V',
          leastCount: i.leastCount || '0.001V',
          standardCost: Number(i.standardCost || i.standard_cost) || 1500,
          calibrationFrequencyMonths: Number(i.calibrationFrequencyMonths) || 12,
          status: (i.status === 'ACTIVE' || i.status === 'ACTIVE') ? 'ACTIVE' : (i.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'INACTIVE') as ItemStatus,
          description: i.description || '',
          createdAt: i.created_at || i.createdAt || new Date().toISOString().split('T')[0],
        };
      }
    } catch (err) {
      console.warn('itemService.getById API fetch warning:', err);
    }
    const item = mockStore.data.items.find((i) => i.id === id);
    return item ? { ...item } : null;
  },

  async create(data: ItemFormData): Promise<Item> {
    try {
      const payload = {
        code: data.itemCode.toUpperCase(),
        name: data.itemName,
        category: data.itemType,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serialNumber,
        measurementRange: data.measurementRange,
        leastCount: data.leastCount,
        standardCost: Number(data.standardCost),
        calibrationFrequencyMonths: Number(data.calibrationFrequencyMonths),
        description: data.description,
        status: data.status
      };
      const res = await apiClient.post('/api/master/items', payload);
      if (res && res.success && res.data) {
        const i = res.data;
        const newItem: Item = {
          id: i.id,
          tenantId: '00000000-0000-0000-0000-000000000001',
          organizationId: '00000000-0000-0000-0000-000000000001',
          itemCode: i.code || data.itemCode,
          itemName: i.name || data.itemName,
          itemType: data.itemType,
          manufacturer: data.manufacturer,
          model: data.model,
          serialNumber: data.serialNumber,
          measurementRange: data.measurementRange,
          leastCount: data.leastCount,
          standardCost: Number(data.standardCost),
          calibrationFrequencyMonths: Number(data.calibrationFrequencyMonths) || 12,
          status: data.status,
          description: data.description,
          createdAt: new Date().toISOString().split('T')[0],
        };
        mockStore.data.items.unshift(newItem);
        return newItem;
      }
    } catch (err) {
      console.warn('itemService.create API warning:', err);
    }
    const newItem: Item = {
      id: `itm-${Date.now()}`,
      tenantId: '00000000-0000-0000-0000-000000000001',
      organizationId: '00000000-0000-0000-0000-000000000001',
      itemCode: data.itemCode.toUpperCase(),
      itemName: data.itemName,
      itemType: data.itemType,
      manufacturer: data.manufacturer,
      model: data.model,
      serialNumber: data.serialNumber,
      measurementRange: data.measurementRange,
      leastCount: data.leastCount,
      standardCost: Number(data.standardCost),
      calibrationFrequencyMonths: Number(data.calibrationFrequencyMonths) || 12,
      status: data.status,
      description: data.description,
      createdAt: new Date().toISOString().split('T')[0],
    };
    mockStore.data.items.unshift(newItem);
    return newItem;
  },

  async update(id: string, data: Partial<ItemFormData>): Promise<Item> {
    try {
      const payload = {
        code: data.itemCode ? data.itemCode.toUpperCase() : undefined,
        name: data.itemName,
        category: data.itemType,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serialNumber,
        standardCost: data.standardCost !== undefined ? Number(data.standardCost) : undefined,
        status: data.status
      };
      await apiClient.put(`/api/master/items/${id}`, payload);
    } catch (err) {
      console.warn('itemService.update API warning:', err);
    }
    const index = mockStore.data.items.findIndex((i) => i.id === id);
    if (index !== -1) {
      const updated: Item = {
        ...mockStore.data.items[index],
        ...data,
        itemCode: data.itemCode ? data.itemCode.toUpperCase() : mockStore.data.items[index].itemCode,
        standardCost: data.standardCost !== undefined ? Number(data.standardCost) : mockStore.data.items[index].standardCost,
        calibrationFrequencyMonths: data.calibrationFrequencyMonths !== undefined ? Number(data.calibrationFrequencyMonths) : mockStore.data.items[index].calibrationFrequencyMonths,
      };
      mockStore.data.items[index] = updated;
      return updated;
    }
    return null as any;
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.put(`/api/master/items/${id}`, { status: 'INACTIVE' });
    } catch (err) {
      console.warn('itemService.delete API warning:', err);
    }
    mockStore.data.items = mockStore.data.items.filter((i) => i.id !== id);
  },
};
