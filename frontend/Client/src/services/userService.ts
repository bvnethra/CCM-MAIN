import { User, UserFormData, UserRole } from '../types/user';
import { Role, RoleFormData } from '../types/role';
import { Permission } from '../types/permission';
import { mockStore } from '../mock/initialStore';
import { MODULES_METADATA } from '../constants/permissions';

export const userService = {
  async getAll(): Promise<User[]> {
    await new Promise((res) => setTimeout(res, 150));
    return [...mockStore.data.users];
  },

  async getById(id: string): Promise<User | null> {
    await new Promise((res) => setTimeout(res, 100));
    const user = mockStore.data.users.find((u) => u.id === id);
    return user ? { ...user } : null;
  },

  async create(data: UserFormData): Promise<User> {
    await new Promise((res) => setTimeout(res, 200));
    const role = mockStore.data.roles.find((r) => r.id === data.roleId);
    const tenant = mockStore.data.tenants.find((t) => t.id === data.tenantId);
    const org = mockStore.data.organizations.find((o) => o.id === data.organizationId);

    // Map role name to UserRole enum key
    let mappedRole: UserRole = 'ADMIN';
    if (role) {
      const lower = role.name.toLowerCase();
      if (lower.includes('super')) mappedRole = 'SUPER_ADMIN';
      else if (lower.includes('collection')) mappedRole = 'COLLECTION_AGENT';
      else if (lower.includes('lab')) mappedRole = 'LAB_USER';
      else if (lower.includes('commercial')) mappedRole = 'COMMERCIAL_USER';
      else if (lower.includes('approver')) mappedRole = 'APPROVER';
      else if (lower.includes('dispatch')) mappedRole = 'DISPATCH_USER';
      else mappedRole = 'ADMIN';
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      tenantId: data.tenantId,
      tenantName: tenant?.name || 'Unknown Tenant',
      organizationId: data.organizationId,
      organizationName: org?.companyName || 'Unknown Organization',
      roleId: data.roleId,
      role: mappedRole,
      roleName: role?.name || 'Custom Role',
      status: data.status,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
    };

    mockStore.data.users.unshift(newUser);
    return newUser;
  },

  async update(id: string, data: Partial<UserFormData>): Promise<User> {
    await new Promise((res) => setTimeout(res, 200));
    const index = mockStore.data.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found');

    const currentUser = mockStore.data.users[index];
    let role = mockStore.data.roles.find((r) => r.id === (data.roleId || currentUser.roleId));
    let org = mockStore.data.organizations.find((o) => o.id === (data.organizationId || currentUser.organizationId));
    let tenant = mockStore.data.tenants.find((t) => t.id === (data.tenantId || currentUser.tenantId));

    const updated: User = {
      ...currentUser,
      ...data,
      roleName: role ? role.name : currentUser.roleName,
      organizationName: org ? org.companyName : currentUser.organizationName,
      tenantName: tenant ? tenant.name : currentUser.tenantName,
    };
    mockStore.data.users[index] = updated;
    return updated;
  },

  async delete(id: string): Promise<void> {
    await new Promise((res) => setTimeout(res, 200));
    mockStore.data.users = mockStore.data.users.filter((u) => u.id !== id);
  },
};

export const roleService = {
  async getAll(): Promise<Role[]> {
    await new Promise((res) => setTimeout(res, 150));
    const users = mockStore.data.users || [];
    mockStore.data.roles.forEach((r) => {
      r.userCount = users.filter(
        (u) => u.roleId === r.id || u.roleName?.toLowerCase() === r.name?.toLowerCase()
      ).length;
    });
    return [...mockStore.data.roles];
  },

  async getById(id: string): Promise<Role | null> {
    await new Promise((res) => setTimeout(res, 100));
    const role = mockStore.data.roles.find((r) => r.id === id);
    return role ? { ...role } : null;
  },

  async create(data: RoleFormData): Promise<Role> {
    await new Promise((res) => setTimeout(res, 200));
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: data.name,
      description: data.description,
      status: data.status,
      userCount: 0,
      permissions: data.permissions,
      createdDate: new Date().toISOString().split('T')[0],
    };
    mockStore.data.roles.unshift(newRole);
    return newRole;
  },

  async update(id: string, data: Partial<RoleFormData>): Promise<Role> {
    await new Promise((res) => setTimeout(res, 200));
    const index = mockStore.data.roles.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Role not found');

    const updated: Role = {
      ...mockStore.data.roles[index],
      ...data,
    };
    mockStore.data.roles[index] = updated;
    return updated;
  },

  async delete(id: string): Promise<void> {
    await new Promise((res) => setTimeout(res, 200));
    mockStore.data.roles = mockStore.data.roles.filter((r) => r.id !== id);
  },
};

export const permissionService = {
  async getAll(): Promise<Permission[]> {
    await new Promise((res) => setTimeout(res, 100));
    const list: Permission[] = [];
    MODULES_METADATA.forEach((mod) => {
      mod.actions.forEach((act) => {
        list.push({
          id: `${mod.id}.${act}`,
          code: `${mod.id.replace(/s$/, '')}.${act}`,
          module: mod.id as any,
          action: act as any,
          name: `${act.toUpperCase()} ${mod.name}`,
          description: `Permission to ${act} records in ${mod.name} module`,
        });
      });
    });
    return list;
  },
};
