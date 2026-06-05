'use client';

import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { PaginationBar } from '@/components/admin/pagination-bar';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ListSkeleton } from '@/components/shared/list-skeleton';
import { useDeleteOrgUser, useOrganizations, useUpdateOrgUser } from '@/hooks/use-admin';
import { useOrgUsers, useCreateOrgUser } from '@/hooks/use-org-users';
import { formatRoleLabel, isPlatformSuperAdmin } from '@/lib/roles';
import type { OrgUserRecord, UserRole } from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { Users as UsersIcon } from 'lucide-react';

function roleLabel(role: string): string {
  return formatRoleLabel(role);
}

function isProtectedRole(role: string): boolean {
  return role === 'platform_super_admin' || role === 'tenant_admin' || role === 'platform_support';
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const typed = error as { response?: { data?: { message?: string } }; message?: string };
    return typed.response?.data?.message ?? typed.message ?? fallback;
  }
  return fallback;
}

type CreateUserFormState = {
  email: string;
  fullName: string;
  role: UserRole;
  password: string;
  organizationId: string;
};

type EditUserFormState = {
  fullName: string;
  role: UserRole;
  isActive: boolean;
};

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = isPlatformSuperAdmin(currentUser?.role);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const limit = 15;
  const updateUser = useUpdateOrgUser();
  const deleteUser = useDeleteOrgUser();
  const { data: organizations } = useOrganizations(Boolean(isSuperAdmin));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserFormState>({
    email: '',
    fullName: '',
    role: 'employee',
    password: '',
    organizationId: currentUser?.organizationId ?? '',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<OrgUserRecord | null>(null);
  const [editForm, setEditForm] = useState<EditUserFormState>({
    fullName: '',
    role: 'employee',
    isActive: true,
  });
  const [editError, setEditError] = useState<string | null>(null);

  const createUser = useCreateOrgUser();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await createUser.mutateAsync({
        email: createForm.email.trim(),
        fullName: createForm.fullName.trim(),
        role: isSuperAdmin ? createForm.role : 'employee',
        password: createForm.password,
        organizationId: isSuperAdmin ? createForm.organizationId.trim() : undefined,
      });
      setIsCreateOpen(false);
      setCreateForm({
        email: '',
        fullName: '',
        role: 'employee',
        password: '',
        organizationId: selectedOrganizationId || currentUser?.organizationId || '',
      });
    } catch (err: unknown) {
      setCreateError(getErrorMessage(err, 'Failed to create user'));
    }
  };

  const openCreateModal = () => {
    setCreateError(null);
    setCreateForm({
      email: '',
      fullName: '',
      role: 'employee',
      password: '',
      organizationId: selectedOrganizationId || currentUser?.organizationId || '',
    });
    setIsCreateOpen(true);
  };

  const openEditModal = (user: OrgUserRecord) => {
    setEditingUser(user);
    setEditError(null);
    setEditForm({
      fullName: user.fullName ?? '',
      role: user.role,
      isActive: user.isActive,
    });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditError(null);
    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        fullName: editForm.fullName.trim(),
        role: isSuperAdmin ? editForm.role : undefined,
        isActive: editForm.isActive,
      });
      setEditingUser(null);
    } catch (err: unknown) {
      setEditError(getErrorMessage(err, 'Failed to update user'));
    }
  };

  const handleDeleteUser = async (user: OrgUserRecord) => {
    if (!window.confirm(`Delete ${user.fullName ?? user.email}?`)) {
      return;
    }

    try {
      await deleteUser.mutateAsync(user.id);
    } catch {
      /* surface later */
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useOrgUsers({
    page,
    limit,
    q: debouncedQ || undefined,
    organizationId: isSuperAdmin && selectedOrganizationId ? selectedOrganizationId : undefined,
  });

  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? 0) / limit));

  const columns: DataTableColumn<OrgUserRecord>[] = [
    {
      key: 'user',
      header: 'User',
      className: 'min-w-[200px]',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.fullName ?? row.email}</p>
          <p className="text-xs text-text-tertiary">{row.email}</p>
        </div>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            key: 'organization',
            header: 'Organization',
            className: 'min-w-[150px]',
            render: (row: OrgUserRecord) => <span>{row.organizationName ?? row.organizationId}</span>,
          } satisfies DataTableColumn<OrgUserRecord>,
        ]
      : []),
    {
      key: 'role',
      header: 'Role',
      className: 'w-[120px]',
      render: (row) => <Badge variant="default">{roleLabel(row.role)}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[100px]',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'error'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'lastActive',
      header: 'Last active',
      className: 'w-[140px]',
      render: (row) => (
        <span className="text-xs text-text-tertiary">
          {row.lastActiveAt ? new Date(row.lastActiveAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[120px] text-right',
      render: (row) => {
        const isProtected = isProtectedRole(row.role);
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditModal(row)}
              disabled={isProtected || updateUser.isPending}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={row.id === currentUser?.id || isProtected || deleteUser.isPending}
              onClick={() => handleDeleteUser(row)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description={
          isSuperAdmin
            ? 'Manage managers and employees across organizations'
            : 'Create and manage employee accounts in your organization'
        }
        action={
          <Button onClick={openCreateModal}>Add User</Button>
        }
      />

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">Create New User</h3>
            {createError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 mb-4">
                {createError}
              </p>
            )}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                  Full Name
                </label>
                <Input
                  required
                  placeholder="e.g. Sales Employee"
                  value={createForm.fullName}
                  onChange={(e) =>
                    setCreateForm((current) => ({ ...current, fullName: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                  Email
                </label>
                <Input
                  required
                  type="email"
                  placeholder="e.g. employee@cardvault.local"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((current) => ({ ...current, email: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                  Password
                </label>
                <Input
                  required
                  type="password"
                  placeholder="At least 8 characters"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((current) => ({ ...current, password: e.target.value }))
                  }
                  minLength={8}
                />
              </div>

              {isSuperAdmin ? (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                      Role
                    </label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      value={createForm.role}
                      onChange={(e) =>
                        setCreateForm((current) => ({
                          ...current,
                          role: e.target.value as UserRole,
                        }))
                      }
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                      Organization
                    </label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      value={createForm.organizationId}
                      onChange={(e) =>
                        setCreateForm((current) => ({
                          ...current,
                          organizationId: e.target.value,
                        }))
                      }
                    >
                      <option value="" disabled>
                        Select organization
                      </option>
                      {organizations?.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                    Role
                  </label>
                  <Input value="Employee" disabled />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setCreateError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-4">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isSuperAdmin ? (
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring md:max-w-sm"
              value={selectedOrganizationId}
              onChange={(e) => {
                setSelectedOrganizationId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All organizations</option>
              {organizations?.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            keyField={(r) => r.id}
            isLoading={isLoading}
            emptyState={
              <EmptyState
                icon={UsersIcon}
                title="No users yet"
                description={
                  isSuperAdmin
                    ? "Create a user to assign them to organizations."
                    : "Invite your first salesperson to start scanning cards."
                }
                actionLabel="Add User"
                onAction={openCreateModal}
              />
            }
          />
          {!isLoading && data?.items && data.items.length > 0 && (
            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={data?.meta.total ?? 0}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      {editingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Edit User</h3>

            {editError ? (
              <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                {editError}
              </p>
            ) : null}

            <form onSubmit={handleEditUser} className="space-y-4">
              <Input label="Email" value={editingUser.email} disabled />
              <Input
                label="Full Name"
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm((current) => ({ ...current, fullName: e.target.value }))
                }
              />

              {isSuperAdmin ? (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                    Role
                  </label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm((current) => ({
                        ...current,
                        role: e.target.value as UserRole,
                      }))
                    }
                    disabled={isProtectedRole(editingUser.role)}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="tenant_admin">Tenant Admin</option>
                    {editingUser.role === 'platform_super_admin' ? (
                      <option value="platform_super_admin">Platform Super Admin</option>
                    ) : null}
                    {editingUser.role === 'platform_support' ? (
                      <option value="platform_support">Platform Support</option>
                    ) : null}
                  </select>
                </div>
              ) : null}

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm((current) => ({ ...current, isActive: e.target.checked }))
                  }
                  disabled={editingUser.id === currentUser?.id}
                />
                Account is active
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={updateUser.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
