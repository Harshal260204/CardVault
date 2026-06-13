'use client';

import { useToastStore } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-modal',
            toast.variant === 'error'
              ? 'border-error/30 bg-red-50 text-red-800'
              : 'border-success/30 bg-green-50 text-green-800',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p>{toast.message}</p>
            <button
              type="button"
              className="text-xs font-medium opacity-70 hover:opacity-100"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
