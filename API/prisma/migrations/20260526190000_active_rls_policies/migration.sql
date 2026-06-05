-- Helper to get current tenant organization ID from session settings
CREATE OR REPLACE FUNCTION current_org_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_org_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

-- Drop prior policies if they exist
DROP POLICY IF EXISTS tenant_policy ON organizations;
DROP POLICY IF EXISTS tenant_policy ON users;
DROP POLICY IF EXISTS tenant_policy ON contacts;
DROP POLICY IF EXISTS tenant_policy ON contact_encounters;
DROP POLICY IF EXISTS tenant_policy ON event_sessions;
DROP POLICY IF EXISTS tenant_policy ON session_members;
DROP POLICY IF EXISTS tenant_policy ON ocr_jobs;
DROP POLICY IF EXISTS tenant_policy ON card_images;
DROP POLICY IF EXISTS tenant_select_policy ON audit_events;
DROP POLICY IF EXISTS tenant_insert_policy ON audit_events;
DROP POLICY IF EXISTS tenant_policy ON exports;
DROP POLICY IF EXISTS tenant_policy ON sync_queue;
DROP POLICY IF EXISTS tenant_policy ON notifications;
DROP POLICY IF EXISTS tenant_policy ON relationship_matches;
DROP POLICY IF EXISTS tenant_policy ON contact_merge_history;

-- Create policies

-- 1. organizations
CREATE POLICY tenant_policy ON organizations FOR ALL USING (id = current_org_id()) WITH CHECK (id = current_org_id());

-- 2. users
CREATE POLICY tenant_policy ON users FOR ALL USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());

-- 3. contacts
CREATE POLICY tenant_policy ON contacts FOR ALL USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());

-- 4. contact_encounters
CREATE POLICY tenant_policy ON contact_encounters FOR ALL USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());

-- 5. event_sessions
CREATE POLICY tenant_policy ON event_sessions FOR ALL USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());

-- 6. session_members
CREATE POLICY tenant_policy ON session_members FOR ALL USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());

-- 7. ocr_jobs
CREATE POLICY tenant_policy ON ocr_jobs FOR ALL USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());

-- 8. card_images
CREATE POLICY tenant_policy ON card_images FOR ALL USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());

-- 9. audit_events
CREATE POLICY tenant_select_policy ON audit_events FOR SELECT USING (organization_id = current_org_id());
CREATE POLICY tenant_insert_policy ON audit_events FOR INSERT WITH CHECK (organization_id = current_org_id());

-- 10. exports
CREATE POLICY tenant_policy ON exports FOR ALL USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());

-- 11. sync_queue
CREATE POLICY tenant_policy ON sync_queue FOR ALL USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());

-- 12. notifications
CREATE POLICY tenant_policy ON notifications FOR ALL USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());

-- 13. relationship_matches
CREATE POLICY tenant_policy ON relationship_matches FOR ALL USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());

-- 14. contact_merge_history
CREATE POLICY tenant_policy ON contact_merge_history FOR ALL USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());
