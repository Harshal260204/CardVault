-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_inr" INTEGER NOT NULL DEFAULT 0,
    "billing_interval" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- Seed plans
INSERT INTO "plans" (
    "id",
    "code",
    "name",
    "price_inr",
    "billing_interval",
    "description",
    "is_active"
) VALUES
    (
        '00000000-0000-4000-9000-000000000001',
        'free',
        'Free',
        0,
        NULL,
        'Free plan for the entire CardVault product.',
        true
    ),
    (
        '00000000-0000-4000-9000-000000000002',
        'pro',
        'Pro',
        99,
        'monthly',
        'Paid CardVault plan billed at 99 Rs per month.',
        true
    )
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "price_inr" = EXCLUDED."price_inr",
    "billing_interval" = EXCLUDED."billing_interval",
    "description" = EXCLUDED."description",
    "is_active" = EXCLUDED."is_active",
    "updated_at" = CURRENT_TIMESTAMP;

-- Normalize existing organizations to supported plans only
UPDATE "organizations"
SET "plan" = CASE
    WHEN LOWER("plan") = 'free' THEN 'free'
    ELSE 'pro'
END;

-- AddForeignKey
ALTER TABLE "organizations"
ADD CONSTRAINT "organizations_plan_fkey"
FOREIGN KEY ("plan") REFERENCES "plans"("code")
ON DELETE RESTRICT
ON UPDATE CASCADE;
