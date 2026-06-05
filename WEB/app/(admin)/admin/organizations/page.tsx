'use client';

import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { ListSkeleton } from '@/components/shared/list-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  useCreateOrganization,
  useDeleteOrganization,
  useOrganizations,
  usePlans,
  useUpdateOrganization,
} from '@/hooks/use-admin';
import { isPlatformSuperAdmin } from '@/lib/roles';
import type { OrganizationRecord } from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { Building2 } from 'lucide-react';

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
    const typed = error as { response?: { data?: { message?: string } }; message?: string };
    return typed.response?.data?.message ?? typed.message ?? fallback;
  }
  return fallback;
}

function formatPlanPrice(priceInr: number, billingInterval: string | null): string {
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

  const handleArchive = async (org: OrganizationRecord) => {
    if (!window.confirm(`Archive ${org.name}? This will deactivate the organization.`)) {
      return;
    }

    try {
      await deleteOrganization.mutateAsync(org.id);
    } catch {
      /* surface via mutation state later */
    }
  };

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
            <p className="text-xs text-accent mt-1 font-medium">Manager: {row.managerEmail}</p>
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
      render: (row) => (
        <span className="text-sm text-foreground">
          {row.maxUsers} users / {row.storageQuotaGb} GB
        </span>
      ),
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
        <span className="text-xs text-text-tertiary">{new Date(row.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[120px] text-right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleArchive(row)}
            disabled={deleteOrganization.isPending}
          >
            Archive
          </Button>
        </div>
      ),
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
        action={<Button onClick={openCreateModal}>New Organization</Button>}
      />

      <Card>
        <CardContent className="p-0">
          {error ? (
            <p className="p-6 text-sm text-error text-center">Failed to load organizations.</p>
          ) : (
            <DataTable
              columns={columns}
              rows={data ?? []}
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

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              {editingOrg ? 'Edit Organization' : 'Create Organization'}
            </h3>

            {formError ? (
              <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                {formError}
              </p>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  required
                  label="Organization Name"
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                />
                <Input
                  required
                  label="Slug"
                  value={form.slug}
                  onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  required
                  label="Max Users"
                  type="number"
                  min={1}
                  value={form.maxUsers}
                  onChange={(e) => setForm((current) => ({ ...current, maxUsers: e.target.value }))}
                />
                <Input
                  required
                  type="number"
                  min={1}
                  label="Storage (GB)"
                  value={form.storageQuotaGb}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, storageQuotaGb: e.target.value }))
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
                  onChange={(e) => setForm((current) => ({ ...current, plan: e.target.value }))}
                >
                  {plans?.map((plan) => (
                    <option key={plan.id} value={plan.code}>
                      {plan.name} ({formatPlanPrice(plan.priceInr, plan.billingInterval)})
                    </option>
                  ))}
                </select>
              </div>

              {!editingOrg && (
                <div className="border-t border-border/40 my-2 pt-4 space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Manager Account Credentials</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      required
                      type="email"
                      label="Manager Email"
                      placeholder="manager@example.com"
                      value={form.managerEmail}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, managerEmail: e.target.value }))
                      }
                    />
                    <Input
                      required
                      type="password"
                      label="Manager Password"
                      placeholder="Min 8 characters"
                      value={form.managerPassword}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, managerPassword: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Input
                      label="Manager Full Name (Optional)"
                      placeholder="John Doe"
                      value={form.managerName}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, managerName: e.target.value }))
                      }
                    />
                  </div>
                </div>
              )}

              {editingOrg && (
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, isActive: e.target.checked }))
                    }
                  />
                  Organization is active
                </label>
              )}

              <div className="flex justify-end gap-3 pt-2">
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
                <Button type="submit" loading={isSaving}>
                  {editingOrg ? 'Save Changes' : 'Create Organization'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
