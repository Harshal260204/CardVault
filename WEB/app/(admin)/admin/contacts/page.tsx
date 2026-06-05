'use client';

import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { PaginationBar } from '@/components/admin/pagination-bar';
import { LeadBadge } from '@/components/shared/lead-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useContactsList } from '@/hooks/use-contacts';
import { formatCaptureMode } from '@/lib/format';
import type { ContactRecord } from '@/lib/types';
import type { CaptureMode } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { Users as UsersIcon } from 'lucide-react';

const MODE_FILTERS: Array<{ label: string; value?: CaptureMode }> = [
  { label: 'All' },
  { label: 'Visitor', value: 'visitor' },
  { label: 'Exhibitor', value: 'exhibitor' },
  { label: 'Quick', value: 'quick_capture' },
];

export default function AdminContactsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [mode, setMode] = useState<CaptureMode | undefined>();
  const limit = 15;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useContactsList({
    page,
    limit,
    q: debouncedQ || undefined,
    mode,
  });

  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? 0) / limit));

  const columns: DataTableColumn<ContactRecord>[] = [
    {
      key: 'name',
      header: 'Contact',
      className: 'min-w-[200px]',
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.fullName}</p>
          <p className="text-xs text-text-tertiary">{row.company ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'mode',
      header: 'Mode',
      className: 'w-[145px]',
      render: (row) => <Badge variant="accent">{formatCaptureMode(row.captureMode)}</Badge>,
    },
    {
      key: 'lead',
      header: 'Lead',
      className: 'w-[130px]',
      render: (row) => <LeadBadge qualifier={row.leadQualifier} />,
    },
    {
      key: 'email',
      header: 'Email',
      className: 'min-w-[180px]',
      render: (row) => <span className="text-text-secondary">{row.emails[0] ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[100px] text-right',
      render: (row) => (
        <Link
          href={`/admin/contacts/${row.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description={
          data ? `${data.meta.total} contacts in your organization` : 'Org-wide directory'
        }
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <Input
            placeholder="Search contacts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {MODE_FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  setMode(f.value);
                  setPage(1);
                }}
                className={cn(
                  'rounded-full px-3.5 py-1 text-xs font-medium transition-colors border',
                  mode === f.value
                    ? 'bg-accent-subtle text-accent border-accent/20'
                    : 'border-border bg-surface text-text-secondary hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
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
                title="No contacts found"
                description={
                  debouncedQ || mode
                    ? "Try adjusting your search queries or capture mode filters."
                    : "Contacts will appear here once cards are scanned on the mobile application."
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
