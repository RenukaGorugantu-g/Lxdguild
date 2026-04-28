-- Fix recursive admin RLS on profiles and reset jobs policies to a safe baseline.
-- The previous profiles admin policy queried profiles from inside profiles RLS,
-- which caused recursive policy evaluation and broke jobs, notifications, and more.

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon, authenticated, service_role;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access" ON profiles;
CREATE POLICY "Admins have full access" ON profiles
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'jobs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.jobs', policy_record.policyname);
  END LOOP;
END $$;

CREATE POLICY "Anyone can view jobs" ON jobs
FOR SELECT
USING (true);

CREATE POLICY "Job owners and admins can insert jobs" ON jobs
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    user_id IS NULL
    OR auth.uid() = user_id
    OR public.is_admin_user()
  )
);

CREATE POLICY "Job owners and admins can update jobs" ON jobs
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.is_admin_user()
)
WITH CHECK (
  auth.uid() = user_id
  OR public.is_admin_user()
);

CREATE POLICY "Job owners and admins can delete jobs" ON jobs
FOR DELETE
USING (
  auth.uid() = user_id
  OR public.is_admin_user()
);
