-- Remove legacy admin RLS policies that depend on profiles role lookups.
-- Regular runtime flows should not depend on these policies; admin paths can use service-role access.

DROP POLICY IF EXISTS "Admins can view all applications" ON job_applications;
DROP POLICY IF EXISTS "Job owners can update applications for their jobs" ON job_applications;
DROP POLICY IF EXISTS "Job owners can update application status" ON job_applications;

DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;

DROP POLICY IF EXISTS "Admins can view and update all certificates" ON certificates;

DROP POLICY IF EXISTS "Admins can view all exam attempts" ON exam_attempts;

DROP POLICY IF EXISTS "Admins can view sync state" ON job_feed_sync_state;

DROP POLICY IF EXISTS "Admins can manage deleted jobs" ON deleted_jobs;
