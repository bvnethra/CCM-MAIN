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
  ChevronDown,
  ChevronUp,
  Sliders,
  Search,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  X,
  Clock,
  Mail,
  Copy,
  ArrowRight,
  FileText,
  Activity,
  Hash,
  Laptop,
  ExternalLink,
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
import { MODULES_METADATA, MODULES_PERMISSIONS, ALL_PERMISSION_CODES, DEFAULT_ROLE_PERMISSIONS } from '../../constants/permissions';

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

  const [customPermissions, setCustomPermissions] = useState<string[] | null>(null);
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState<boolean>(true);
  const [showCustomMatrix, setShowCustomMatrix] = useState<boolean>(false);
  const [showEditPermissionsModal, setShowEditPermissionsModal] = useState<boolean>(false);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');

  const selectedRole = useMemo(() => {
    return availableRoles.find((r) => r.id === formData.roleId);
  }, [availableRoles, formData.roleId]);

  const effectivePermissions = useMemo(() => {
    if (customPermissions !== null) return customPermissions;
    if (!selectedRole) return [];
    const roleCode = selectedRole.code || selectedRole.name.toUpperCase().replace(/\s+/g, '_');
    return DEFAULT_ROLE_PERMISSIONS[roleCode] || selectedRole.permissions || ALL_PERMISSION_CODES;
  }, [customPermissions, selectedRole]);

  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [permissionSearchQuery, setPermissionSearchQuery] = useState<string>('');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const filteredModules = useMemo(() => {
    return MODULES_PERMISSIONS.filter((module) => {
      if (selectedModuleFilter !== 'all' && module.id !== selectedModuleFilter) {
        return false;
      }
      if (permissionSearchQuery.trim()) {
        const query = permissionSearchQuery.toLowerCase();
        const nameMatch = module.name.toLowerCase().includes(query);
        const permMatch = module.permissions.some(
          (p) => p.label.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)
        );
        return nameMatch || permMatch;
      }
      return true;
    });
  }, [selectedModuleFilter, permissionSearchQuery]);

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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Security Role (RBAC) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const current = customPermissions !== null ? customPermissions : (selectedRole?.permissions || ALL_PERMISSION_CODES);
                      setEditingPermissions([...current]);
                      setShowEditPermissionsModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-200 transition cursor-pointer"
                    title="Add new permissions or remove options"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Edit Permissions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/roles/new')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-0.5 rounded-lg border border-sky-200 transition cursor-pointer"
                    title="Configure custom role on separate page"
                  >
                    <Sliders className="w-3.5 h-3.5 text-sky-600" />
                    <span>Custom Roles</span>
                  </button>
                </div>
              </div>
              <select
                value={formData.roleId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'CREATE_NEW_ROLE') {
                    navigate('/admin/roles/new');
                  } else {
                    setFormData({ ...formData, roleId: val });
                    setCustomPermissions(null);
                  }
                }}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl transition-all text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-2xs cursor-pointer"
              >
                {availableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
                <option value="CREATE_NEW_ROLE">+ Create Custom Role (Separate Page)...</option>
              </select>
              {customPermissions !== null && (
                <div className="flex items-center justify-between text-[11px] text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 mt-1">
                  <span>Custom overrides: <strong>{customPermissions.length} permissions active</strong></span>
                  <button
                    type="button"
                    onClick={() => setCustomPermissions(null)}
                    className="text-amber-700 hover:text-amber-900 underline font-semibold"
                  >
                    Reset to Default
                  </button>
                </div>
              )}
            </div>
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

      {/* Edit Role Permissions Modal */}
      {showEditPermissionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Edit Permissions — {selectedRole?.name || 'Assigned Security Role'}</span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Add new permissions or remove existing options for this account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPermissionsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Controls & Search */}
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto bg-slate-50/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    {editingPermissions.length} / {ALL_PERMISSION_CODES.length} Granted
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingPermissions([...ALL_PERMISSION_CODES])}
                    className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer"
                  >
                    Grant All
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPermissions([])}
                    className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Module Cards with Toggle Pills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MODULES_PERMISSIONS.map((module) => {
                  const modulePermCodes = module.permissions.map((p) => p.code);
                  const activeInModule = modulePermCodes.filter((c) => editingPermissions.includes(c)).length;
                  const isFullyGranted = activeInModule === modulePermCodes.length;

                  const filteredPerms = module.permissions.filter((p) => {
                    if (!modalSearchQuery.trim()) return true;
                    const q = modalSearchQuery.toLowerCase();
                    return p.label.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
                  });

                  if (filteredPerms.length === 0 && modalSearchQuery.trim()) return null;

                  return (
                    <div key={module.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-900">{module.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">
                            ({activeInModule}/{module.permissions.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isFullyGranted) {
                                setEditingPermissions(editingPermissions.filter((c) => !(modulePermCodes as string[]).includes(c)));
                              } else {
                                const toAdd = (modulePermCodes as string[]).filter((c) => !editingPermissions.includes(c));
                                setEditingPermissions([...editingPermissions, ...toAdd]);
                              }
                            }}
                            className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
                          >
                            {isFullyGranted ? 'Remove All' : 'Add All'}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {filteredPerms.map((p) => {
                          const isGranted = editingPermissions.includes(p.code);
                          return (
                            <button
                              key={p.code}
                              type="button"
                              onClick={() => {
                                if (isGranted) {
                                  setEditingPermissions(editingPermissions.filter((c) => c !== p.code));
                                } else {
                                  setEditingPermissions([...editingPermissions, p.code]);
                                }
                              }}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                                isGranted
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs hover:bg-emerald-100'
                                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                              }`}
                            >
                              <span className={isGranted ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                                {isGranted ? '✓' : '+'}
                              </span>
                              <span>{p.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setCustomPermissions(null);
                  setShowEditPermissionsModal(false);
                  showToast('Permissions reset to default role setting', 'info');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Reset to Role Defaults
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditPermissionsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomPermissions([...editingPermissions]);
                    setShowEditPermissionsModal(false);
                    showToast('Updated permission overrides for user account', 'success');
                  }}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Permission Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

// Helper to format ISO timestamp as DD/MM/YYYY, HH:MM AM/PM
function formatAuditTimestamp(dateStr?: string | Date): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return `${day}/${month}/${year}, ${formattedHours}:${minutes} ${ampm}`;
}

// Helper to format timestamp with timezone descriptor
function formatAuditTimestampWithTz(dateStr?: string | Date): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  const base = formatAuditTimestamp(dateStr);
  try {
    const tzString = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const offsetMinutes = -d.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const offsetMins = String(absOffset % 60).padStart(2, '0');
    return `${base} (${tzString} • UTC${sign}${offsetHours}:${offsetMins})`;
  } catch {
    return base;
  }
}

// Action badge categorization & styling
interface ActionBadgeMeta {
  label: string;
  badgeClass: string;
}

function getActionBadgeMeta(action: string): ActionBadgeMeta {
  const norm = (action || '').toLowerCase().trim();
  let label = action || 'Security Action';
  if (norm.includes('login')) label = 'Login';
  else if (norm.includes('logout')) label = 'Logout';
  else if (norm.includes('create')) label = 'Create Record';
  else if (norm.includes('update') || norm.includes('edit') || norm.includes('modify')) label = 'Update Record';
  else if (norm.includes('delete') || norm.includes('purge') || norm.includes('remove')) label = 'Delete Record';
  else if (norm.includes('permission') || norm.includes('role') || norm.includes('access')) label = 'Permission Change';
  else if (norm.includes('password') || norm.includes('reset') || norm.includes('credential')) label = 'Password Reset';
  else if (norm.includes('export') || norm.includes('download')) label = 'Export Data';

  return {
    label,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/90 font-medium',
  };
}

// Audit Log Detail Modal Component
interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: (AuditLogEntry & { sno?: number }) | null;
}

const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ isOpen, onClose, log }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  const actionMeta = getActionBadgeMeta(log.action);
  const email = log.userEmail || `${log.userName.toLowerCase().replace(/\s+/g, '.')}@company.com`;
  const fullSummary = log.summary || log.recordIdentifier || log.module || 'Action logged in audit trail.';

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Audit Record Details</h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {log.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ISO/IEC 17025 Immutable Security Audit Log
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Identifiers Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Row Index</div>
              <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                #{log.sno ?? '—'}
              </div>
            </div>
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Security Action</div>
              <div className="mt-1">
                <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${actionMeta.badgeClass}`}>
                  {actionMeta.label}
                </span>
              </div>
            </div>
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Result</div>
              <div className="mt-1">
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {log.result || 'SUCCESS'}
                </span>
              </div>
            </div>
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Compliance</div>
              <div className="text-xs font-semibold text-slate-700 mt-1 truncate" title="ISO/IEC 17025 Verified">
                ISO/IEC 17025
              </div>
            </div>
          </div>

          {/* User Account & Authority */}
          <div className="rounded-xl border border-slate-200/80 p-4 bg-white">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">
              User Account & Identity
            </h4>
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {log.userName ? log.userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{log.userName}</span>
                  {log.role && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                      {log.role}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{email}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  User ID: <span className="text-slate-600">{log.userId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp & Location Information */}
          <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">
              Timestamp & Timing
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-mono font-medium">{formatAuditTimestampWithTz(log.timestamp)}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono pl-6">
              ISO Timestamp: {log.timestamp}
            </div>
          </div>

          {/* Module & Affected Target Record */}
          <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Target Record & Module
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Affected Module:</span>
                <span className="font-semibold text-slate-800">{log.module || 'System Core'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Record Identifier:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {log.recordIdentifier || log.recordId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Record Internal ID:</span>
                <span className="font-mono text-slate-600">{log.recordId || log.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tenant / Organization:</span>
                <span className="text-slate-600 font-mono">{log.tenantId || 'tenant_apex'}</span>
              </div>
            </div>
          </div>

          {/* Full Log Summary */}
          <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Full Log Summary & Description
            </h4>
            <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/60 text-xs text-slate-800 leading-relaxed font-sans">
              {fullSummary}
            </div>
          </div>

          {/* Field Changes / Delta (Old Value -> New Value) */}
          {(log.oldValue || log.newValue) && (
            <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Field Modifications (Old Value → New Value)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    <span>Previous Value</span>
                  </div>
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono break-all overflow-x-auto max-h-48">
                    {log.oldValue || '—'}
                  </pre>
                </div>
                <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    <span>Updated Value</span>
                  </div>
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono break-all overflow-x-auto max-h-48">
                    {log.newValue || '—'}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Session & Backend Diagnostics Metadata */}
          <div className="rounded-xl border border-slate-200/80 p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Session & Backend Metadata
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Session ID:</span>
                <span className="font-mono text-slate-700 font-medium">
                  {log.sessionId || 'sess_sec_99182a0b'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Client IP Address:</span>
                <span className="font-mono text-slate-700 font-medium">
                  {log.ipAddress || '192.168.1.42'}
                </span>
              </div>
            </div>

            {log.metadata && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px] mb-1">Additional Metadata Payload:</span>
                <pre className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg text-[11px] font-mono text-slate-600 overflow-x-auto max-h-36">
                  {typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <button
            type="button"
            onClick={handleCopyJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 transition shadow-2xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied JSON!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<(AuditLogEntry & { sno?: number }) | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    auditService.getAll().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  // Map each entry with sequential S.No, formatted User Account, and normalized Security Action
  const formattedLogs = useMemo(() => {
    return logs.map((l, index) => {
      const email = l.userEmail || `${l.userName.toLowerCase().replace(/\s+/g, '.')}@company.com`;
      const userAccountStr = `${l.userName} – ${email}`;
      const actionMeta = getActionBadgeMeta(l.action);
      const summaryPreview = l.summary || l.recordIdentifier || l.module || 'System audit log entry';

      return {
        ...l,
        sno: index + 1,
        userAccount: userAccountStr,
        userEmailAddress: email,
        securityActionLabel: actionMeta.label,
        summaryPreview,
      };
    });
  }, [logs]);

  // Columns in exact required order:
  // 1. S.No
  // 2. User Account
  // 3. Security Action
  // 4. Log Summary
  // 5. Timestamp
  // (Client IP column removed entirely)
  const columns: Column<typeof formattedLogs[0]>[] = [
    {
      key: 'sno',
      header: 'S.No',
      sortable: true,
      width: '60px',
      render: (_l, index) => (
        <span className="font-mono text-xs font-semibold text-slate-500">
          {index}
        </span>
      ),
    },
    {
      key: 'userAccount',
      header: 'User Account',
      sortable: true,
      width: '24%',
      render: (l) => {
        return (
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200/80 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
              {l.userName ? l.userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate text-xs">
              <span className="font-semibold text-slate-900">{l.userName}</span>
              <span className="text-slate-400 mx-1.5 font-normal">–</span>
              <span className="text-slate-500 font-normal">{l.userEmailAddress}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'securityActionLabel',
      header: 'Security Action',
      sortable: true,
      width: '140px',
      render: (l) => {
        const meta = getActionBadgeMeta(l.action);
        return (
          <span
            className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-md border whitespace-nowrap ${meta.badgeClass}`}
          >
            {meta.label}
          </span>
        );
      },
    },
    {
      key: 'summaryPreview',
      header: 'Log Summary',
      render: (l) => {
        return (
          <div className="flex items-center justify-between gap-3 min-w-0 w-full">
            <span
              className="text-xs text-slate-600 truncate min-w-0 flex-1 block"
              title={l.summaryPreview}
            >
              {l.summaryPreview}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 group-hover:text-slate-900 bg-slate-100 group-hover:bg-slate-200/80 px-2 py-0.5 rounded shrink-0 transition-colors border border-slate-200/90">
              <span>View Details</span>
              <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        );
      },
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      width: '170px',
      render: (l) => (
        <span className="font-mono text-xs text-slate-600 whitespace-nowrap">
          {formatAuditTimestamp(l.timestamp)}
        </span>
      ),
    },
  ];

  const handleRowClick = (row: typeof formattedLogs[0]) => {
    setSelectedLog(row);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Trail</h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable ISO/IEC 17025 security log records tracking all user operations and administrative actions.
        </p>
      </div>

      {/* Main Audit Data Table */}
      <DataTable
        data={formattedLogs}
        columns={columns}
        loading={loading}
        fixedLayout={true}
        searchable={true}
        searchPlaceholder="Search records..."
        searchKeys={['userName', 'userAccount', 'securityActionLabel', 'summaryPreview', 'recordIdentifier', 'recordId', 'id']}
        emptyTitle="No records found"
        emptyDescription="There are currently no security audit records to display."
        onRowClick={handleRowClick}
      />

      {/* Detailed Inspection Modal */}
      <AuditLogDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        log={selectedLog}
      />
    </div>
  );
};
