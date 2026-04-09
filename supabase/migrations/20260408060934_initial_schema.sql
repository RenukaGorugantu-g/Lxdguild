-- initial schema

CREATE TYPE user_role AS ENUM (
    'visitor',
    'candidate_onhold',
    'candidate_mvp',
    'employer_free',
    'employer_pro',
    'employer_premium',
    'pro_member',
    'admin'
);

CREATE TYPE designation_level AS ENUM (
    'Level 1',
    'Level 2',
    'Level 3',
    'Level 4',
    'Level 5',
    'Level 6'
);

CREATE TYPE verification_status AS ENUM (
    'unverified',
    'verified'
);

CREATE TYPE exam_status AS ENUM (
    'not_started',
    'in_progress',
    'completed'
);

CREATE TYPE pass_status AS ENUM (
    'pending',
    'pass',
    'fail'
);

-- Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role user_role DEFAULT 'visitor',
    designation_level designation_level,
    verification_status verification_status DEFAULT 'unverified',
    membership_status TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Candidates Table
CREATE TABLE candidates (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    exam_status exam_status DEFAULT 'not_started',
    pass_status pass_status DEFAULT 'pending',
    latest_score NUMERIC(5,2),
    reattempt_allowed BOOLEAN DEFAULT false
);

-- Employers Table
CREATE TABLE employers (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    company_name TEXT,
    employer_plan user_role DEFAULT 'employer_free',
    payment_status TEXT DEFAULT 'pending'
);

-- Jobs Table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    company TEXT,
    location TEXT,
    source TEXT,
    apply_url TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Exam Questions Table
CREATE TABLE exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designation_level designation_level NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    skill_tag TEXT
);

-- Exam Attempts Table
CREATE TABLE exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    designation_level designation_level,
    score NUMERIC(5,2),
    pass_fail pass_status,
    scorecard_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Resumes Table
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    visibility TEXT DEFAULT 'private'
);

-- Courses Table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designation_level designation_level,
    skill_focus TEXT,
    title TEXT NOT NULL,
    external_link TEXT NOT NULL
);

-- Certificates Table
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    certificate_url TEXT NOT NULL,
    approved BOOLEAN DEFAULT false
);

-- Resources Table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT,
    title TEXT NOT NULL,
    file_link TEXT NOT NULL,
    premium_only BOOLEAN DEFAULT true
);

-- Triggers for Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'name', 'visitor');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
