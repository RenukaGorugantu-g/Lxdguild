-- Reset profiles RLS policies to a known-safe set.
-- This removes any recursive legacy admin policy that may still exist on remote.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_record.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Employers can view profiles of applicants to their jobs" ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM job_applications ja
    JOIN jobs j ON j.id = ja.job_id
    WHERE ja.user_id = profiles.id
      AND j.user_id = auth.uid()
  )
);

CREATE POLICY "Admins have full access" ON profiles
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());
