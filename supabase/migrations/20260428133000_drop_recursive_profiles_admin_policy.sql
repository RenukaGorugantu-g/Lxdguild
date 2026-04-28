-- Remove profiles admin RLS entirely to stop recursive policy evaluation.
-- Admin reads/writes should use the service role client in application code instead.

DROP POLICY IF EXISTS "Admins have full access" ON profiles;
