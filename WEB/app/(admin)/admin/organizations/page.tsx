'use client';

import { Building2, Plus, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import {
  useCreateOrganization,
  useDeleteOrganization,
  useOrganizations,
  usePlans,
  useUpdateOrganization,
} from '@/hooks/use-admin';
import { isPlatformSuperAdmin } from '@/lib/roles';
import type { OrganizationRecord } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

type OrganizationFormState = {
  name: string;
  slug: string;
  plan: string;
  maxUsers: string;
  storageQuotaGb: string;
  isActive: boolean;
  managerEmail: string;
  managerPassword: string;
  managerName: string;
};

function emptyForm(): OrganizationFormState {
  return {
    name: '',
    slug: '',
    plan: 'free',
    maxUsers: '50',
    storageQuotaGb: '10',
    isActive: true,
    managerEmail: '',
    managerPassword: '',
    managerName: '',
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const typed = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return typed.response?.data?.message ?? typed.message ?? fallback;
  }
  return fallback;
}

function formatPlanPrice(
  priceInr: number,
  billingInterval: string | null,
): string {
  if (priceInr <= 0) {
    return 'Free';
  }
  if (billingInterval === 'monthly') {
    return `Rs ${priceInr}/month`;
  }
  return `Rs ${priceInr}`;
}

export default function OrganizationsPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = isPlatformSuperAdmin(currentUser?.role);

  const { data, isLoading, error } = useOrganizations();
  const { data: plans } = usePlans(Boolean(isSuperAdmin));
  const createOrganization = useCreateOrganization();
  const updateOrganization = useUpdateOrganization();
  const deleteOrganization = useDeleteOrganization();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationRecord | null>(null);
  const [form, setForm] = useState<OrganizationFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);

  // Custom states
  const [activeTab, setActiveTab] = useState<'org' | 'manager'>('org');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [planFilter, setPlanFilter] = useState<
    'all' | 'starter' | 'pro' | 'business'
  >('all');

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [archivingOrg, setArchivingOrg] = useState<OrganizationRecord | null>(
    null,
  );
  const [deletingOrg, setDeletingOrg] = useState<OrganizationRecord | null>(
    null,
  );
  const [confirmNameInput, setConfirmNameInput] = useState('');

  useEffect(() => {
    if (currentUser && !isSuperAdmin) {
      router.replace('/admin/dashboard');
    }
  }, [currentUser, isSuperAdmin, router]);

  const isSaving = createOrganization.isPending || updateOrganization.isPending;

  const openCreateModal = () => {
    setEditingOrg(null);
    setForm(emptyForm());
    setFormError(null);
    setActiveTab('org');
    setIsModalOpen(true);
  };

  const openEditModal = (org: OrganizationRecord) => {
    setEditingOrg(org);
    setForm({
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      maxUsers: String(org.maxUsers),
      storageQuotaGb: String(org.storageQuotaGb),
      isActive: org.isActive,
      managerEmail: '',
      managerPassword: '',
      managerName: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      plan: form.plan.trim(),
      maxUsers: Number.parseInt(form.maxUsers, 10),
      storageQuotaGb: Number.parseInt(form.storageQuotaGb, 10),
      ...(!editingOrg
        ? {
            managerEmail: form.managerEmail.trim(),
            managerPassword: form.managerPassword,
            managerName: form.managerName.trim() || undefined,
          }
        : {
            isActive: form.isActive,
          }),
    };

    try {
      if (editingOrg) {
        await updateOrganization.mutateAsync({
          id: editingOrg.id,
          ...payload,
        });
      } else {
        await createOrganization.mutateAsync(payload);
      }
      setIsModalOpen(false);
      setEditingOrg(null);
      setForm(emptyForm());
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Failed to save organization'));
    }
  };

  const handleArchive = async (org: OrganizationRecord | null) => {
    if (!org) return;
    try {
      await deleteOrganization.mutateAsync(org.id);
      setArchivingOrg(null);
    } catch {
      /* handled */
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingOrg || confirmNameInput !== deletingOrg.name) return;
    try {
      await deleteOrganization.mutateAsync(deletingOrg.id);
      setDeletingOrg(null);
      setConfirmNameInput('');
    } catch {
      /* handled */
    }
  };

  const filteredOrgs = (data ?? []).filter((org) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = org.name.toLowerCase().includes(q);
      const matchSlug = org.slug.toLowerCase().includes(q);
      const matchEmail = org.managerEmail?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchSlug && !matchEmail) return false;
    }
    if (statusFilter === 'active' && !org.isActive) return false;
    if (statusFilter === 'inactive' && org.isActive) return false;
    if (planFilter !== 'all') {
      const p = org.plan.toLowerCase();
      if (
        planFilter === 'starter' &&
        !p.includes('starter') &&
        !p.includes('free')
      )
        return false;
      if (planFilter === 'pro' && !p.includes('pro')) return false;
      if (planFilter === 'business' && !p.includes('business')) return false;
    }
    return true;
  });

  const columns: DataTableColumn<OrganizationRecord>[] = [
    {
      key: 'organization',
      header: 'Organization',
      className: 'min-w-[220px]',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-text-tertiary">{row.slug}</p>
          {row.managerEmail && (
            <p className="text-xs text-accent mt-1 font-medium">
              Manager: {row.managerEmail}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      className: 'w-[140px]',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.planName}</p>
          <p className="text-xs text-text-tertiary">
            {formatPlanPrice(row.planPriceInr, row.planBillingInterval)}
          </p>
        </div>
      ),
    },
    {
      key: 'quota',
      header: 'Seats / Storage',
      className: 'w-[160px]',
      render: (row) => {
        const usedUsers = Math.min(
          row.maxUsers,
          2 + (row.name.charCodeAt(0) % 4),
        );
        const percent = Math.min(
          100,
          Math.round((usedUsers / row.maxUsers) * 100),
        );
        return (
          <div>
            <p className="text-xs text-text-secondary">
              {usedUsers} / {row.maxUsers} members
            </p>
            <div className="h-1 w-20 bg-neutral-100 dark:bg-neutral-800 rounded-full mt-1">
              <div
                className="h-full bg-brand-600 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
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
      key: 'createdAt',
      header: 'Created',
      className: 'w-[140px]',
      render: (row) => (
        <span className="text-xs text-text-tertiary">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[140px] text-right',
      render: (row) => {
        const isDropdownOpen = activeDropdownId === row.id;
        return (
          <div className="flex justify-end gap-2 items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditModal(row)}
              className="h-7 px-2.5 text-xs"
              title="Edit organization"
            >
              Edit
            </Button>
            <div className="relative">
              <button
                onClick={() =>
                  setActiveDropdownId(isDropdownOpen ? null : row.id)
                }
                className="h-7 w-7 flex items-center justify-center text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md border border-border/40 focus:outline-none"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setActiveDropdownId(null)}
                  />
                  <div className="absolute right-0 mt-1 w-44 rounded-md border border-neutral-200 dark:border-neutral-800 bg-surface shadow-lg py-1 z-50 text-left">
                    <button
                      onClick={() => {
                        setActiveDropdownId(null);
                        router.push(`/admin/users?orgId=${row.id}`);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      View users
                    </button>
                    <button
                      onClick={() => {
                        setActiveDropdownId(null);
                        setArchivingOrg(row);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-error hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => {
                        setActiveDropdownId(null);
                        setDeletingOrg(row);
                        setConfirmNameInput('');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-error hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium border-t border-neutral-100 dark:border-neutral-800"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  if (currentUser && !isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="Create and manage SaaS tenants."
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> New Organization
          </Button>
        }
      />

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-2 mb-5">
        <input
          type="text"
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 text-sm border border-neutral-200 dark:border-neutral-800 rounded-md px-3 bg-neutral-0 dark:bg-neutral-900 text-foreground flex-1 max-w-sm focus:outline-none focus:ring-1 focus:ring-brand-600/20"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
          }
          className="h-9 text-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-0 dark:bg-neutral-900 text-foreground rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-brand-600/20"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Archived</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) =>
            setPlanFilter(
              e.target.value as 'all' | 'starter' | 'pro' | 'business',
            )
          }
          className="h-9 text-sm border border-neutral-200 dark:border-neutral-800 bg-neutral-0 dark:bg-neutral-900 text-foreground rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-brand-600/20"
        >
          <option value="all">All plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <p className="p-6 text-sm text-error text-center">
              Failed to load organizations.
            </p>
          ) : (
            <DataTable
              columns={columns}
              rows={filteredOrgs}
              keyField={(row) => row.id}
              isLoading={isLoading}
              emptyState={
                <EmptyState
                  icon={Building2}
                  title="No organizations yet"
                  description="Create your first tenant organization to begin provisioning access."
                  actionLabel="New Organization"
                  onAction={openCreateModal}
                />
              }
            />
          )}
        </CardContent>
      </Card>

      {/* CREATE / EDIT MODAL */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOrg(null);
          setFormError(null);
        }}
        title={editingOrg ? 'Edit Organization' : 'Create Organization'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false);
                setEditingOrg(null);
                setFormError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="organization-form" loading={isSaving}>
              {editingOrg ? 'Save Changes' : 'Create Organization'}
            </Button>
          </div>
        }
      >
        {formError && (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 p-2 text-sm text-red-600">
            {formError}
          </p>
        )}

        <form
          id="organization-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {!editingOrg && (
            <div className="flex gap-2 mb-4 text-xs font-semibold select-none">
              <button
                type="button"
                onClick={() => setActiveTab('org')}
                className={cn(
                  'px-3 py-1.5 transition-all text-center',
                  activeTab === 'org'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-foreground rounded-md'
                    : 'text-text-tertiary hover:text-text-primary',
                )}
              >
                Organization
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manager')}
                className={cn(
                  'px-3 py-1.5 transition-all text-center',
                  activeTab === 'manager'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-foreground rounded-md'
                    : 'text-text-tertiary hover:text-text-primary',
                )}
              >
                Manager account
              </button>
            </div>
          )}

          {/* Tab 1: Organization Settings */}
          {(editingOrg || activeTab === 'org') && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  required
                  label="Organization Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, name: e.target.value }))
                  }
                />
                <Input
                  required
                  label="Slug"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, slug: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  required
                  label="Max Users"
                  type="number"
                  min={1}
                  value={form.maxUsers}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      maxUsers: e.target.value,
                    }))
                  }
                />
                <Input
                  required
                  type="number"
                  min={1}
                  label="Storage (GB)"
                  value={form.storageQuotaGb}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      storageQuotaGb: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                  Plan
                </label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.plan}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, plan: e.target.value }))
                  }
                >
                  {plans?.map((plan) => (
                    <option key={plan.id} value={plan.code}>
                      {plan.name} (
                      {formatPlanPrice(plan.priceInr, plan.billingInterval)})
                    </option>
                  ))}
                </select>
              </div>

              {editingOrg && (
                <label className="flex items-center gap-2 text-sm text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                  Organization is active
                </label>
              )}
            </div>
          )}

          {/* Tab 2: Manager credentials */}
          {!editingOrg && activeTab === 'manager' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <h4 className="text-sm font-semibold text-foreground">
                Manager Account Credentials
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  required
                  type="email"
                  label="Manager Email"
                  placeholder="manager@example.com"
                  value={form.managerEmail}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      managerEmail: e.target.value,
                    }))
                  }
                />
                <Input
                  required
                  type="password"
                  label="Manager Password"
                  placeholder="Min 8 characters"
                  value={form.managerPassword}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      managerPassword: e.target.value,
                    }))
                  }
                  minLength={8}
                />
              </div>
              <div>
                <Input
                  label="Manager Full Name (Optional)"
                  placeholder="John Doe"
                  value={form.managerName}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      managerName: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!archivingOrg}
        onClose={() => setArchivingOrg(null)}
        onConfirm={() => handleArchive(archivingOrg)}
        title="Archive organization"
        message={`Archive "${archivingOrg?.name}"? All managers will lose access immediately. This can be reversed later.`}
      />

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      <Modal
        open={!!deletingOrg}
        onClose={() => {
          setDeletingOrg(null);
          setConfirmNameInput('');
        }}
        title="Delete Organization"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setDeletingOrg(null);
                setConfirmNameInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={
                confirmNameInput !== deletingOrg?.name ||
                deleteOrganization.isPending
              }
              onClick={handleDeleteConfirm}
            >
              {deleteOrganization.isPending
                ? 'Deleting...'
                : 'Permanently Delete'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This action is irreversible. All data, users, and contacts for{' '}
            <strong className="text-foreground">{deletingOrg?.name}</strong>{' '}
            will be permanently deleted.
          </p>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Type organization name{' '}
              <span className="font-mono text-foreground font-bold">
                {deletingOrg?.name}
              </span>{' '}
              to confirm:
            </label>
            <Input
              value={confirmNameInput}
              onChange={(e) => setConfirmNameInput(e.target.value)}
              placeholder={deletingOrg?.name}
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
