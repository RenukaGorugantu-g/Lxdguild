-- Add employer ownership to jobs so posted roles can be listed per employer
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
