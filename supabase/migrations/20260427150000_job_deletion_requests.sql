ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS deletion_request_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deletion_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

UPDATE jobs
SET deletion_request_status = COALESCE(deletion_request_status, 'none');

ALTER TABLE jobs
ALTER COLUMN deletion_request_status SET DEFAULT 'none';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jobs_deletion_request_status_check'
  ) THEN
    ALTER TABLE jobs
    ADD CONSTRAINT jobs_deletion_request_status_check
    CHECK (deletion_request_status IN ('none', 'pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS deleted_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  company TEXT,
  location TEXT,
  source TEXT,
  apply_url TEXT,
  job_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  requested_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (original_job_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'deleted_jobs_request_status_check'
  ) THEN
    ALTER TABLE deleted_jobs
    ADD CONSTRAINT deleted_jobs_request_status_check
    CHECK (request_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS deleted_jobs_request_status_idx
ON deleted_jobs (request_status, requested_at DESC);

ALTER TABLE deleted_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage deleted jobs" ON deleted_jobs;
CREATE POLICY "Admins can manage deleted jobs" ON deleted_jobs
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Job owners can view deleted jobs" ON deleted_jobs;
CREATE POLICY "Job owners can view deleted jobs" ON deleted_jobs
FOR SELECT USING (auth.uid() = user_id OR auth.uid() = requested_by_user_id);

DROP POLICY IF EXISTS "Job owners can create deleted jobs" ON deleted_jobs;
CREATE POLICY "Job owners can create deleted jobs" ON deleted_jobs
FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = requested_by_user_id);

DROP POLICY IF EXISTS "Job owners can request delete on their jobs" ON jobs;
CREATE POLICY "Job owners can request delete on their jobs" ON jobs
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
