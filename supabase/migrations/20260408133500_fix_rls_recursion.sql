-- Drop the recursive policy from profiles that causes infinite recursion
DROP POLICY IF EXISTS "Admins have full access" ON profiles;

-- If you need an admin policy on profiles later, you should use a SECURITY DEFINER function
-- or rely on a separate table/JWT claim to avoid querying the profiles table from within its own policy.
