-- Fix 1: Change scope_ref_id from uuid to text
-- Category names like "billing", "quality" are not UUIDs.
-- Provider and zone IDs are UUIDs but we need text to support all scope types.
ALTER TABLE support_policy_scopes ALTER COLUMN scope_ref_id TYPE text USING scope_ref_id::text;

-- Fix 2: Add unique constraint for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS uq_support_policy_scopes_type_ref
  ON support_policy_scopes (scope_type, scope_ref_id);
