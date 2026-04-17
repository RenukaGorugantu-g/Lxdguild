ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS work_mode TEXT,
ADD COLUMN IF NOT EXISTS employment_type TEXT;

UPDATE jobs
SET work_mode = CASE
  WHEN LOWER(COALESCE(location, '')) LIKE '%remote%'
    OR LOWER(COALESCE(title, '')) LIKE '%remote%'
    OR LOWER(COALESCE(description, '')) LIKE '%remote%'
    OR LOWER(COALESCE(description, '')) LIKE '%work from home%'
    OR LOWER(COALESCE(description, '')) LIKE '%wfh%'
  THEN 'remote'
  WHEN LOWER(COALESCE(title, '')) LIKE '%hybrid%'
    OR LOWER(COALESCE(description, '')) LIKE '%hybrid%'
  THEN 'hybrid'
  WHEN COALESCE(location, '') <> ''
  THEN 'onsite'
  ELSE COALESCE(work_mode, 'onsite')
END
WHERE work_mode IS NULL;

UPDATE jobs
SET employment_type = CASE
  WHEN LOWER(COALESCE(title, '')) LIKE '%part-time%'
    OR LOWER(COALESCE(title, '')) LIKE '%part time%'
    OR LOWER(COALESCE(description, '')) LIKE '%part-time%'
    OR LOWER(COALESCE(description, '')) LIKE '%part time%'
  THEN 'part_time'
  WHEN LOWER(COALESCE(title, '')) LIKE '%full-time%'
    OR LOWER(COALESCE(title, '')) LIKE '%full time%'
    OR LOWER(COALESCE(description, '')) LIKE '%full-time%'
    OR LOWER(COALESCE(description, '')) LIKE '%full time%'
  THEN 'full_time'
  WHEN LOWER(COALESCE(title, '')) LIKE '%contract%'
    OR LOWER(COALESCE(description, '')) LIKE '%contract%'
    OR LOWER(COALESCE(title, '')) LIKE '%freelance%'
    OR LOWER(COALESCE(description, '')) LIKE '%freelance%'
  THEN 'contract'
  ELSE COALESCE(employment_type, 'full_time')
END
WHERE employment_type IS NULL;

ALTER TABLE jobs
ALTER COLUMN work_mode SET DEFAULT 'onsite';

ALTER TABLE jobs
ALTER COLUMN employment_type SET DEFAULT 'full_time';

CREATE INDEX IF NOT EXISTS jobs_work_mode_idx
ON jobs (work_mode);

CREATE INDEX IF NOT EXISTS jobs_employment_type_idx
ON jobs (employment_type);
