-- 1. Enable RLS read access for candidates to see their own exam attempts
-- This fixes the "not seeing scorecard" issue
DROP POLICY IF EXISTS "Users can view their own exam attempts" ON exam_attempts;
CREATE POLICY "Users can view their own exam attempts" ON exam_attempts 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all exam attempts" ON exam_attempts;
CREATE POLICY "Admins can view all exam attempts" ON exam_attempts 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 2. Enable RLS read access for courses
-- This allows the Learning Path to show recommended courses
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
CREATE POLICY "Anyone can view courses" ON courses 
    FOR SELECT USING (true);

-- 3. Enable RLS for jobs table
-- Allow anyone to view jobs
DROP POLICY IF EXISTS "Anyone can view jobs" ON jobs;
CREATE POLICY "Anyone can view jobs" ON jobs
    FOR SELECT USING (true);

-- Allow anyone to manage jobs (for initial seeding/import)
DROP POLICY IF EXISTS "Public can insert jobs" ON jobs;
CREATE POLICY "Public can insert jobs" ON jobs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage jobs" ON jobs;
CREATE POLICY "Admins can manage jobs" ON jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 4. Seed sample courses for the Learning Path
-- Add unique constraint first to prevent duplicates on re-run
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_external_link_key;
ALTER TABLE courses ADD CONSTRAINT courses_external_link_key UNIQUE (external_link);

INSERT INTO courses (designation_level, skill_focus, title, external_link) VALUES
('Level 1', 'Adult learning theory', 'Foundations of Adult Learning (Coursera)', 'https://www.coursera.org/learn/adult-learning'),
('Level 1', 'Storyboarding', 'Visual Storyboarding for eLearning', 'https://www.linkedin.com/learning/elearning-storyboarding'),
('Level 1', 'Instructional Design Models', 'Mastering ADDIE and SAM', 'https://www.udemy.com/course/instructional-design-models/'),
('Level 2', 'Assessment design', 'Effective Assessment Strategies', 'https://www.edx.org/course/assessment-strategies'),
('Level 3', 'Authoring tools', 'Articulate Storyline 360: Advanced', 'https://training.articulate.com/'),
('Level 4', 'Evaluation', 'Kirkpatrick Level 3 & 4 Implementation', 'https://www.kirkpatrickpartners.com/'),
('Level 5', 'Learning UX', 'UX Design for Learning Professionals', 'https://www.nngroup.com/courses/ux-learning/'),
('Level 6', 'Stakeholder consulting', 'Consulting Skills for L&D', 'https://www.td.org/courses/consulting-skills-certificate')
ON CONFLICT (external_link) DO NOTHING;

-- 5. Seed some initial jobs to ensure the board isn't empty
INSERT INTO jobs (title, company, description, location, source, apply_url) VALUES
('Senior Instructional Designer', 'TechLearn Global', 'Lead enterprise learning strategy. Experience with ADDIE, SAM, and Articulate Storyline 360 required.', 'Remote (Global)', 'LXD Guild', 'https://example.com/apply/senior-id'),
('eLearning Developer (Contract)', 'Creative Media Studio', 'Build interactive modules from storyboards. Proficiency in Adobe Captivate and Javascript is a plus.', 'Mumbai, India', 'LXD Guild', 'https://example.com/apply/elearning-dev'),
('Learning Experience Designer', 'HealthCore Systems', 'Design patient-facing education materials. Focus on accessibility and mobile-first learning.', 'Remote', 'LXD Guild', 'https://example.com/apply/lxd-health')
ON CONFLICT (apply_url) DO NOTHING;

-- 6. Create Job Applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    resume_url TEXT,
    status TEXT DEFAULT 'applied',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(job_id, user_id)
);

-- 5. Enable RLS for Job Applications
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own applications" ON job_applications;
CREATE POLICY "Users can view their own applications" ON job_applications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own applications" ON job_applications;
CREATE POLICY "Users can insert their own applications" ON job_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Job owners can view applications for their jobs" ON job_applications;
CREATE POLICY "Job owners can view applications for their jobs" ON job_applications
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_applications.job_id
              AND jobs.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all applications" ON job_applications;
CREATE POLICY "Admins can view all applications" ON job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
