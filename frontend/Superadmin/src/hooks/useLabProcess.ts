/**
 * TanStack Query hooks for Lab Verification (Process Step 2)
 * and Metrology Calibration (Process Step 3).
 *
 * Mutations invalidate both labQueue and calibrationRequests keys
 * to keep all list views fresh after each state transition.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationService } from '../services/verificationService';
import { calibrationService } from '../services/calibrationService';
import { VerificationFormData } from '../types/verification';
import { CalibrationEntryFormData, CalibrationDueItem } from '../types/calibration';
import { useAuth } from '../context/AuthContext';
import { operationsQueryKeys } from './useOperations';

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const labQueryKeys = {
  dueList: (tenantId: string, filter?: string) => ['calibrationDueList', tenantId, filter ?? 'ALL'] as const,
  certificate: (certNumber: string) => ['certificate', certNumber] as const,
};

// ─── Calibration Due List ────────────────────────────────────────────────────

export function useCalibrationDueList(filter?: CalibrationDueItem['status'] | 'ALL') {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useQuery({
    queryKey: labQueryKeys.dueList(tenantId, filter),
    queryFn: () => calibrationService.getDueList(filter as any),
    enabled: !!tenantId,
  });
}

// ─── Certificate Lookup ──────────────────────────────────────────────────────

export function useCertificate(certNumber: string) {
  return useQuery({
    queryKey: labQueryKeys.certificate(certNumber),
    queryFn: () => calibrationService.getCertificate(certNumber),
    enabled: !!certNumber,
  });
}

// ─── Submit Verification (Process Step 2) ───────────────────────────────────

export function useSubmitVerification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: (data: VerificationFormData) => verificationService.submitVerification(data),
    onSuccess: (_data, variables) => {
      // Invalidate the specific request AND the full lab queue
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.request(variables.requestId) });
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.labQueue(tenantId) });
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.requests(tenantId) });
    },
  });
}

// ─── Submit Calibration (Process Step 3) ────────────────────────────────────

export function useSubmitCalibration() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? '';

  return useMutation({
    mutationFn: (data: CalibrationEntryFormData) => calibrationService.submitCalibration(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.request(variables.requestId) });
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.requests(tenantId) });
      queryClient.invalidateQueries({ queryKey: operationsQueryKeys.labQueue(tenantId) });
      queryClient.invalidateQueries({ queryKey: labQueryKeys.dueList(tenantId) });
    },
  });
}
