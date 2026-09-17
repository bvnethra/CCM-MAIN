import { RequestWorkflowStatus, RequestExceptionStatus, RequestStatus } from '../types/request';

export interface WorkflowStageInfo {
  status: RequestWorkflowStatus;
  label: string;
  shortLabel: string;
  description: string;
  order: number;
}

export const WORKFLOW_STAGES: WorkflowStageInfo[] = [
  { status: 'CREATED', label: 'Created', shortLabel: 'Created', description: 'Request initiated by client or collection agent', order: 1 },
  { status: 'COLLECTED', label: 'Collected', shortLabel: 'Collected', description: 'Physical items picked up and logged', order: 2 },
  { status: 'LAB_QUEUE', label: 'Lab Queue', shortLabel: 'Lab Queue', description: 'Items arrived at laboratory intake', order: 3 },
  { status: 'VERIFICATION', label: 'Verification', shortLabel: 'Verification', description: 'Physical condition, serial & quantity inspection', order: 4 },
  { status: 'CALIBRATION', label: 'Calibration In Progress', shortLabel: 'Calibration', description: 'Metrology testing & measurements', order: 5 },
  { status: 'CALIBRATED', label: 'Calibrated', shortLabel: 'Calibrated', description: 'Test passed, certificate generated', order: 6 },
  { status: 'QUOTATION', label: 'Quotation', shortLabel: 'Quotation', description: 'Commercial quotation created with pricing', order: 7 },
  { status: 'APPROVAL', label: 'Approval', shortLabel: 'Approval', description: 'Internal & client approval of quotation', order: 8 },
  { status: 'INVOICE', label: 'Invoice / PO', shortLabel: 'Invoice', description: 'Commercial invoice generated', order: 9 },
  { status: 'CLIENT_SIGN', label: 'Client Sign', shortLabel: 'Client Sign', description: 'Client digital signature on invoice', order: 10 },
  { status: 'READY_TO_DISPATCH', label: 'Ready to Dispatch', shortLabel: 'Ready', description: 'Packaging and security clearance complete', order: 11 },
  { status: 'DISPATCHED', label: 'Dispatched', shortLabel: 'Dispatched', description: 'In transit via courier or logistics', order: 12 },
  { status: 'CLIENT_RECEIVED', label: 'Client Received', shortLabel: 'Received', description: 'Shipment delivered to client premises', order: 13 },
  { status: 'DELIVERY_SIGNED', label: 'Delivery Signed', shortLabel: 'Signed', description: 'Acknowledgement of receipt signed by client', order: 14 },
  { status: 'COMPLETED', label: 'Completed', shortLabel: 'Completed', description: 'Order fulfilled and closed', order: 15 },
];

export const EXCEPTION_STATUSES: Record<RequestExceptionStatus, { label: string; color: string; description: string }> = {
  ON_HOLD: { label: 'On Hold', color: 'amber', description: 'Paused pending lab or client clarification' },
  DISCREPANCY: { label: 'Discrepancy', color: 'rose', description: 'Physical item mismatch vs documentation' },
  FAULTY: { label: 'Faulty', color: 'rose', description: 'Item failed calibration; requires maintenance/service' },
  OUTSOURCED: { label: 'Outsourced', color: 'purple', description: 'Sent to accredited external vendor lab' },
  PARTIALLY_COMPLETED: { label: 'Partially Completed', color: 'blue', description: 'Some items calibrated/ready while others pending' },
  REJECTED: { label: 'Rejected', color: 'rose', description: 'Commercial or technical rejection' },
  CANCELLED: { label: 'Cancelled', color: 'slate', description: 'Request cancelled' },
};

export const STATUS_UI_ACTIONS: Record<RequestStatus, { actionText: string; route?: string; modal?: string }> = {
  CREATED: { actionText: 'Submit Request', route: '/collection' },
  COLLECTED: { actionText: 'Move to Lab Queue', route: '/lab/queue' },
  LAB_QUEUE: { actionText: 'Start Verification', route: '/lab/queue' },
  VERIFICATION: { actionText: 'Verify Items & Docs', route: '/verification' },
  CALIBRATION: { actionText: 'Perform Calibration', route: '/calibration' },
  CALIBRATED: { actionText: 'Create Quotation', route: '/commercial/quotations/new' },
  QUOTATION: { actionText: 'Submit for Approval', route: '/commercial/quotations' },
  APPROVAL: { actionText: 'Review & Approve', route: '/commercial/approvals' },
  INVOICE: { actionText: 'Generate Invoice', route: '/commercial/invoices' },
  CLIENT_SIGN: { actionText: 'Capture Signature', route: '/signatures' },
  READY_TO_DISPATCH: { actionText: 'Create Dispatch', route: '/dispatch' },
  DISPATCHED: { actionText: 'Track Shipment', route: '/dispatch' },
  CLIENT_RECEIVED: { actionText: 'Capture Delivery Sign', route: '/deliveries' },
  DELIVERY_SIGNED: { actionText: 'Complete Request' },
  COMPLETED: { actionText: 'View Archive' },
  ON_HOLD: { actionText: 'Resume Request' },
  DISCREPANCY: { actionText: 'Resolve Discrepancy' },
  FAULTY: { actionText: 'Initiate Service Repair' },
  OUTSOURCED: { actionText: 'Track Vendor PO' },
  PARTIALLY_COMPLETED: { actionText: 'Process Ready Items' },
  REJECTED: { actionText: 'Review Rejection' },
  CANCELLED: { actionText: 'Reopen Request' },
};
