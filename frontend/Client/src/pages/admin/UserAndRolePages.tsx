import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users,
  Plus,
  ShieldAlert,
  KeyRound,
  History,
  Check,
  Edit2,
  Trash2,
  Power,
  ShieldCheck,
  Shield,
  CheckSquare,
  Square,
  Filter,
  ArrowLeft,
  Save,
  Building2,
  UserCheck,
} from 'lucide-react';
import { User, UserFormData } from '../../types/user';
import { Role } from '../../types/role';
import { Tenant } from '../../types/tenant';
import { Organization } from '../../types/organization';
import { AuditLogEntry } from '../../types/dispatch';
import { userService, roleService } from '../../services/userService';
import { tenantService } from '../../services/tenantService';
import { organizationService } from '../../services/organizationService';
import { auditService } from '../../services/executionServices';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DeleteModal } from '../../components/modals/AppModals';
import { TextInput, SelectInput, PasswordInput, Textarea } from '../../components/forms/FormControls';
import { useNotification } from '../../context/NotificationContext';
import { MODULES_METADATA, MODULES_PERMISSIONS, ALL_PERMISSION_CODES } from '../../constants/permissions';

export const UserListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const navigate = useNavigate();
  const { showToast } = useNotification();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch {
      showToast('Unable to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await userService.delete(userToDelete.id);
      showToast('User account removed', 'info');
      setDeleteModalOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch {
      showToast('Failed to delete user', 'error');
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'fullName',
      header: 'User Profile',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
            {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-slate-900 block text-xs truncate">{u.fullName}</span>
            <span className="text-[11px] text-slate-400 block truncate">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'roleName',
      header: 'Assigned Role',
      sortable: true,
      render: (u) => {
        const isSuper = u.role === 'SUPER_ADMIN';
        const isAdmin = u.role === 'ADMIN';
        return (
          <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-1 rounded-lg border ${
            isSuper
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : isAdmin
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {u.roleName}
          </span>
        );
      },
    },
    {
      key: 'tenantName',
      header: 'Tenant',
      sortable: true,
      render: (u) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-xs text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {u.tenantName || '—'}
        </span>
      ),
    },
    {
      key: 'organizationName',
      header: 'Organisation',
      sortable: true,
      render: (u) => (
        <span className="font-medium text-xs text-slate-600 truncate max-w-[160px] block">
          {u.organizationName || '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Contact Phone',
      render: (u) => <span className="font-mono text-xs text-slate-600">{u.phone || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <StatusBadge status={u.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/admin/users/edit/${u.id}`)}
            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
            title="Edit User"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setUserToDelete(u);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete User"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Users & Security Accounts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage laboratory staff, commercial managers, quality approvers, and field collection agents.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/users/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Add User Account
        </button>
      </div>

      <DataTable data={users} columns={columns} loading={loading} />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete User Account"
        itemName={userToDelete?.fullName}
        message="Are you sure you want to revoke and delete this corporate user account?"
      />
    </div>
  );
};

export const AddUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [submitting, setSubmitting] = useState(false);

  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);

  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    email: '',
    phone: '',
    tenantId: '',
    organizationId: '',
    roleId: '',
    status: 'ACTIVE',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    Promise.all([
      roleService.getAll(),
      tenantService.getAll(),
      organizationService.getAll(),
    ]).then(([roles, tenants, orgs]) => {
      setAvailableRoles(roles);
      setAvailableTenants(tenants);
      setAvailableOrgs(orgs);

      if (!isEdit) {
        const defaultTenant = tenants[0]?.id || '';
        const defaultOrg = orgs.find((o) => o.tenantId === defaultTenant)?.id || orgs[0]?.id || '';
        const defaultRole = roles[0]?.id || '';
        setFormData((prev) => ({
          ...prev,
          tenantId: prev.tenantId || defaultTenant,
          organizationId: prev.organizationId || defaultOrg,
          roleId: prev.roleId || defaultRole,
        }));
      }
    });
  }, [isEdit]);

  useEffect(() => {
    if (isEdit && id) {
      userService.getById(id).then((u) => {
        if (u) {
          setFormData({
            fullName: u.fullName,
            email: u.email,
            phone: u.phone,
            tenantId: u.tenantId,
            organizationId: u.organizationId,
            roleId: u.roleId,
            status: u.status,
          });
        }
      });
    }
  }, [id, isEdit]);

  const filteredOrgs = useMemo(() => {
    if (!formData.tenantId) return availableOrgs;
    return availableOrgs.filter((o) => o.tenantId === formData.tenantId);
  }, [availableOrgs, formData.tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      showToast('Name and corporate email are required', 'warning');
      return;
    }
    if (!formData.roleId) {
      showToast('Please select an assigned security role', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await userService.update(id, formData);
        showToast('User profile updated successfully', 'success');
      } else {
        await userService.create(formData);
        showToast('New user account provisioned', 'success');
      }
      navigate('/admin/users');
    } catch {
      showToast('Failed to save user account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to User Accounts
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {isEdit ? 'Edit User Profile' : 'Add New User Account'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision access for laboratory personnel, commercial staff, or quality managers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Full Name"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Dr. Vikram Mehta"
            />
            <TextInput
              type="email"
              label="Corporate Email Address"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@company.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Contact Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
            <SelectInput
              label="Security Role (RBAC)"
              required
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              options={availableRoles.map((r) => ({
                value: r.id,
                label: r.name,
              }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectInput
              label="Associated Tenant"
              required
              value={formData.tenantId}
              onChange={(e) => {
                const newTenantId = e.target.value;
                const orgsForTenant = availableOrgs.filter((o) => o.tenantId === newTenantId);
                setFormData({
                  ...formData,
                  tenantId: newTenantId,
                  organizationId: orgsForTenant[0]?.id || '',
                });
              }}
              options={availableTenants.map((t) => ({
                value: t.id,
                label: `${t.name} (${t.code || 'Tenant'})`,
              }))}
            />
            <SelectInput
              label="Assigned Organisation"
              required
              value={formData.organizationId}
              onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
              options={
                filteredOrgs.length > 0
                  ? filteredOrgs.map((o) => ({
                      value: o.id,
                      label: o.companyName,
                    }))
                  : [{ value: '', label: 'No Organisations available for this Tenant' }]
              }
            />
          </div>

          {!isEdit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordInput
                label="Initial Password"
                required
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••"
              />
              <PasswordInput
                label="Confirm Password"
                required
                value={formData.confirmPassword || ''}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••••••"
              />
            </div>
          )}

          <SelectInput
            label="Account Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'SUSPENDED', label: 'Suspended' },
            ]}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Save Changes' : 'Create User Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const RoleListPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    roleService.getAll().then((data) => {
      setRoles(data);
      setLoading(false);
    });
  }, []);

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'Role Name',
      sortable: true,
      render: (r) => (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-xs block">{r.name}</span>
            <span className="text-[11px] text-slate-500 line-clamp-2 max-w-md">{r.description}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status || 'ACTIVE'} size="sm" />,
    },
    {
      key: 'permissionsCount',
      header: 'Granted Permissions',
      render: (r) => {
        const isAll = r.permissions.length >= ALL_PERMISSION_CODES.length;
        return (
          <span className={`font-mono text-xs font-semibold px-2.5 py-1 rounded-lg border ${
            isAll
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : 'text-sky-700 bg-sky-50 border-sky-200/70'
          }`}>
            {isAll ? `All ${r.permissions.length} Permissions` : `${r.permissions.length} Permissions`}
          </span>
        );
      },
    },
    {
      key: 'userCount',
      header: 'Assigned Users',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-700 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          {r.userCount || 0} User Accounts
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          onClick={() => navigate(`/admin/roles/${r.id}`)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
          title="Configure Matrix"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Configure</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security Roles & Permissions Matrix</h1>
          <p className="text-xs text-slate-500 mt-1">
            Define granular RBAC permissions across multi-tenant calibration and commercial modules.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/roles/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Create Custom Role
        </button>
      </div>

      <DataTable data={roles} columns={columns} loading={loading} />
    </div>
  );
};

export const RoleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';

  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      roleService.getById(id).then((role) => {
        if (role) {
          setRoleName(role.name);
          setDescription(role.description || '');
          setSelectedPermissions(role.permissions || []);
        }
      });
    }
  }, [id, isEdit]);

  const togglePermission = (code: string) => {
    if (selectedPermissions.includes(code)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== code));
    } else {
      setSelectedPermissions([...selectedPermissions, code]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      showToast('Role name is required', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await roleService.update(id, {
          name: roleName,
          description,
          permissions: selectedPermissions,
          status: 'ACTIVE',
        });
      } else {
        await roleService.create({
          name: roleName,
          description,
          permissions: selectedPermissions,
          status: 'ACTIVE',
        });
      }
      showToast(`Security role saved successfully!`, 'success');
      navigate('/admin/roles');
    } catch {
      showToast('Failed to save role', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/admin/roles')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Roles Matrix
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {isEdit ? 'Configure Role Matrix' : 'Create Custom Security Role'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Specify permissions for viewing, creating, approving, and signing commercial calibration operations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Role Name"
              required
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Senior Quality Auditor"
            />
            <TextInput
              label="Role Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Role scope and authority summary..."
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Module Permissions Matrix
                </h3>
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  {selectedPermissions.length} of {ALL_PERMISSION_CODES.length} Granted
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPermissions([...ALL_PERMISSION_CODES])}
                  className="text-xs font-medium px-3 py-1 bg-white border border-slate-200 hover:border-sky-300 hover:text-sky-600 rounded-lg shadow-2xs transition"
                >
                  Select All ({ALL_PERMISSION_CODES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPermissions([])}
                  className="text-xs font-medium px-3 py-1 bg-white border border-slate-200 hover:border-rose-300 hover:text-rose-600 rounded-lg shadow-2xs transition"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODULES_PERMISSIONS.map((mod) => {
                const allModuleCodes: string[] = mod.permissions.map((p) => p.code as string);
                const isAllSelected = allModuleCodes.every((c) => selectedPermissions.includes(c));

                const toggleAllModule = () => {
                  if (isAllSelected) {
                    setSelectedPermissions(selectedPermissions.filter((c) => !allModuleCodes.includes(c)));
                  } else {
                    const toAdd = allModuleCodes.filter((c) => !selectedPermissions.includes(c));
                    setSelectedPermissions([...selectedPermissions, ...toAdd]);
                  }
                };

                return (
                  <div
                    key={mod.id}
                    className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{mod.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({mod.permissions.filter((p) => selectedPermissions.includes(p.code)).length}/{mod.permissions.length})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={toggleAllModule}
                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                      >
                        {isAllSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      {mod.permissions.map((p) => {
                        const isChecked = selectedPermissions.includes(p.code);
                        return (
                          <label
                            key={p.code}
                            className={`flex items-start gap-2.5 p-2 rounded-xl border transition cursor-pointer select-none ${
                              isChecked
                                ? 'bg-sky-50/90 border-sky-200 text-sky-950 shadow-2xs'
                                : 'bg-white border-slate-200/70 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(p.code)}
                              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                            />
                            <div className="flex-1">
                              <span className="font-semibold block text-xs">
                                {p.label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{p.code}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/admin/roles')}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Role Matrix</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const PermissionListPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Permissions Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete catalog of atomic security permissions enforcing system access controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULES_PERMISSIONS.map((mod) => (
          <div key={mod.id} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-elevation space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs text-slate-900">{mod.name}</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {mod.permissions.length} actions
              </span>
            </div>
            <div className="space-y-2 text-xs">
              {mod.permissions.map((p) => (
                <div key={p.code} className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">
                      {p.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{p.code}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200/60">
                    {p.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditService.getAll().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (l) => <span className="font-mono text-xs text-slate-500">{l.timestamp}</span>,
    },
    {
      key: 'userName',
      header: 'User Account',
      sortable: true,
      render: (l) => <span className="font-semibold text-slate-900 text-xs">{l.userName}</span>,
    },
    {
      key: 'action',
      header: 'Security Action',
      sortable: true,
      render: (l) => (
        <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
          {l.action}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Log Summary',
      render: (l) => <span className="text-xs text-slate-600">{l.recordIdentifier || l.module}</span>,
    },
    {
      key: 'ipAddress',
      header: 'Client IP',
      render: (l) => <span className="font-mono text-xs text-slate-400">{l.ipAddress || '127.0.0.1'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Trail</h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable ISO/IEC 17025 security log records tracking all user operations and administrative actions.
        </p>
      </div>

      <DataTable data={logs} columns={columns} loading={loading} />
    </div>
  );
};
