export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export type PermissionModule = 
  | 'tenants' 
  | 'organizations' 
  | 'users' 
  | 'roles' 
  | 'permissions' 
  | 'clients' 
  | 'vendors' 
  | 'items' 
  | 'requests' 
  | 'calibration' 
  | 'quotations' 
  | 'approvals' 
  | 'invoices' 
  | 'signatures' 
  | 'dispatch' 
  | 'deliveries' 
  | 'auditLogs';

export interface Permission {
  id: string;
  code: string; // e.g., 'client.view', 'quotation.approve'
  module: PermissionModule;
  action: PermissionAction;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  userCount: number;
  permissions: string[]; // List of permission codes e.g. ['client.view', 'client.create']
  createdDate: string;
}

export interface RoleFormData {
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  permissions: string[];
}
