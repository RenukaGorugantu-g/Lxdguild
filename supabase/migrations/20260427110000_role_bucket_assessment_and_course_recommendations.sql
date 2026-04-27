ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS candidate_target_role TEXT;

ALTER TABLE exam_questions
ADD COLUMN IF NOT EXISTS designation_bucket TEXT DEFAULT 'Intermediate',
ADD COLUMN IF NOT EXISTS question_set TEXT DEFAULT 'set1',
ADD COLUMN IF NOT EXISTS set_weight INTEGER DEFAULT 25;

ALTER TABLE exam_attempts
ADD COLUMN IF NOT EXISTS target_role TEXT,
ADD COLUMN IF NOT EXISTS designation_bucket TEXT;

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS recommendation_type TEXT DEFAULT 'improvement',
ADD COLUMN IF NOT EXISTS designation_bucket TEXT,
ADD COLUMN IF NOT EXISTS target_role TEXT,
ADD COLUMN IF NOT EXISTS course_code TEXT;

UPDATE profiles
SET candidate_target_role = COALESCE(candidate_target_role, 'Instructional Designer')
WHERE role IN ('candidate_onhold', 'candidate_mvp')
  AND candidate_target_role IS NULL;

UPDATE profiles
SET candidate_designation = CASE
  WHEN candidate_target_role IN ('Junior ID', 'L&D Coordinator', 'Training Assistant') THEN 'Beginner'
  WHEN candidate_target_role IN ('Instructional Designer', 'eLearning Developer', 'Curriculum Developer') THEN 'Intermediate'
  WHEN candidate_target_role IN ('Senior ID', 'LX Designer', 'L&D Manager', 'Learning Strategist') THEN 'Senior'
  WHEN candidate_target_role IN ('CLO', 'Head of L&D', 'Director of Talent Development') THEN 'Leader'
  ELSE COALESCE(candidate_designation, 'Intermediate')
END
WHERE role IN ('candidate_onhold', 'candidate_mvp');

UPDATE exam_questions
SET
  designation_bucket = COALESCE(
    designation_bucket,
    CASE
      WHEN designation_level = 'Level 1' THEN 'Beginner'
      WHEN designation_level IN ('Level 2', 'Level 3') THEN 'Intermediate'
      WHEN designation_level = 'Level 4' THEN 'Senior'
      WHEN designation_level IN ('Level 5', 'Level 6') THEN 'Leader'
      ELSE 'Intermediate'
    END
  ),
  question_set = COALESCE(question_set, 'set1'),
  set_weight = COALESCE(set_weight, 25);

DELETE FROM courses
WHERE title = 'C5 - Prototype Course'
   OR course_code = 'C5';

CREATE INDEX IF NOT EXISTS profiles_candidate_target_role_idx
ON profiles (candidate_target_role);

CREATE INDEX IF NOT EXISTS exam_questions_bucket_set_idx
ON exam_questions (designation_bucket, question_set, is_active);

CREATE INDEX IF NOT EXISTS courses_recommendation_lookup_idx
ON courses (recommendation_type, designation_bucket, target_role);

INSERT INTO courses (
  designation_level,
  skill_focus,
  title,
  external_link,
  recommendation_type,
  designation_bucket,
  target_role,
  course_code
) VALUES
('Level 1', 'Improvement Path', 'Beginner Improvement Course', 'https://example.com/courses/beginner-improvement', 'improvement', 'Beginner', NULL, 'B1'),
('Level 2', 'Improvement Path', 'Intermediate Improvement Course', 'https://example.com/courses/intermediate-improvement', 'improvement', 'Intermediate', NULL, 'I1'),
('Level 4', 'Improvement Path', 'Senior Improvement Course', 'https://example.com/courses/senior-improvement', 'improvement', 'Senior', NULL, 'S1'),
('Level 5', 'Improvement Path', 'Leader Improvement Course', 'https://example.com/courses/leader-improvement', 'improvement', 'Leader', NULL, 'L1'),
('Level 2', 'Next Level Path', 'Beginner Next Level Course', 'https://example.com/courses/beginner-next-level', 'next_level', 'Beginner', NULL, 'B2'),
('Level 4', 'Next Level Path', 'Intermediate Next Level Course', 'https://example.com/courses/intermediate-next-level', 'next_level', 'Intermediate', NULL, 'I2'),
('Level 5', 'Next Level Path', 'Senior Next Level Course', 'https://example.com/courses/senior-next-level', 'next_level', 'Senior', NULL, 'S2'),
('Level 6', 'Next Level Path', 'Leader Next Level Course', 'https://example.com/courses/leader-next-level', 'next_level', 'Leader', NULL, 'L2')
ON CONFLICT (external_link) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    role_val text;
    candidate_role_val text;
    candidate_bucket_val text;
    employer_designation_val text;
    company_name_val text;
    experience_val text;
    parsed_role public.user_role;
    mapped_level public.designation_level;
BEGIN
    role_val := new.raw_user_meta_data->>'role';
    candidate_role_val := COALESCE(NULLIF(new.raw_user_meta_data->>'candidate_target_role', ''), NULL);
    candidate_bucket_val := COALESCE(NULLIF(new.raw_user_meta_data->>'candidate_designation', ''), NULL);
    employer_designation_val := COALESCE(NULLIF(new.raw_user_meta_data->>'employer_designation', ''), NULL);
    company_name_val := COALESCE(NULLIF(new.raw_user_meta_data->>'company_name', ''), NULL);
    experience_val := COALESCE(NULLIF(new.raw_user_meta_data->>'experience_level', ''), NULL);

    BEGIN
        parsed_role := role_val::public.user_role;
    EXCEPTION WHEN OTHERS THEN
        parsed_role := 'visitor'::public.user_role;
    END;

    IF parsed_role IS NULL THEN
        parsed_role := 'visitor'::public.user_role;
    END IF;

    mapped_level := CASE
        WHEN candidate_bucket_val = 'Beginner' THEN 'Level 1'::public.designation_level
        WHEN candidate_bucket_val = 'Intermediate' THEN 'Level 2'::public.designation_level
        WHEN candidate_bucket_val = 'Senior' THEN 'Level 4'::public.designation_level
        WHEN candidate_bucket_val = 'Leader' THEN 'Level 5'::public.designation_level
        WHEN experience_val = 'entry_level' THEN 'Level 1'::public.designation_level
        WHEN experience_val = 'mid_level' THEN 'Level 2'::public.designation_level
        WHEN experience_val = 'senior_level' THEN 'Level 4'::public.designation_level
        WHEN experience_val = 'lead_level' THEN 'Level 5'::public.designation_level
        ELSE NULL
    END;

    BEGIN
        INSERT INTO public.profiles (
            id,
            email,
            name,
            role,
            candidate_target_role,
            candidate_designation,
            experience_level,
            designation_level,
            employer_designation,
            company_name
        )
        VALUES (
            new.id,
            new.email,
            new.raw_user_meta_data->>'name',
            parsed_role,
            candidate_role_val,
            candidate_bucket_val,
            experience_val,
            mapped_level,
            employer_designation_val,
            company_name_val
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
    END;

    IF parsed_role IN ('employer_free'::public.user_role, 'employer_pro'::public.user_role, 'employer_premium'::public.user_role) THEN
        BEGIN
            INSERT INTO public.employers (
                user_id,
                company_name,
                employer_plan,
                employer_designation
            )
            VALUES (
                new.id,
                company_name_val,
                parsed_role,
                employer_designation_val
            )
            ON CONFLICT (user_id) DO UPDATE
            SET
                company_name = EXCLUDED.company_name,
                employer_plan = EXCLUDED.employer_plan,
                employer_designation = EXCLUDED.employer_designation;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Employer creation failed for user %: %', new.id, SQLERRM;
        END;
    END IF;

    RETURN new;
END;
$$;
