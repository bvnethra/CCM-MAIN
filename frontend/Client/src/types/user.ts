export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'COLLECTION_AGENT' 
  | 'LAB_USER' 
  | 'COMMERCIAL_USER' 
  | 'APPROVER' 
  | 'DISPATCH_USER';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  tenantId: string;
  tenantName?: string;
  organizationId: string;
  organizationName?: string;
  roleId: string;
  role: UserRole;
  roleName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatarUrl?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface UserFormData {
  fullName: string;
  email: string;
  phone: string;
  tenantId: string;
  organizationId: string;
  roleId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  password?: string;
  confirmPassword?: string;
}
