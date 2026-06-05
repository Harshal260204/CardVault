import type { UserRole } from '@prisma/client';

export interface TenantContext {
  organizationId: string;
  userId: string;
  role: UserRole;
}

export const TENANT_REQUEST_KEY = 'tenant';
