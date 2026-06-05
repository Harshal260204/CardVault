import { cn } from '@/lib/utils';
import { type ReactNode, useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { FileQuestion, Settings2, Check } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyField: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyState?: ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  keyField,
  isLoading = false,
  emptyMessage = 'No records found',
  emptyState,
}: DataTableProps<T>) {
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize visible columns
  useEffect(() => {
    setVisibleKeys(columns.map((c) => c.key));
  }, [columns]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) => {
      if (prev.includes(key)) {
        // Prevent hiding the last column
        const withHeader = columns.filter((c) => c.header && c.key !== 'actions');
        const visibleWithHeader = prev.filter((k) => k !== key && withHeader.some((c) => c.key === k));
        if (visibleWithHeader.length === 0) return prev; // keep at least one column with content
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const visibleColumns = columns.filter((col) => visibleKeys.includes(col.key) || col.key === 'actions');

  const toggleableColumns = columns.filter((col) => col.header && col.key !== 'actions');

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-text-tertiary bg-zinc-50 dark:bg-zinc-900/50">
              {columns.map((col) => (
                <th key={col.key} className={cn('px-4 py-2.5 font-semibold', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <tr key={`skeleton-row-${rowIndex}`} className="h-11 border-b border-border/40">
                {columns.map((col, colIndex) => {
                  const widthClass =
                    colIndex === 0
                      ? 'w-[75%]'
                      : colIndex === columns.length - 1
                      ? 'w-[50%]'
                      : colIndex % 3 === 0
                      ? 'w-[60%]'
                      : colIndex % 3 === 1
                      ? 'w-[85%]'
                      : 'w-[45%]';
                  return (
                    <td key={`skeleton-col-${colIndex}`} className="px-4 py-0 align-middle">
                      <Skeleton className={cn('h-3.5 rounded-sm', widthClass)} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!rows.length) {
    if (emptyState) {
      return <div className="py-6">{emptyState}</div>;
    }
    return (
      <div className="py-6">
        <EmptyState
          icon={FileQuestion}
          title="No data available"
          description={emptyMessage}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Table toolbar for toggling column visibility */}
      {toggleableColumns.length > 0 && (
        <div className="flex justify-end px-4 pt-3">
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-border/80 bg-surface px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary shadow-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Columns</span>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-1 z-30 w-48 rounded-md border border-border bg-surface p-1 shadow-md animate-in fade-in slide-in-from-top-1 duration-100">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Toggle Columns
                </p>
                <div className="h-px bg-border/60 my-1" />
                <div className="space-y-0.5">
                  {toggleableColumns.map((col) => {
                    const isVisible = visibleKeys.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        onClick={() => toggleColumn(col.key)}
                        type="button"
                        className="flex items-center justify-between w-full text-left px-2 py-1.5 text-xs rounded hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 text-text-secondary hover:text-text-primary transition-colors"
                      >
                        <span>{col.header}</span>
                        {isVisible && (
                          <Check className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-text-tertiary bg-zinc-50 dark:bg-zinc-900/50">
              {visibleColumns.map((col) => (
                <th key={col.key} className={cn('px-4 py-2.5 font-semibold', col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={keyField(row)}
                className="h-11 border-b border-border/40 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
              >
                {visibleColumns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-0 align-middle text-text-secondary', col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
