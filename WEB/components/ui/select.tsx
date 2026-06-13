'use client';

import { type SelectHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelClassName?: string;
}

export const selectClassName =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, labelClassName, children, ...props }, ref) => (
    <div className="w-full space-y-1">
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            'block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary',
            labelClassName,
          )}
        >
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={id}
        className={cn(selectClassName, className)}
        {...props}
      >
        {children}
      </select>
    </div>
  ),
);
Select.displayName = 'Select';
