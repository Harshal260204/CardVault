import { cn } from '@/lib/utils';

import type { HTMLAttributes } from 'react';

const variants = {
  default: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  hot: 'bg-qualifier-hot-bg text-qualifier-hot-text border border-qualifier-hot-border',
  warm: 'bg-qualifier-warm-bg text-qualifier-warm-text border border-qualifier-warm-border',
  cold: 'bg-qualifier-cold-bg text-qualifier-cold-text border border-qualifier-cold-border',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
