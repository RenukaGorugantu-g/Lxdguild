ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS ats_score NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS ats_summary TEXT,
ADD COLUMN IF NOT EXISTS ats_recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ats_highlights JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ats_missing_skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ats_analysis_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ats_analysis_error TEXT,
ADD COLUMN IF NOT EXISTS ats_last_analyzed_at TIMESTAMP WITH TIME ZONE;

UPDATE resumes
SET ats_analysis_status = COALESCE(ats_analysis_status, 'pending');

ALTER TABLE resumes
ALTER COLUMN ats_analysis_status SET DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resumes_ats_analysis_status_check'
  ) THEN
    ALTER TABLE resumes
    ADD CONSTRAINT resumes_ats_analysis_status_check
    CHECK (ats_analysis_status IN ('pending', 'processing', 'completed', 'failed'));
  END IF;
END $$;

ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shortlisted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ats_score NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS ats_summary TEXT,
ADD COLUMN IF NOT EXISTS ats_recommendations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ats_matched_keywords JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ats_missing_keywords JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ats_analysis_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ats_analysis_error TEXT,
ADD COLUMN IF NOT EXISTS ats_last_analyzed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ats_auto_decision TEXT,
ADD COLUMN IF NOT EXISTS ats_auto_decision_reason TEXT;

UPDATE job_applications
SET ats_analysis_status = COALESCE(ats_analysis_status, 'pending');

ALTER TABLE job_applications
ALTER COLUMN ats_analysis_status SET DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_applications_ats_analysis_status_check'
  ) THEN
    ALTER TABLE job_applications
    ADD CONSTRAINT job_applications_ats_analysis_status_check
    CHECK (ats_analysis_status IN ('pending', 'processing', 'completed', 'failed'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_applications_ats_auto_decision_check'
  ) THEN
    ALTER TABLE job_applications
    ADD CONSTRAINT job_applications_ats_auto_decision_check
    CHECK (ats_auto_decision IN ('shortlisted', 'rejected', 'manual_review') OR ats_auto_decision IS NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS job_applications_resume_id_idx
ON job_applications (resume_id);

CREATE INDEX IF NOT EXISTS job_applications_ats_score_idx
ON job_applications (ats_score DESC);
