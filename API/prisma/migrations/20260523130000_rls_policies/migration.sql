-- Row Level Security (apply when using Supabase / Postgres with JWT claim "org")
-- Nest API using service role bypasses RLS; enable for direct client access.

-- Helper: current tenant from JWT (Supabase: auth.jwt() ->> 'org')
-- CREATE OR REPLACE FUNCTION current_org_id() RETURNS uuid AS $$
--   SELECT NULLIF(auth.jwt() ->> 'org', '')::uuid;
-- $$ LANGUAGE sql STABLE;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'organizations', 'users', 'contacts', 'contact_encounters', 'event_sessions',
    'session_members', 'ocr_jobs', 'card_images', 'audit_events', 'exports',
    'sync_queue', 'notifications', 'relationship_matches', 'contact_merge_history'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Example policy (uncomment when JWT claim org is available in DB session):
-- CREATE POLICY contacts_tenant_select ON contacts
--   FOR SELECT USING (organization_id = current_org_id());

-- audit_events: append-only for authenticated role
-- CREATE POLICY audit_insert ON audit_events FOR INSERT WITH CHECK (organization_id = current_org_id());
-- No UPDATE/DELETE policies on audit_events
