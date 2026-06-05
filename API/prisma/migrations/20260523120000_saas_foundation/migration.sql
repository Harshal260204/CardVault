-- Fuzzy name/company search (TRD §4.3) — pg_trgm; full tsvector requires custom immutable wrappers on some PG builds
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "idx_contacts_name_company_trgm" ON "contacts" USING GIN (
  (coalesce("full_name", '') || ' ' || coalesce("company", '')) gin_trgm_ops
);
