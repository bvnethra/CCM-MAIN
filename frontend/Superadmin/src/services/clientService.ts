// ============================================================================
// CLIENT MASTER SERVICE - Supabase RPC Functions
// ============================================================================
// This service calls PostgreSQL RPC functions directly via Supabase client
// NO REST API, NO backend layer - direct database RPC calls
// ============================================================================

import { supabase } from '../lib/auth/supabaseClient';
import type {
  Client,
  ClientFormData,
  ClientFilters,
  ClientListResponse,
  ClientDetailsResponse,
  GstinDuplicateResponse,
  NameDuplicateResponse,
  CreateClientResponse
} from '../types/client';

// ===========================================
// HELPER: Get Current User Context
// ===========================================

function getCurrentUserContext() {
  try {
    const userCache = localStorage.getItem('ccm_user_cache');
    if (userCache) {
      const user = JSON.parse(userCache);
      return {
        userId: user.userId || user.id,
        tenantId: user.tenantId,
        organizationId: user.organizationId
      };
    }
  } catch (error) {
    console.error('Failed to get user context:', error);
  }
  
  throw new Error('User not authenticated. Please log in again.');
}

// ===========================================
// HELPER: Set Session Context for RLS
// ===========================================

async function setSessionContext() {
  const ctx = getCurrentUserContext();
  
  // Set PostgreSQL session variables for RLS policies
  await supabase.rpc('set_config', {
    setting_name: 'app.current_user_id',
    setting_value: ctx.userId
  });
  
  await supabase.rpc('set_config', {
    setting_name: 'app.current_tenant_id',
    setting_value: ctx.tenantId
  });
  
  await supabase.rpc('set_config', {
    setting_name: 'app.current_organization_id',
    setting_value: ctx.organizationId
  });
  
  return ctx;
}

// ===========================================
// SERVICE METHODS
// ===========================================

export const clientService = {
  /**
   * Get list of clients with pagination, search, and filters
   */
  async getClients(
    page: number = 0,
    size: number = 20,
    filters?: ClientFilters
  ): Promise<ClientListResponse> {
    try {
      await setSessionContext();
      
      const { data, error } = await supabase.rpc('rpc_list_clients', {
        p_page: page,
        p_size: size,
        p_search: filters?.search || null,
        p_status: filters?.status || null,
        p_city: filters?.city || null,
        p_state: filters?.state || null,
        p_payment_terms: filters?.paymentTerms || null,
        p_sort_by: 'created_at',
        p_sort_order: 'desc'
      });
      
      if (error) {
        console.error('Error fetching clients:', error);
        throw new Error(error.message || 'Failed to fetch clients');
      }
      
      return data as ClientListResponse;
    } catch (error: any) {
      console.error('getClients error:', error);
      throw error;
    }
  },

  /**
   * Get single client by ID with optional history
   */
  async getClient(id: string, includeHistory: boolean = true): Promise<ClientDetailsResponse> {
    try {
      await setSessionContext();
      
      const { data, error } = await supabase.rpc('rpc_get_client_details', {
        p_client_id: id,
        p_include_history: includeHistory
      });
      
      if (error) {
        console.error('Error fetching client:', error);
        
        if (error.message.includes('CLIENT_NOT_FOUND')) {
          throw new Error('Client not found');
        }
        
        throw new Error(error.message || 'Failed to fetch client');
      }
      
      return data as ClientDetailsResponse;
    } catch (error: any) {
      console.error('getClient error:', error);
      throw error;
    }
  },

  /**
   * Create new client
   */
  async createClient(formData: ClientFormData): Promise<CreateClientResponse> {
    try {
      await setSessionContext();
      
      const { data, error } = await supabase.rpc('rpc_create_client', {
        p_client_name: formData.clientName,
        p_registered_address: formData.registeredAddress,
        p_billing_address: formData.billingAddress || null,
        p_city: formData.city,
        p_state: formData.state,
        p_pin_code: formData.pinCode,
        p_gstin_tax_id: formData.gstinTaxId,
        p_contact_person: formData.contactPerson,
        p_phone: formData.phone,
        p_email: formData.email,
        p_status: formData.status || 'ACTIVE',
        p_payment_terms: formData.paymentTerms || '30_DAYS'
      });
      
      if (error) {
        console.error('Error creating client:', error);
        
        // Parse error codes
        if (error.message.includes('DUPLICATE_GSTIN')) {
          throw new Error('A client with this GSTIN already exists');
        }
        if (error.message.includes('INVALID_GSTIN_FORMAT')) {
          throw new Error('Invalid GSTIN format');
        }
        if (error.message.includes('INVALID_PIN_FORMAT')) {
          throw new Error('Invalid PIN code format');
        }
        if (error.message.includes('INVALID_PHONE_FORMAT')) {
          throw new Error('Invalid phone number format');
        }
        if (error.message.includes('INVALID_EMAIL_FORMAT')) {
          throw new Error('Invalid email format');
        }
        if (error.message.includes('VALIDATION_ERROR')) {
          throw new Error(error.message.split(': ')[1] || 'Validation error');
        }
        
        throw new Error(error.message || 'Failed to create client');
      }
      
      return data as CreateClientResponse;
    } catch (error: any) {
      console.error('createClient error:', error);
      throw error;
    }
  },

  /**
   * Update existing client
   */
  async updateClient(id: string, formData: Partial<ClientFormData>): Promise<Client> {
    try {
      await setSessionContext();
      
      const { data, error } = await supabase.rpc('rpc_update_client', {
        p_client_id: id,
        p_client_name: formData.clientName || null,
        p_registered_address: formData.registeredAddress || null,
        p_billing_address: formData.billingAddress || null,
        p_city: formData.city || null,
        p_state: formData.state || null,
        p_pin_code: formData.pinCode || null,
        p_gstin_tax_id: formData.gstinTaxId || null,
        p_contact_person: formData.contactPerson || null,
        p_phone: formData.phone || null,
        p_email: formData.email || null,
        p_status: formData.status || null,
        p_payment_terms: formData.paymentTerms || null
      });
      
      if (error) {
        console.error('Error updating client:', error);
        
        if (error.message.includes('CLIENT_NOT_FOUND')) {
          throw new Error('Client not found');
        }
        if (error.message.includes('DUPLICATE_GSTIN')) {
          throw new Error('A client with this GSTIN already exists');
        }
        if (error.message.includes('INVALID_GSTIN_FORMAT')) {
          throw new Error('Invalid GSTIN format');
        }
        if (error.message.includes('INVALID_PIN_FORMAT')) {
          throw new Error('Invalid PIN code format');
        }
        if (error.message.includes('INVALID_PHONE_FORMAT')) {
          throw new Error('Invalid phone number format');
        }
        if (error.message.includes('INVALID_EMAIL_FORMAT')) {
          throw new Error('Invalid email format');
        }
        
        throw new Error(error.message || 'Failed to update client');
      }
      
      return data as Client;
    } catch (error: any) {
      console.error('updateClient error:', error);
      throw error;
    }
  },

  /**
   * Update client status (Activate/Deactivate)
   */
  async updateClientStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<Client> {
    try {
      await setSessionContext();
      
      const { data, error } = await supabase.rpc('rpc_update_client_status', {
        p_client_id: id,
        p_status: status
      });
      
      if (error) {
        console.error('Error updating client status:', error);
        
        if (error.message.includes('CLIENT_NOT_FOUND')) {
          throw new Error('Client not found');
        }
        if (error.message.includes('CLIENT_HAS_ACTIVE_REQUESTS')) {
          throw new Error('Cannot deactivate client with active requests');
        }
        
        throw new Error(error.message || 'Failed to update client status');
      }
      
      return data as Client;
    } catch (error: any) {
      console.error('updateClientStatus error:', error);
      throw error;
    }
  },

  /**
   * Check if GSTIN already exists (for real-time validation)
   */
  async checkGstinDuplicate(
    gstin: string,
    excludeClientId?: string
  ): Promise<GstinDuplicateResponse> {
    try {
      await setSessionContext();
      
      const { data, error } = await supabase.rpc('rpc_check_gstin_duplicate', {
        p_gstin_tax_id: gstin.toUpperCase(),
        p_exclude_client_id: excludeClientId || null
      });
      
      if (error) {
        console.error('Error checking GSTIN duplicate:', error);
        throw new Error('Failed to check GSTIN duplicate');
      }
      
      return data as GstinDuplicateResponse;
    } catch (error: any) {
      console.error('checkGstinDuplicate error:', error);
      throw error;
    }
  },

  /**
   * Check if client name already exists (warning only, non-blocking)
   */
  async checkNameDuplicate(
    name: string,
    excludeClientId?: string
  ): Promise<NameDuplicateResponse> {
    try {
      await setSessionContext();
      
      const { data, error } = await supabase.rpc('rpc_check_name_duplicate', {
        p_client_name: name,
        p_exclude_client_id: excludeClientId || null
      });
      
      if (error) {
        console.error('Error checking name duplicate:', error);
        throw new Error('Failed to check name duplicate');
      }
      
      return data as NameDuplicateResponse;
    } catch (error: any) {
      console.error('checkNameDuplicate error:', error);
      throw error;
    }
  },

  /**
   * Get client history (stub for future implementation)
   */
  async getClientHistory(id: string) {
    // This will be populated when request/quotation/invoice modules are ready
    return {
      requests: [],
      quotations: [],
      invoices: []
    };
  }
};
