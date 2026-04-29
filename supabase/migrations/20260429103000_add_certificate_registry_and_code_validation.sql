DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'certificate_validation_source'
  ) THEN
    CREATE TYPE certificate_validation_source AS ENUM (
      'manual',
      'design_similarity',
      'registry_code'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS certificate_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_code TEXT NOT NULL UNIQUE,
  learndash_user_id BIGINT,
  learner_email TEXT NOT NULL,
  learner_name TEXT,
  course_id BIGINT,
  course_name TEXT,
  completion_date TIMESTAMPTZ,
  certificate_url TEXT,
  certificate_id_display TEXT,
  claimed_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS certificate_registry_learner_email_idx
  ON certificate_registry (lower(learner_email));

ALTER TABLE certificate_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage certificate registry" ON certificate_registry;
CREATE POLICY "Admins can manage certificate registry"
ON certificate_registry
FOR ALL
USING (
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

ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS certificate_code TEXT,
  ADD COLUMN IF NOT EXISTS validation_source certificate_validation_source DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS validation_notes TEXT,
  ADD COLUMN IF NOT EXISTS registry_entry_id UUID REFERENCES certificate_registry(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS certificates_certificate_code_idx
  ON certificates (certificate_code);
