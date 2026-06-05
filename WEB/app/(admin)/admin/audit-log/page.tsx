'use client';

import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { PaginationBar } from '@/components/admin/pagination-bar';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ListSkeleton } from '@/components/shared/list-skeleton';
import { useAuditEvents } from '@/hooks/use-admin';
import type { AuditEventRecord } from '@/lib/types';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { Shield } from 'lucide-react';

export default function AdminAuditLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useAuditEvents({
    page,
    limit,
    q: debouncedQ || undefined,
  });

  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? 0) / limit));

  const columns: DataTableColumn<AuditEventRecord>[] = [
    {
      key: 'event',
      header: 'Event',
      className: 'min-w-[180px]',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.eventType}</p>
          <p className="text-xs text-text-tertiary">{row.entityType}</p>
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      className: 'min-w-[150px]',
      render: (row) => (
        <span className="text-sm text-text-secondary">{row.actorEmail ?? 'System'}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      className: 'w-[100px]',
      render: (row) =>
        row.actorRole ? <Badge variant="default">{row.actorRole}</Badge> : <span>—</span>,
    },
    {
      key: 'entity',
      header: 'Entity ID',
      className: 'w-[120px]',
      render: (row) => (
        <span className="font-mono text-xs text-text-tertiary">
          {row.entityId?.slice(0, 8) ?? '—'}…
        </span>
      ),
    },
    {
      key: 'time',
      header: 'When',
      className: 'w-[180px]',
      render: (row) => (
        <span className="text-xs text-text-tertiary whitespace-nowrap">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description={
          data
            ? `${data.meta.total} immutable compliance events`
            : 'Immutable compliance event browser'
        }
      />

      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search event or entity type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                icon={Shield}
                title="No compliance events found"
                description={
                  debouncedQ
                    ? "Try adjusting your search queries."
                    : "Compliance activity will appear here once actions are performed on the console."
                }
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
    </div>
  );
}
