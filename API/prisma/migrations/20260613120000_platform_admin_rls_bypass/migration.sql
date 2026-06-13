-- Platform-admin RLS bypass: when app.platform_bypass_rls = 'true', tenant policies allow all rows.
-- Strict tenant requests always set app.platform_bypass_rls = 'false' and scope via app.current_org_id.

CREATE OR REPLACE FUNCTION platform_bypass_rls() RETURNS boolean AS $$
  SELECT COALESCE(current_setting('app.platform_bypass_rls', true), '') = 'true';
$$ LANGUAGE sql STABLE;

DROP POLICY IF EXISTS tenant_policy ON organizations;
CREATE POLICY tenant_policy ON organizations FOR ALL
  USING (platform_bypass_rls() OR id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON users;
CREATE POLICY tenant_policy ON users FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON contacts;
CREATE POLICY tenant_policy ON contacts FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON contact_encounters;
CREATE POLICY tenant_policy ON contact_encounters FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON event_sessions;
CREATE POLICY tenant_policy ON event_sessions FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON session_members;
CREATE POLICY tenant_policy ON session_members FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON ocr_jobs;
CREATE POLICY tenant_policy ON ocr_jobs FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON card_images;
CREATE POLICY tenant_policy ON card_images FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_select_policy ON audit_events;
CREATE POLICY tenant_select_policy ON audit_events FOR SELECT
  USING (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_insert_policy ON audit_events;
CREATE POLICY tenant_insert_policy ON audit_events FOR INSERT
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON exports;
CREATE POLICY tenant_policy ON exports FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON sync_queue;
CREATE POLICY tenant_policy ON sync_queue FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON notifications;
CREATE POLICY tenant_policy ON notifications FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON relationship_matches;
CREATE POLICY tenant_policy ON relationship_matches FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());

DROP POLICY IF EXISTS tenant_policy ON contact_merge_history;
CREATE POLICY tenant_policy ON contact_merge_history FOR ALL
  USING (platform_bypass_rls() OR organization_id = current_org_id())
  WITH CHECK (platform_bypass_rls() OR organization_id = current_org_id());
