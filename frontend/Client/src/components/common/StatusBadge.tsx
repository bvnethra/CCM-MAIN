import React from 'react';
import { RequestStatus } from '../../types/request';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const norm = (status || '').toUpperCase().replace(/\s+/g, '_');

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  // Workflow states
  switch (norm) {
    case 'CREATED':
    case 'DRAFT':
    case 'PENDING':
      colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
      dotColor = 'bg-slate-400';
      break;
    case 'COLLECTED':
    case 'LAB_QUEUE':
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
      dotColor = 'bg-sky-500';
      break;
    case 'VERIFICATION':
    case 'IN_PROGRESS':
    case 'IN_TRANSIT':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-500';
      break;
    case 'CALIBRATION':
    case 'PACKED':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      dotColor = 'bg-indigo-500';
      break;
    case 'CALIBRATED':
    case 'VERIFIED':
    case 'ACTIVE':
    case 'SIGNED':
    case 'APPROVED':
    case 'RECEIVED':
    case 'SIGNATURE_CAPTURED':
    case 'DELIVERY_SIGNED':
    case 'COMPLETED':
    case 'PAID':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      break;
    case 'QUOTATION':
    case 'INVOICE':
    case 'ISSUED':
    case 'SENT_TO_CLIENT':
    case 'READY_TO_DISPATCH':
      colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
      dotColor = 'bg-teal-500';
      break;
    case 'APPROVAL':
    case 'CLIENT_SIGN':
    case 'PENDING_APPROVAL':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      dotColor = 'bg-amber-500';
      break;
    case 'DISPATCHED':
      colorClasses = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      dotColor = 'bg-cyan-500';
      break;
    case 'CLIENT_RECEIVED':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      dotColor = 'bg-emerald-600';
      break;
    // Exception states
    case 'ON_HOLD':
    case 'REVISION_REQUIRED':
      colorClasses = 'bg-amber-100 text-amber-900 border-amber-300';
      dotColor = 'bg-amber-600';
      break;
    case 'DISCREPANCY':
    case 'FAULTY':
    case 'SHORT':
    case 'REJECTED':
    case 'SUSPENDED':
    case 'OVERDUE':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      break;
    case 'OUTSOURCED':
    case 'OUTSOURCE':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      dotColor = 'bg-purple-500';
      break;
    case 'PARTIALLY_COMPLETED':
    case 'PARTIAL':
      colorClasses = 'bg-indigo-100 text-indigo-800 border-indigo-300';
      dotColor = 'bg-indigo-600';
      break;
    case 'CANCELLED':
    case 'INACTIVE':
      colorClasses = 'bg-slate-200 text-slate-600 border-slate-300';
      dotColor = 'bg-slate-400';
      break;
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3.5 py-1.5 font-semibold',
  }[size];

  const formattedLabel = norm
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs tracking-wide uppercase font-mono ${colorClasses} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      {formattedLabel}
    </span>
  );
};
