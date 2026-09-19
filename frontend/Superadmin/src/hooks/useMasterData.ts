/**
 * TanStack Query hooks for Master Data (Clients, Vendors, Items).
 * Every mutation invalidates matching query keys to guarantee UI freshness.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../services/clientService';
import { vendorService } from '../services/vendorService';
import { itemService } from '../services/itemService';
import { ClientFormData } from '../types/client';
import { VendorFormData } from '../types/vendor';
import { ItemFormData } from '../types/item';
import { useAuth } from '../context/AuthContext';

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const masterQueryKeys = {
  clients: (tenantId: string) => ['clients', tenantId] as const,
  client: (id: string) => ['client', id] as const,
  vendors: (tenantId: string) => ['vendors', tenantId] as const,
  vendor: (id: string) => ['vendor', id] as const,
  items: (tenantId: string) => ['items', tenantId] as const,
  item: (id: string) => ['item', id] as const,
};

// ─── Client Hooks ────────────────────────────────────────────────────────────

export function useClients() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: masterQueryKeys.clients(tenantId),
    queryFn: () => clientService.getClients(),
    enabled: !!tenantId,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: masterQueryKeys.client(id),
    queryFn: () => clientService.getClient(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: (data: ClientFormData) => clientService.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.clients(tenantId) });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClientFormData> }) =>
      clientService.updateClient(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.clients(tenantId) });
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.client(variables.id) });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: (id: string) => clientService.updateClientStatus(id, 'INACTIVE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.clients(tenantId) });
    },
  });
}

// ─── Vendor Hooks ────────────────────────────────────────────────────────────

export function useVendors() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: masterQueryKeys.vendors(tenantId),
    queryFn: () => vendorService.getAll(),
    enabled: !!tenantId,
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: masterQueryKeys.vendor(id),
    queryFn: () => vendorService.getById(id),
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: (data: VendorFormData) => vendorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.vendors(tenantId) });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VendorFormData> }) =>
      vendorService.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.vendors(tenantId) });
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.vendor(variables.id) });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: (id: string) => vendorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.vendors(tenantId) });
    },
  });
}

// ─── Item Hooks ──────────────────────────────────────────────────────────────

export function useItems() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: masterQueryKeys.items(tenantId),
    queryFn: () => itemService.getAll(),
    enabled: !!tenantId,
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: masterQueryKeys.item(id),
    queryFn: () => itemService.getById(id),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: (data: ItemFormData) => itemService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.items(tenantId) });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ItemFormData> }) =>
      itemService.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.items(tenantId) });
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.item(variables.id) });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: (id: string) => itemService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterQueryKeys.items(tenantId) });
    },
  });
}
