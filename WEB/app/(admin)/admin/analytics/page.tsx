'use client';

import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { BarChart } from '@/components/admin/bar-chart';
import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  useEncounterTypeAnalytics,
  useLeadFunnelAnalytics,
  usePlatformAnalytics,
  useSessionAnalytics,
} from '@/hooks/use-analytics';
import { formatCaptureMode } from '@/lib/format';
import { isPlatformSuperAdmin } from '@/lib/roles';
import type { CaptureMode } from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';

type SessionRow = {
  id: string;
  name: string;
  mode: string;
  status: string;
  scanCount: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
};

export default function AnalyticsPage() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = isPlatformSuperAdmin(user?.role);

  const funnel = useLeadFunnelAnalytics();
  const encounters = useEncounterTypeAnalytics();
  const sessions = useSessionAnalytics();
  const platform = usePlatformAnalytics(isSuperAdmin);

  const funnelData = funnel.data
    ? [
        { label: 'Hot', value: funnel.data.hot },
        { label: 'Warm', value: funnel.data.warm },
        { label: 'Cold', value: funnel.data.cold },
        { label: 'Unqualified', value: funnel.data.unqualified },
      ]
    : [];

  const encounterData =
    encounters.data?.map((row) => ({
      label: row.encounterType ?? 'unknown',
      value: row.count,
    })) ?? [];

  const sessionColumns: DataTableColumn<SessionRow>[] = [
    { key: 'name', header: 'Session', render: (row) => row.name },
    {
      key: 'mode',
      header: 'Mode',
      render: (row) => formatCaptureMode(row.mode as CaptureMode),
    },
    { key: 'status', header: 'Status', render: (row) => row.status },
    { key: 'scans', header: 'Scans', render: (row) => row.scanCount },
    {
      key: 'leads',
      header: 'H / W / C',
      render: (row) => `${row.hotCount} / ${row.warmCount} / ${row.coldCount}`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Lead funnel, encounter breakdown, and session performance"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Hot leads"
          value={funnel.data?.hot ?? 0}
          loading={funnel.isLoading}
        />
        <AdminStatCard
          label="Warm leads"
          value={funnel.data?.warm ?? 0}
          loading={funnel.isLoading}
        />
        <AdminStatCard
          label="Cold leads"
          value={funnel.data?.cold ?? 0}
          loading={funnel.isLoading}
        />
        <AdminStatCard
          label="Active sessions"
          value={
            sessions.data?.filter((s) => s.status === 'active').length ?? 0
          }
          loading={sessions.isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Lead funnel
            </h2>
            <BarChart data={funnelData} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Encounter types
            </h2>
            <BarChart data={encounterData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              Session performance
            </h2>
          </div>
          <DataTable
            columns={sessionColumns}
            rows={sessions.data ?? []}
            keyField={(row) => row.id}
            isLoading={sessions.isLoading}
          />
        </CardContent>
      </Card>

      {isSuperAdmin ? (
        <Card>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard
              label="Organizations"
              value={platform.data?.organizations ?? 0}
              loading={platform.isLoading}
            />
            <AdminStatCard
              label="Users"
              value={platform.data?.users ?? 0}
              loading={platform.isLoading}
            />
            <AdminStatCard
              label="Contacts"
              value={platform.data?.contacts ?? 0}
              loading={platform.isLoading}
            />
            <AdminStatCard
              label="OCR jobs"
              value={platform.data?.ocrJobs ?? 0}
              loading={platform.isLoading}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
