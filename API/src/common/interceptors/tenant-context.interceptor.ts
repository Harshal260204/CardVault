import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { RequestUser } from '../../modules/auth/auth.types';
import { enterTenantStore } from '../tenant/tenant-context.storage';
import {
  TENANT_REQUEST_KEY,
  type TenantContext,
} from '../tenant/tenant-context';

export type RequestWithTenant = {
  user?: RequestUser;
  [TENANT_REQUEST_KEY]?: TenantContext;
};

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<RequestWithTenant>();
    const user = req.user;
    if (user) {
      const tenant: TenantContext = {
        organizationId: user.organizationId,
        userId: user.id,
        role: user.role,
      };
      req[TENANT_REQUEST_KEY] = tenant;
      enterTenantStore({ organizationId: user.organizationId });
    }
    return next.handle();
  }
}
