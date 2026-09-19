/**
 * TanStack Query hooks for Commercial Billing & Invoicing (Process Step 4).
 * Covers: Quotations, Approvals, Purchase Orders, Invoices.
 *
 * All mutations invalidate their respective list keys scoped to tenantId
 * so every view reflects the latest data without manual refreshes.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  quotationService,
  approvalService,
  purchaseOrderService,
  invoiceService,
} from '../services/commercialServices';
import { QuotationFormData } from '../types/quotation';
import { ApprovalActionType, PurchaseOrder, InvoiceType } from '../types/invoice';
import { useAuth } from '../context/AuthContext';
import { operationsQueryKeys } from './useOperations';

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const commercialQueryKeys = {
  quotations: (tenantId: string) => ['quotations', tenantId] as const,
  quotation: (id: string) => ['quotation', id] as const,
  approvals: (tenantId: string) => ['approvals', tenantId] as const,
  purchaseOrders: (tenantId: string) => ['purchaseOrders', tenantId] as const,
  invoices: (tenantId: string) => ['invoices', tenantId] as const,
  invoice: (id: string) => ['invoice', id] as const,
};

// ─── Quotation Hooks ─────────────────────────────────────────────────────────

export function useQuotations() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: commercialQueryKeys.quotations(tenantId),
    queryFn: () => quotationService.getAll(),
    enabled: !!tenantId,
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: commercialQueryKeys.quotation(id),
    queryFn: () => quotationService.getById(id),
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: (data: QuotationFormData) => quotationService.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: commercialQueryKeys.quotations(tenantId) });
      queryClient.invalidateQueries({ queryKey: commercialQueryKeys.approvals(tenantId) });
      // Requests change status to QUOTATION
      if (variables.requestId) {
        queryClient.invalidateQueries({
          queryKey: operationsQueryKeys.request(variables.requestId),
        });
      }
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.requests(tenantId) });
    },
  });
}

// ─── Approval Hooks ──────────────────────────────────────────────────────────

export function useApprovals() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: commercialQueryKeys.approvals(tenantId),
    queryFn: () => approvalService.getAll(),
    enabled: !!tenantId,
  });
}

export function useProcessApproval() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: ({
      approvalId,
      action,
      comments,
      approverName,
    }: {
      approvalId: string;
      action: ApprovalActionType;
      comments: string;
      approverName?: string;
    }) => approvalService.processApproval(approvalId, action, comments, approverName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commercialQueryKeys.approvals(tenantId) });
      queryClient.invalidateQueries({ queryKey: commercialQueryKeys.quotations(tenantId) });
    },
  });
}

// ─── Purchase Order Hooks ────────────────────────────────────────────────────

export function usePurchaseOrders() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: commercialQueryKeys.purchaseOrders(tenantId),
    queryFn: () => purchaseOrderService.getAll(),
    enabled: !!tenantId,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: (data: Omit<PurchaseOrder, 'id' | 'status'>) =>
      purchaseOrderService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commercialQueryKeys.purchaseOrders(tenantId) });
    },
  });
}

// ─── Invoice Hooks ───────────────────────────────────────────────────────────

export function useInvoices() {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: commercialQueryKeys.invoices(tenantId),
    queryFn: () => invoiceService.getAll(),
    enabled: !!tenantId,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: commercialQueryKeys.invoice(id),
    queryFn: () => invoiceService.getById(id),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: ({
      type,
      clientId,
      requestId,
      itemIds,
      notes,
    }: {
      type: InvoiceType;
      clientId: string;
      requestId?: string;
      itemIds?: string[];
      notes?: string;
    }) => invoiceService.create(type, clientId, requestId, itemIds, notes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: commercialQueryKeys.invoices(tenantId) });
      if (variables.requestId) {
        queryClient.invalidateQueries({
          queryKey: operationsQueryKeys.request(variables.requestId),
        });
        queryClient.invalidateQueries({ queryKey: operationsQueryKeys.requests(tenantId) });
      }
    },
  });
}
