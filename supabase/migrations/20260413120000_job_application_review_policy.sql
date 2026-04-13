-- Allow job owners and admins to review application status.
DROP POLICY IF EXISTS "Job owners can update applications for their jobs" ON job_applications;
CREATE POLICY "Job owners can update applications for their jobs" ON job_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_applications.job_id
              AND jobs.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
