'use client';

import { DataTable, type DataTableColumn } from '@/components/admin/data-table';
import { PaginationBar } from '@/components/admin/pagination-bar';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCreateExport, useExports } from '@/hooks/use-admin';
import { useSessionsList } from '@/hooks/use-sessions';
import { api } from '@/lib/api';
import { downloadBlob } from '@/lib/download';
import type { CaptureMode, ExportJobRecord, LeadQualifier } from '@/lib/types';
import { formatCaptureMode } from '@/lib/format';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';

function statusVariant(status: string): 'default' | 'accent' | 'success' | 'warning' | 'error' {
  if (status === 'ready') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'processing' || status === 'pending') return 'warning';
  return 'default';
}

export default function AdminExportPage() {
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [leadQualifier, setLeadQualifier] = useState<LeadQualifier | ''>('');
  const [captureMode, setCaptureMode] = useState<CaptureMode | ''>('');
  const limit = 10;
  const { data, isLoading } = useExports({ page, limit });
  const sessions = useSessionsList({ limit: 100 });
  const createExport = useCreateExport();

  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? 0) / limit));

  const requestExport = async (exportType: 'csv' | 'xlsx' | 'pdf') => {
    await createExport.mutateAsync({
      exportType,
      sessionId: sessionId || undefined,
      leadQualifier: leadQualifier || undefined,
      captureMode: captureMode || undefined,
    });
  };

  const handleDownload = async (row: ExportJobRecord) => {
    setDownloadingId(row.id);
    try {
      const ext = row.exportType === 'xlsx' ? 'xlsx' : row.exportType === 'pdf' ? 'pdf' : 'csv';
      await downloadBlob(api, `/exports/${row.id}/download`, `cardvault-export.${ext}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const columns: DataTableColumn<ExportJobRecord>[] = [
    {
      key: 'type',
      header: 'Type',
      className: 'w-[100px]',
      render: (row) => <span className="font-medium uppercase text-foreground">{row.exportType}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[160px]',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
          {row.status === 'processing' || row.status === 'pending' ? (
            <Loader2 className="h-3 w-3 animate-spin text-text-tertiary" />
          ) : null}
        </span>
      ),
    },
    {
      key: 'records',
      header: 'Records',
      className: 'w-[120px]',
      render: (row) => <span className="text-text-secondary">{row.recordCount ?? '—'}</span>,
    },
    {
      key: 'created',
      header: 'Requested',
      className: 'min-w-[180px]',
      render: (row) => <span className="text-text-secondary">{new Date(row.createdAt).toLocaleString()}</span>,
    },
    {
      key: 'download',
      header: '',
      className: 'w-[120px] text-right',
      render: (row) =>
        row.status === 'ready' ? (
          <Button
            variant="ghost"
            size="sm"
            loading={downloadingId === row.id}
            onClick={() => handleDownload(row)}
          >
            Download
          </Button>
        ) : row.status === 'failed' ? (
          <span className="text-xs text-error">{row.errorMessage ?? 'Failed'}</span>
        ) : (
          <span className="text-xs text-text-tertiary">Processing…</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Export Center"
        description="Bulk export contacts as CSV, Excel, or PDF summary"
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Session
              </span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
              >
                <option value="">All sessions</option>
                {(sessions.data?.items ?? []).map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Lead qualifier
              </span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={leadQualifier}
                onChange={(e) => setLeadQualifier(e.target.value as LeadQualifier | '')}
              >
                <option value="">All leads</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                Capture mode
              </span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={captureMode}
                onChange={(e) => setCaptureMode(e.target.value as CaptureMode | '')}
              >
                <option value="">All modes</option>
                <option value="visitor">{formatCaptureMode('visitor')}</option>
                <option value="exhibitor">{formatCaptureMode('exhibitor')}</option>
                <option value="quick_capture">{formatCaptureMode('quick_capture')}</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => requestExport('xlsx')} loading={createExport.isPending}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel (.xlsx)
            </Button>
            <Button variant="secondary" onClick={() => requestExport('csv')} loading={createExport.isPending}>
              <FileText className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="secondary" onClick={() => requestExport('pdf')} loading={createExport.isPending}>
              <Download className="mr-2 h-4 w-4" />
              PDF summary
            </Button>
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
                icon={Download}
                title="No export jobs yet"
                description="Export your contacts list in CSV, Excel, or PDF format using the buttons above."
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
