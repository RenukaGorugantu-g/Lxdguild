-- 1. Expand Profiles Table with professional details
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS experience_years NUMERIC(4,1);

-- 2. Ensure Resumes table has a name for the file
ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 3. Create a bucket for resumes (Note: This might need to be done in dashboard depending on Supabase version, but adding policy anyway)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT DO NOTHING;

-- RLS for Storage (Optional/Defensive)
-- We can add these later if we can confirm storage schema access.
