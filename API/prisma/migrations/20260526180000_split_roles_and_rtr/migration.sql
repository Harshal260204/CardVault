-- Rename super_admin value in UserRole enum to tenant_admin
ALTER TYPE "UserRole" RENAME VALUE 'super_admin' TO 'tenant_admin';

-- Add new platform roles to UserRole enum
ALTER TYPE "UserRole" ADD VALUE 'platform_support';
ALTER TYPE "UserRole" ADD VALUE 'platform_super_admin';

-- Add parent_jti column to auth_refresh_sessions table
ALTER TABLE "auth_refresh_sessions" ADD COLUMN "parent_jti" UUID;
