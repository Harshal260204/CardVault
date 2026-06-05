'use client';

import { CountUp } from '@/components/shared/count-up';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AdminStatCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
  hint?: string;
  loading?: boolean;
  className?: string;
}

export function AdminStatCard({ label, value, icon, hint, loading, className }: AdminStatCardProps) {
  return (
    <Card className={cn('min-w-[140px] flex-1 shadow-xs border border-border/80 bg-surface', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{label}</p>
          {icon ? <span className="text-text-tertiary" aria-hidden="true">{icon}</span> : null}
        </div>
        <p className="mt-1 text-[28px] font-bold tracking-tight tabular-nums text-text-primary leading-none">
          {loading ? (
            <span className="inline-block h-8 w-16 animate-pulse rounded bg-muted" aria-hidden="true" />
          ) : (
            <CountUp value={value} />
          )}
        </p>
        {hint ? <p className="mt-1.5 text-xs text-text-tertiary">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
