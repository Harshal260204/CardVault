import { createApiClient } from '@/lib/api-client';

export const api = createApiClient({
  onUnauthorized: () => {
    if (typeof window === 'undefined') {
      return;
    }

    void import('@/stores/auth-store').then(({ useAuthStore }) => {
      useAuthStore.getState().resetSession();
    });

    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
});
