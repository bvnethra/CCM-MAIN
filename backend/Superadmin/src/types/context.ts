export interface UserSecurityContext {
    userId: string;
    tenantId: string;
    organizationId: string;
    email?: string;
    roles: string[];
    permissions: string[];
}
