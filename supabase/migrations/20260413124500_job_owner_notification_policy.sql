-- Allow job owners to create notifications for candidates who applied to their jobs.
DROP POLICY IF EXISTS "Job owners can notify their applicants" ON notifications;
CREATE POLICY "Job owners can notify their applicants" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM job_applications ja
      JOIN jobs j ON j.id = ja.job_id
      WHERE ja.user_id = notifications.user_id
        AND j.user_id = auth.uid()
    )
  );
