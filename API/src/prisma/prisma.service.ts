import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { applyDatabaseUrlFromParts } from '../config/database-url';
import { getTenantStore } from '../common/tenant/tenant-context.storage';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly extendedClient: any;

  constructor() {
    super();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    applyDatabaseUrlFromParts();

    this.extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const store = getTenantStore();

            // Set session variable for RLS
            await self.applyTenantRls();

            // Skip tenant scoping if bypassed or context is missing
            if (!store?.organizationId || store.bypassTenantScope) {
              return query(args);
            }

            const tenantModels = [
              'User',
              'Contact',
              'ContactEncounter',
              'EventSession',
              'SessionMember',
              'OcrJob',
              'CardImage',
              'AuditEvent',
              'Export',
              'SyncQueue',
              'Notification',
              'RelationshipMatch',
              'ContactMergeHistory',
              'RolePermission',
            ];

            if (tenantModels.includes(model)) {
              if (
                [
                  'findMany',
                  'findFirst',
                  'findUnique',
                  'count',
                  'update',
                  'updateMany',
                  'delete',
                  'deleteMany',
                ].includes(operation)
              ) {
                const typedArgs = (args ?? {}) as {
                  where?: Record<string, any>;
                };
                typedArgs.where = typedArgs.where ?? {};
                // If it is findUnique, Prisma requires the query to target unique fields.
                // However, adding a non-unique field to "where" makes it a non-unique query under the hood.
                // Prisma client extension automatically downgrades findUnique to findFirst if a non-unique field is added to where.
                typedArgs.where.organizationId = store.organizationId;
                return query(typedArgs);
              }
            }

            return query(args);
          },
        },
      },
    });

    return new Proxy(this, {
      get(target, prop) {
        if (
          prop === 'onModuleInit' ||
          prop === 'onModuleDestroy' ||
          prop === 'applyTenantRls' ||
          prop === 'withTenantRls' ||
          prop === 'extendedClient'
        ) {
          const value = Reflect.get(target, prop);
          return typeof value === 'function'
            ? (value as any).bind(target)
            : value;
        }
        const ext = (target as any).extendedClient;
        const value = Reflect.get(ext, prop);
        return typeof value === 'function' ? (value as any).bind(ext) : value;
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Apply RLS session variable for the current async context (call before tenant queries). */
  async applyTenantRls(): Promise<void> {
    const store = getTenantStore();
    if (!store?.organizationId || store.bypassTenantScope) {
      await this.$executeRaw`SELECT set_config('app.current_org_id', '', true)`;
      return;
    }
    await this
      .$executeRaw`SELECT set_config('app.current_org_id', ${store.organizationId}, true)`;
  }

  async withTenantRls<T>(fn: () => Promise<T>): Promise<T> {
    await this.applyTenantRls();
    return fn();
  }
}
