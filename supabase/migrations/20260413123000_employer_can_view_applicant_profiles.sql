-- Allow employers to view minimal profile fields for candidates who applied to their jobs.
DROP POLICY IF EXISTS "Employers can view profiles of applicants to their jobs" ON profiles;
CREATE POLICY "Employers can view profiles of applicants to their jobs" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM job_applications ja
            JOIN jobs j ON j.id = ja.job_id
            WHERE ja.user_id = profiles.id
              AND j.user_id = auth.uid()
        )
    );
