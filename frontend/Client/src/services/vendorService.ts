import { supabase } from '../lib/auth/supabaseClient';
import {
  Vendor,
  VendorFormData,
  VendorFilterParams,
  VendorListResponse,
  ItemCategory,
  VendorHistoryRollup,
  VendorStatus,
} from '../types/vendor';
import { mockStore } from '../mock/initialStore';

// Transform database row to frontend Vendor model
export function mapVendorRow(row: any): Vendor {
  const cats: ItemCategory[] = Array.isArray(row.categories)
    ? row.categories.map((c: any) => ({
        id: c.id,
        category_code: c.category_code || c.code || '',
        category_name: c.category_name || c.name || '',
        description: c.description || '',
      }))
    : [];

  return {
    id: row.id,
    tenant_id: row.tenant_id,
    tenantId: row.tenant_id,
    organization_id: row.organization_id,
    organizationId: row.organization_id,
    vendor_code: row.vendor_code || row.vendorCode || '',
    vendorCode: row.vendor_code || row.vendorCode || '',
    vendor_name: row.vendor_name || row.vendorName || '',
    vendorName: row.vendor_name || row.vendorName || '',
    address: row.address || '',
    city: row.city || '',
    state: row.state || '',
    pin: row.pin || row.pincode || '',
    pincode: row.pin || row.pincode || '',
    gstin_tax_id: row.gstin_tax_id || row.gstNumber || '',
    gstNumber: row.gstin_tax_id || row.gstNumber || '',
    contact_person: row.contact_person || row.contactPersonName || '',
    contactPersonName: row.contact_person || row.contactPersonName || '',
    phone: row.phone || row.phoneNumber || '',
    phoneNumber: row.phone || row.phoneNumber || '',
    email: row.email || '',
    status: (row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as VendorStatus,
    categories: cats,
    item_category_ids: cats.map((c) => c.id),
    created_by: row.created_by,
    created_by_name: row.created_by_name || 'System Admin',
    created_at: row.created_at || new Date().toISOString(),
    createdAt: row.created_at || new Date().toISOString(),
    modified_by: row.modified_by,
    modified_by_name: row.modified_by_name,
    modified_at: row.modified_at,
  };
}

export function parseRpcError(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const message = typeof err === 'string' ? err : err.message || err.details || '';
  
  if (message.includes('DUPLICATE_GSTIN') || message.includes('unique_tenant_org_vendor_gstin')) {
    return 'Vendor with this GSTIN already exists.';
  }
  if (message.includes('unique_tenant_org_vendor_code')) {
    return 'Vendor code conflict. Please try saving again.';
  }
  if (message.includes('INVALID_PIN_FORMAT') || message.includes('valid_vendor_pin')) {
    return 'PIN must contain exactly 6 digits.';
  }
  if (message.includes('INVALID_GSTIN_FORMAT') || message.includes('valid_vendor_gstin')) {
    return 'Invalid GSTIN format (e.g., 29AAACA1234F1Z5).';
  }
  if (message.includes('INVALID_PHONE_FORMAT')) {
    return 'Phone must be a valid 10-digit Indian mobile number.';
  }
  if (message.includes('INVALID_EMAIL_FORMAT')) {
    return 'Invalid email address.';
  }
  if (message.includes('VENDOR_NOT_FOUND')) {
    return 'Vendor not found.';
  }
  if (message.includes('AUTH_ERROR') || message.includes('permission denied')) {
    return 'You do not have permission to perform this vendor operation.';
  }
  if (message.includes('VALIDATION_ERROR')) {
    const cleanMsg = message.replace(/^.*VALIDATION_ERROR:\s*/, '');
    return cleanMsg || 'Required vendor information is missing.';
  }
  return message || 'Unable to save vendor. Please try again.';
}

export const vendorService = {
  /**
   * List vendors with database-level search, filtering, and pagination
   */
  async listVendors(params: VendorFilterParams = {}): Promise<VendorListResponse> {
    const {
      page = 0,
      size = 10,
      search = '',
      status = '',
      state = '',
      categoryId = undefined,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;

    try {
      const { data, error } = await supabase.rpc('rpc_list_vendors', {
        p_page: page,
        p_size: size,
        p_search: search.trim() || null,
        p_status: status || null,
        p_state: state || null,
        p_category_id: categoryId || null,
        p_sort_by: sortBy,
        p_sort_order: sortOrder,
      });

      if (!error && data && Array.isArray(data.vendors)) {
        return {
          vendors: data.vendors.map(mapVendorRow),
          pagination: {
            page: data.pagination?.page ?? page,
            size: data.pagination?.size ?? size,
            total: data.pagination?.total ?? data.vendors.length,
            total_pages: data.pagination?.total_pages ?? Math.ceil(data.vendors.length / size),
          },
        };
      }
      if (error) {
        console.warn('[vendorService] rpc_list_vendors fallback:', error.message);
      }
    } catch (err) {
      console.warn('[vendorService] rpc_list_vendors exception:', err);
    }

    // Fallback filter over mockStore if RPC not reachable in local/demo environment
    const localVendors = (mockStore.data.vendors || []).map((v: any) => ({
      id: v.id,
      vendor_code: v.vendorCode || v.vendor_code || 'VEN-2026-000001',
      vendorCode: v.vendorCode || v.vendor_code || 'VEN-2026-000001',
      vendor_name: v.vendorName || v.vendor_name || 'Vendor',
      vendorName: v.vendorName || v.vendor_name || 'Vendor',
      address: v.address || '',
      city: v.city || 'Bangalore',
      state: v.state || 'Karnataka',
      pin: v.pincode || v.pin || '560001',
      pincode: v.pincode || v.pin || '560001',
      gstin_tax_id: v.gstNumber || v.gstin_tax_id || '',
      gstNumber: v.gstNumber || v.gstin_tax_id || '',
      contact_person: v.contactPersonName || v.contact_person || 'Contact',
      contactPersonName: v.contactPersonName || v.contact_person || 'Contact',
      phone: v.phone || v.phoneNumber || '',
      phoneNumber: v.phone || v.phoneNumber || '',
      email: v.email || '',
      status: (v.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as VendorStatus,
      categories: [
        { id: 'cat-1', category_code: 'CAT-ELECTRICAL', category_name: 'Electrical' },
        { id: 'cat-2', category_code: 'CAT-PRESSURE', category_name: 'Pressure' },
      ],
      item_category_ids: ['cat-1', 'cat-2'],
      created_at: v.createdAt || new Date().toISOString(),
      createdAt: v.createdAt || new Date().toISOString(),
    }));

    let filtered = localVendors;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.vendor_name.toLowerCase().includes(q) ||
          v.vendor_code.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.gstin_tax_id.toLowerCase().includes(q)
      );
    }
    if (status) {
      filtered = filtered.filter((v) => v.status === status);
    }
    if (state) {
      filtered = filtered.filter((v) => v.state.toLowerCase() === state.toLowerCase());
    }

    const total = filtered.length;
    const paginated = filtered.slice(page * size, (page + 1) * size);

    return {
      vendors: paginated.map(mapVendorRow),
      pagination: {
        page,
        size,
        total,
        total_pages: Math.ceil(total / size) || 1,
      },
    };
  },

  /**
   * Compatibility wrapper for getAll()
   */
  async getAll(): Promise<Vendor[]> {
    const res = await this.listVendors({ page: 0, size: 100 });
    return res.vendors;
  },

  /**
   * Get single vendor by ID with categories and optional history
   */
  async getById(id: string, includeHistory: boolean = false): Promise<Vendor | null> {
    try {
      const { data, error } = await supabase.rpc('rpc_get_vendor_details', {
        p_vendor_id: id,
        p_include_history: includeHistory,
      });

      if (!error && data && data.vendor) {
        const vendor = mapVendorRow({
          ...data.vendor,
          categories: data.categories,
        });
        return vendor;
      }
      if (error) {
        console.warn('[vendorService] rpc_get_vendor_details warning:', error.message);
      }
    } catch (err) {
      console.warn('[vendorService] rpc_get_vendor_details exception:', err);
    }

    const found = (mockStore.data.vendors || []).find((v: any) => v.id === id);
    return found ? mapVendorRow(found) : null;
  },

  /**
   * Create Vendor via Supabase RPC (or Edge Function orchestration)
   */
  async create(formData: VendorFormData): Promise<{ vendor: Vendor; hasNameDuplicateWarning?: boolean }> {
    try {
      const { data, error } = await supabase.rpc('rpc_create_vendor', {
        p_vendor_name: formData.vendor_name.trim(),
        p_address: formData.address.trim(),
        p_city: formData.city.trim(),
        p_state: formData.state.trim(),
        p_pin: formData.pin.trim(),
        p_gstin_tax_id: formData.gstin_tax_id.toUpperCase().trim(),
        p_contact_person: formData.contact_person.trim(),
        p_phone: formData.phone.trim(),
        p_email: formData.email.toLowerCase().trim(),
        p_item_category_ids: formData.item_category_ids || [],
        p_status: formData.status || 'ACTIVE',
      });

      if (error) {
        throw new Error(parseRpcError(error));
      }

      if (data && data.vendor) {
        const created = mapVendorRow({
          ...data.vendor,
          categories: data.categories,
        });
        return {
          vendor: created,
          hasNameDuplicateWarning: !!data.has_name_duplicate_warning,
        };
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('not found in the schema cache')) {
        throw err;
      }
      console.warn('[vendorService] RPC create failed, trying Edge Function / mock fallback:', err);
    }

    // Try Edge Function invocation
    try {
      const { data: efData, error: efError } = await supabase.functions.invoke('vendor-master', {
        body: {
          action: 'create',
          ...formData,
        },
      });
      if (!efError && efData && efData.success && efData.data?.vendor) {
        return {
          vendor: mapVendorRow(efData.data.vendor),
          hasNameDuplicateWarning: !!efData.data.has_name_duplicate_warning,
        };
      }
    } catch (efErr) {
      // ignore edge function failure
    }

    // Fallback for mock demo persistence
    const year = new Date().getFullYear();
    const seq = String((mockStore.data.vendors?.length || 0) + 1).padStart(6, '0');
    const newCode = `VEN-${year}-${seq}`;
    const newId = crypto.randomUUID();

    const newVendorRow = {
      id: newId,
      vendor_code: newCode,
      vendorCode: newCode,
      vendor_name: formData.vendor_name,
      vendorName: formData.vendor_name,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pin: formData.pin,
      pincode: formData.pin,
      gstin_tax_id: formData.gstin_tax_id.toUpperCase(),
      gstNumber: formData.gstin_tax_id.toUpperCase(),
      contact_person: formData.contact_person,
      contactPersonName: formData.contact_person,
      phone: formData.phone,
      phoneNumber: formData.phone,
      email: formData.email,
      status: formData.status,
      categories: (formData.item_category_ids || []).map((id) => ({
        id,
        category_code: `CAT-${id}`,
        category_name: 'Calibration Category',
      })),
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    if (!mockStore.data.vendors) mockStore.data.vendors = [];
    mockStore.data.vendors.unshift(newVendorRow as any);

    return {
      vendor: mapVendorRow(newVendorRow),
      hasNameDuplicateWarning: false,
    };
  },

  /**
   * Update Vendor via Supabase RPC
   */
  async update(id: string, formData: Partial<VendorFormData>): Promise<Vendor> {
    try {
      const { data, error } = await supabase.rpc('rpc_update_vendor', {
        p_vendor_id: id,
        p_vendor_name: formData.vendor_name ? formData.vendor_name.trim() : null,
        p_address: formData.address ? formData.address.trim() : null,
        p_city: formData.city ? formData.city.trim() : null,
        p_state: formData.state ? formData.state.trim() : null,
        p_pin: formData.pin ? formData.pin.trim() : null,
        p_gstin_tax_id: formData.gstin_tax_id ? formData.gstin_tax_id.toUpperCase().trim() : null,
        p_contact_person: formData.contact_person ? formData.contact_person.trim() : null,
        p_phone: formData.phone ? formData.phone.trim() : null,
        p_email: formData.email ? formData.email.toLowerCase().trim() : null,
        p_item_category_ids: formData.item_category_ids ?? null,
        p_status: formData.status ?? null,
      });

      if (error) {
        throw new Error(parseRpcError(error));
      }

      if (data && data.vendor) {
        return mapVendorRow({
          ...data.vendor,
          categories: data.categories,
        });
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('not found in the schema cache')) {
        throw err;
      }
      console.warn('[vendorService] RPC update failed, fallback to mock:', err);
    }

    // Mock store update
    const idx = (mockStore.data.vendors || []).findIndex((v: any) => v.id === id);
    if (idx !== -1) {
      const existing = mockStore.data.vendors[idx];
      const updated = {
        ...existing,
        ...formData,
        modified_at: new Date().toISOString(),
      };
      mockStore.data.vendors[idx] = updated;
      return mapVendorRow(updated);
    }
    throw new Error('Vendor not found');
  },

  /**
   * Update Vendor Status (Activate / Deactivate)
   */
  async updateStatus(id: string, status: VendorStatus): Promise<Vendor> {
    try {
      const { data, error } = await supabase.rpc('rpc_update_vendor_status', {
        p_vendor_id: id,
        p_status: status,
      });

      if (error) {
        throw new Error(parseRpcError(error));
      }

      if (data) {
        return mapVendorRow(data);
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('not found in the schema cache')) {
        throw err;
      }
      console.warn('[vendorService] RPC status update fallback to mock:', err);
    }

    const idx = (mockStore.data.vendors || []).findIndex((v: any) => v.id === id);
    if (idx !== -1) {
      mockStore.data.vendors[idx].status = status;
      return mapVendorRow(mockStore.data.vendors[idx]);
    }
    throw new Error('Vendor not found');
  },

  /**
   * Compatibility delete (triggers deactivation instead of physical delete)
   */
  async delete(id: string): Promise<boolean> {
    await this.updateStatus(id, 'INACTIVE');
    return true;
  },

  /**
   * Real-time check for GSTIN duplicate
   */
  async checkGstinDuplicate(
    gstin: string,
    excludeId?: string
  ): Promise<{ isDuplicate: boolean; existingVendorName?: string; existingVendorCode?: string }> {
    if (!gstin || gstin.trim().length < 15) {
      return { isDuplicate: false };
    }

    try {
      const { data, error } = await supabase.rpc('rpc_check_vendor_gstin_duplicate', {
        p_gstin_tax_id: gstin.toUpperCase().trim(),
        p_exclude_vendor_id: excludeId || null,
      });

      if (!error && data) {
        return {
          isDuplicate: !!data.is_duplicate,
          existingVendorName: data.existing_vendor_name,
          existingVendorCode: data.existing_vendor_code,
        };
      }
    } catch (err) {
      console.warn('[vendorService] checkGstinDuplicate exception:', err);
    }

    // Local mock check
    const existing = (mockStore.data.vendors || []).find(
      (v: any) =>
        (v.gstin_tax_id === gstin.toUpperCase().trim() || v.gstNumber === gstin.toUpperCase().trim()) &&
        v.id !== excludeId
    );

    return {
      isDuplicate: !!existing,
      existingVendorName: existing?.vendorName || existing?.vendor_name,
      existingVendorCode: existing?.vendorCode || existing?.vendor_code,
    };
  },

  /**
   * Real-time check for Vendor Name duplicate warning
   */
  async checkNameDuplicate(
    name: string,
    excludeId?: string
  ): Promise<{ isDuplicate: boolean; count?: number }> {
    if (!name || name.trim().length < 2) {
      return { isDuplicate: false };
    }

    try {
      const { data, error } = await supabase.rpc('rpc_check_vendor_name_duplicate', {
        p_vendor_name: name.trim(),
        p_exclude_vendor_id: excludeId || null,
      });

      if (!error && data) {
        return {
          isDuplicate: !!data.is_duplicate,
          count: data.count,
        };
      }
    } catch (err) {
      console.warn('[vendorService] checkNameDuplicate exception:', err);
    }

    const matches = (mockStore.data.vendors || []).filter(
      (v: any) =>
        (v.vendorName?.toLowerCase().trim() === name.toLowerCase().trim() ||
          v.vendor_name?.toLowerCase().trim() === name.toLowerCase().trim()) &&
        v.id !== excludeId
    );

    return {
      isDuplicate: matches.length > 0,
      count: matches.length,
    };
  },

  /**
   * Fetch master item categories for multi-select
   */
  async getItemCategories(): Promise<ItemCategory[]> {
    try {
      const { data, error } = await supabase.rpc('rpc_list_item_categories');
      if (!error && Array.isArray(data)) {
        return data.map((c: any) => ({
          id: c.id,
          category_code: c.category_code,
          category_name: c.category_name,
          description: c.description,
        }));
      }
    } catch (err) {
      console.warn('[vendorService] getItemCategories exception:', err);
    }

    // Default standard calibration disciplines
    return [
      { id: '11111111-0000-0000-0000-000000000001', category_code: 'CAT-ELECTRICAL', category_name: 'Electrical', description: 'Electrical calibration instruments' },
      { id: '11111111-0000-0000-0000-000000000002', category_code: 'CAT-PRESSURE', category_name: 'Pressure', description: 'Pressure gauges, transmitters and calibrators' },
      { id: '11111111-0000-0000-0000-000000000003', category_code: 'CAT-TEMPERATURE', category_name: 'Temperature', description: 'RTDs, thermocouples, temperature baths' },
      { id: '11111111-0000-0000-0000-000000000004', category_code: 'CAT-DIMENSIONAL', category_name: 'Dimensional', description: 'Verniers, micrometers, height gauges' },
      { id: '11111111-0000-0000-0000-000000000005', category_code: 'CAT-THERMAL', category_name: 'Thermal', description: 'Thermal chambers, furnaces, and ovens' },
      { id: '11111111-0000-0000-0000-000000000006', category_code: 'CAT-MASS-VOLUME', category_name: 'Mass & Volume', description: 'Weights, balances, and volumetric glassware' },
      { id: '11111111-0000-0000-0000-000000000007', category_code: 'CAT-FORCE-TORQUE', category_name: 'Force & Torque', description: 'Torque wrenches, load cells, UTMs' },
      { id: '11111111-0000-0000-0000-000000000008', category_code: 'CAT-OPTICAL', category_name: 'Optical', description: 'Lux meters, spectrometers, optical gauges' },
    ];
  },

  /**
   * Get Vendor History Roll-Up (Purchase Orders, Items Serviced, Outstanding/Received)
   */
  async getVendorHistory(vendorId: string): Promise<VendorHistoryRollup> {
    try {
      const { data, error } = await supabase.rpc('rpc_get_vendor_history', {
        p_vendor_id: vendorId,
      });

      if (!error && data) {
        return {
          purchase_orders: data.purchase_orders || [],
          items_serviced: data.items_serviced || [],
          outstanding_received: data.outstanding_received || [],
        };
      }
    } catch (err) {
      console.warn('[vendorService] getVendorHistory exception:', err);
    }

    return {
      purchase_orders: [],
      items_serviced: [],
      outstanding_received: [],
    };
  },
};
