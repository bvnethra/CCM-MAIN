/**
 * TanStack Query hooks for Gate Pass Dispatch & Delivery (Process Step 5).
 * Covers: Digital Signatures, Dispatches, Deliveries, Audit Logs.
 *
 * Mutations invalidate execution + request keys so the request status
 * (DISPATCHED → COMPLETED) is reflected everywhere immediately.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  signatureService,
  dispatchService,
  deliveryService,
  auditService,
} from '../services/executionServices';
import { DispatchRecord, SignatureType } from '../types/dispatch';
import { useAuth } from '../context/AuthContext';
import { operationsQueryKeys } from './useOperations';
import { commercialQueryKeys } from './useCommercial';

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const executionQueryKeys = {
  signatures: (tenantId: string) => ['signatures', tenantId] as const,
  dispatches: (tenantId: string) => ['dispatches', tenantId] as const,
  deliveries: (tenantId: string) => ['deliveries', tenantId] as const,
  auditLogs: (tenantId: string) => ['auditLogs', tenantId] as const,
};

// ─── Signature Hooks ─────────────────────────────────────────────────────────

export function useSignatures() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: executionQueryKeys.signatures(tenantId),
    queryFn: () => signatureService.getAll(),
    enabled: !!tenantId,
  });
}

export function useCreateSignature() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: ({
      type,
      referenceId,
      signatoryName,
      signatoryDesignation,
      signatureData,
      remarks,
    }: {
      type: SignatureType;
      referenceId: string;
      signatoryName: string;
      signatoryDesignation: string;
      signatureData: string;
      remarks?: string;
    }) =>
      signatureService.sign(
        type,
        referenceId,
        signatoryName,
        signatoryDesignation,
        signatureData,
        remarks,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executionQueryKeys.signatures(tenantId) });
      // Invoice signed status changes
      queryClient.invalidateQueries({ queryKey: commercialQueryKeys.invoices(tenantId) });
    },
  });
}

// ─── Dispatch Hooks ──────────────────────────────────────────────────────────

export function useDispatches() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: executionQueryKeys.dispatches(tenantId),
    queryFn: () => dispatchService.getAll(),
    enabled: !!tenantId,
  });
}

export function useCreateDispatch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: (data: Omit<DispatchRecord, 'id' | 'dispatchNumber' | 'status'>) =>
      dispatchService.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: executionQueryKeys.dispatches(tenantId) });
      queryClient.invalidateQueries({ queryKey: executionQueryKeys.deliveries(tenantId) });
      if (variables.requestId) {
        queryClient.invalidateQueries({
          queryKey: operationsQueryKeys.request(variables.requestId),
        });
        queryClient.invalidateQueries({ queryKey: operationsQueryKeys.requests(tenantId) });
      }
    },
  });
}

// ─── Delivery Hooks ──────────────────────────────────────────────────────────

export function useDeliveries() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: executionQueryKeys.deliveries(tenantId),
    queryFn: () => deliveryService.getAll(),
    enabled: !!tenantId,
  });
}

export function useMarkDeliveryReceived() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: ({
      deliveryId,
      recipientName,
      recipientPhone,
    }: {
      deliveryId: string;
      recipientName: string;
      recipientPhone: string;
    }) => deliveryService.markReceived(deliveryId, recipientName, recipientPhone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executionQueryKeys.deliveries(tenantId) });
      queryClient.invalidateQueries({ queryKey: executionQueryKeys.dispatches(tenantId) });
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.requests(tenantId) });
    },
  });
}

// ─── Audit Log Hooks ─────────────────────────────────────────────────────────

export function useAuditLogs() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: executionQueryKeys.auditLogs(tenantId),
    queryFn: () => auditService.getAll(),
    enabled: !!tenantId,
  });
}
