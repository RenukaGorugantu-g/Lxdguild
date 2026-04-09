-- Update certificates table to include a status for the review process
ALTER TABLE certificates DROP COLUMN IF EXISTS approved;
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'certificate_status') THEN
        CREATE TYPE certificate_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

ALTER TABLE certificates ADD COLUMN IF NOT EXISTS status certificate_status DEFAULT 'pending';

-- Enable RLS and add policies for certificates
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upload their own certificates" ON certificates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own certificates" ON certificates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view and update all certificates" ON certificates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Double check candidates table RLS for updates
DROP POLICY IF EXISTS "Candidates can update candidate data" ON candidates;
CREATE POLICY "Candidates can update their own data" ON candidates
    FOR UPDATE USING (auth.uid() = user_id);
