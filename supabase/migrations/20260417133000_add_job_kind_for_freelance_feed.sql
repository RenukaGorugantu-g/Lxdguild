ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS job_kind TEXT;

UPDATE jobs
SET job_kind = COALESCE(job_kind, 'standard');

ALTER TABLE jobs
ALTER COLUMN job_kind SET DEFAULT 'standard';

CREATE INDEX IF NOT EXISTS jobs_job_kind_sort_idx
ON jobs (job_kind, is_active, COALESCE(external_posted_at, imported_at) DESC);
