ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
ADD COLUMN IF NOT EXISTS external_posted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS source_job_id TEXT,
ADD COLUMN IF NOT EXISTS search_keyword TEXT;

UPDATE jobs
SET
  is_active = COALESCE(is_active, true),
  imported_at = COALESCE(imported_at, created_at, timezone('utc'::text, now())),
  last_seen_at = COALESCE(last_seen_at, created_at, timezone('utc'::text, now())),
  expires_at = COALESCE(expires_at, COALESCE(created_at, timezone('utc'::text, now())) + INTERVAL '20 days');

ALTER TABLE jobs
ALTER COLUMN is_active SET DEFAULT true,
ALTER COLUMN is_active SET NOT NULL,
ALTER COLUMN imported_at SET DEFAULT timezone('utc'::text, now()),
ALTER COLUMN imported_at SET NOT NULL,
ALTER COLUMN last_seen_at SET DEFAULT timezone('utc'::text, now()),
ALTER COLUMN last_seen_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS jobs_is_active_sort_idx
ON jobs (is_active, COALESCE(external_posted_at, imported_at) DESC);

CREATE INDEX IF NOT EXISTS jobs_expires_at_idx
ON jobs (expires_at);

CREATE TABLE IF NOT EXISTS job_feed_sync_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT,
  last_sync_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO job_feed_sync_state (id, last_synced_at, last_sync_status, last_sync_message)
VALUES (1, NULL, 'idle', NULL)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS saved_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, company_name)
);

CREATE TABLE IF NOT EXISTS followed_job_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, keyword)
);

ALTER TABLE saved_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE followed_job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_feed_sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their saved companies" ON saved_companies;
CREATE POLICY "Users can view their saved companies" ON saved_companies
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their saved companies" ON saved_companies;
CREATE POLICY "Users can insert their saved companies" ON saved_companies
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their saved companies" ON saved_companies;
CREATE POLICY "Users can delete their saved companies" ON saved_companies
FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their followed roles" ON followed_job_roles;
CREATE POLICY "Users can view their followed roles" ON followed_job_roles
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their followed roles" ON followed_job_roles;
CREATE POLICY "Users can insert their followed roles" ON followed_job_roles
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their followed roles" ON followed_job_roles;
CREATE POLICY "Users can delete their followed roles" ON followed_job_roles
FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view sync state" ON job_feed_sync_state;
CREATE POLICY "Admins can view sync state" ON job_feed_sync_state
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);
