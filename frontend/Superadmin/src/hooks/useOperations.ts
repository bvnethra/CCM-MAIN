/**
 * TanStack Query hooks for Equipment Intake Requests (Process Step 1).
 * Follows triple-key traceability: tenantId, organizationId, requestId.
 * Every mutation invalidates ['calibrationRequests', tenantId] for UI freshness.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestService } from '../services/requestService';
import { CreateRequestFormData, RequestStatus, RequestItem } from '../types/request';
import { useAuth } from '../context/AuthContext';

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const operationsQueryKeys = {
  requests: (tenantId: string) => ['calibrationRequests', tenantId] as const,
  request: (id: string) => ['calibrationRequest', id] as const,
  labQueue: (tenantId: string) => ['labQueue', tenantId] as const,
};

// ─── Request List ────────────────────────────────────────────────────────────

export function useRequests() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: operationsQueryKeys.requests(tenantId),
    queryFn: () => requestService.getAll(),
    enabled: !!tenantId,
  });
}

export function useLabQueue() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: operationsQueryKeys.labQueue(tenantId),
    queryFn: async () => {
      const all = await requestService.getAll();
      const labStatuses: RequestStatus[] = ['COLLECTED', 'LAB_QUEUE', 'VERIFICATION', 'ON_HOLD', 'DISCREPANCY'];
      return all.filter((r) => labStatuses.includes(r.status as RequestStatus));
    },
    enabled: !!tenantId,
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: operationsQueryKeys.request(id),
    queryFn: () => requestService.getById(id),
    enabled: !!id,
  });
}

// ─── Create Request ──────────────────────────────────────────────────────────

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: (data: CreateRequestFormData) => requestService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.requests(tenantId) });
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.labQueue(tenantId) });
    },
  });
}

// ─── Update Request Status ───────────────────────────────────────────────────

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: ({
      id,
      status,
      remarks,
    }: {
      id: string;
      status: RequestStatus;
      remarks?: string;
    }) => requestService.updateStatus(id, status, remarks),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.requests(tenantId) });
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.labQueue(tenantId) });
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.request(variables.id) });
    },
  });
}

// ─── Update Request Item ─────────────────────────────────────────────────────

export function useUpdateRequestItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: ({
      requestId,
      itemId,
      updates,
    }: {
      requestId: string;
      itemId: string;
      updates: Partial<RequestItem>;
    }) => requestService.updateItem(requestId, itemId, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.requests(tenantId) });
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.request(variables.requestId) });
    },
  });
}

// ─── Delete Request ──────────────────────────────────────────────────────────

export function useDeleteRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: (id: string) => requestService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.requests(tenantId) });
    },
  });
}
