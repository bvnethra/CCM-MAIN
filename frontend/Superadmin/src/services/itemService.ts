// ============================================================================
// ITEM SERVICE - Placeholder Implementation
// ============================================================================
// TODO: Implement item service when item module is ready
// This is a placeholder to prevent import errors
// ============================================================================

// Placeholder item service
export const itemService = {
  // Placeholder methods that match expected interface
  getAll: async () => {
    console.warn('Item service not yet implemented');
    return [];
  },
  
  getById: async (id: string) => {
    console.warn('Item service not yet implemented');
    return null;
  },
  
  create: async (data: any) => {
    console.warn('Item service not yet implemented');
    throw new Error('Item service not yet implemented');
  },
  
  update: async (id: string, data: any) => {
    console.warn('Item service not yet implemented');
    throw new Error('Item service not yet implemented');
  },
  
  delete: async (id: string) => {
    console.warn('Item service not yet implemented');
    throw new Error('Item service not yet implemented');
  }
};
