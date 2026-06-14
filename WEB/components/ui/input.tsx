'use client';

import { type InputHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  labelClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, labelClassName, ...props }, ref) => (
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
      <input
        ref={ref}
        id={id}
        className={cn(
          'flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground',
          'placeholder:text-text-tertiary/75 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent/20',
          error &&
            'border-error focus-visible:ring-error/20 focus-visible:border-error',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-error mt-0.5">{error}</p> : null}
    </div>
  ),
);
Input.displayName = 'Input';
