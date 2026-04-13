-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Candidates Policies
CREATE POLICY "Candidates can view their own data" ON candidates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Employers can view MVP candidates" ON candidates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.role IN ('employer_free', 'employer_pro', 'employer_premium')
        )
        AND pass_status = 'pass'
    );

-- Jobs Policies
CREATE POLICY "Anyone can view jobs" ON jobs
    FOR SELECT USING (true);

-- Resumes Policies
DROP POLICY IF EXISTS "Users can view their own resume" ON resumes;
CREATE POLICY "Users can view their own resume" ON resumes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own resume" ON resumes;
CREATE POLICY "Users can insert their own resume" ON resumes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own resume" ON resumes;
CREATE POLICY "Users can update their own resume" ON resumes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own resume" ON resumes;
CREATE POLICY "Users can delete their own resume" ON resumes
    FOR DELETE USING (auth.uid() = user_id);

-- Resources Policies
CREATE POLICY "Pro members viewing" ON resources
    FOR SELECT USING (
        premium_only = false OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND (profiles.role = 'pro_member' OR profiles.role = 'admin')
        )
    );

-- Admin Policies (Full access)
CREATE POLICY "Admins have full access" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
-- ... same for other tables if necessary. For now, this is enough to start MVP.
