'use client';

import { AdminStatCard } from '@/components/admin/admin-stat-card';
import { BarChart } from '@/components/admin/bar-chart';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/use-admin';
import { formatCaptureMode } from '@/lib/format';
import { Activity, Contact, Download, Flame, Users } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Loading analytics…" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <PageHeader
        title="Dashboard"
        description="Could not load dashboard. Ensure you are signed in as manager or super admin."
      />
    );
  }

  const leadChart = [
    { label: 'Hot', value: data.leads.hot, color: 'bg-red-500' },
    { label: 'Warm', value: data.leads.warm, color: 'bg-amber-500' },
    { label: 'Cold', value: data.leads.cold, color: 'bg-blue-500' },
    { label: '—', value: data.leads.unqualified, color: 'bg-slate-300' },
  ];

  const captureChart = Object.entries(data.captureModes).map(([mode, value]) => ({
    label: formatCaptureMode(mode as 'visitor').slice(0, 3),
    value,
  }));

  const timelineChart = data.capturesByDay.map((d) => ({
    label: d.date.slice(5),
    value: d.count,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="KPIs, capture timeline, and lead funnel" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Contacts"
          value={data.totals.contacts}
          icon={<Contact className="h-5 w-5" />}
        />
        <AdminStatCard
          label="Users"
          value={data.totals.users}
          icon={<Users className="h-5 w-5" />}
        />
        <AdminStatCard
          label="Active sessions"
          value={data.totals.activeSessions}
          icon={<Activity className="h-5 w-5" />}
        />
        <AdminStatCard
          label="Exports"
          value={data.totals.exports}
          icon={<Download className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <CardTitle className="mb-4 flex items-center gap-2 text-base">
              <Flame className="h-4 w-4 text-qualifier-hot" />
              Lead funnel
            </CardTitle>
            <BarChart data={leadChart} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CardTitle className="mb-4 text-base">Captures (7 days)</CardTitle>
            <BarChart data={timelineChart} />
          </CardContent>
        </Card>
      </div>

      {captureChart.length > 0 ? (
        <Card>
          <CardContent className="p-4">
            <CardTitle className="mb-4 text-base">By capture mode</CardTitle>
            <BarChart data={captureChart} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <Link
              href="/admin/audit-log"
              className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
            >
              View all activity →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {data.recentActivity.length ? (
              data.recentActivity.slice(0, 8).map((event) => (
                <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <span className="font-medium text-foreground">{event.eventType}</span>
                    <span className="text-text-tertiary"> · {event.entityType}</span>
                  </div>
                  <div className="text-right text-xs text-text-tertiary">
                    <p className="font-medium text-text-secondary">{event.actorEmail ?? 'System'}</p>
                    <p>{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-8 text-center text-sm text-text-tertiary">
                No recent activity recorded
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
