ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS candidate_designation TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT;

ALTER TABLE exam_questions
ADD COLUMN IF NOT EXISTS assessment_track TEXT DEFAULT 'general_lxd',
ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS section_name TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE exam_attempts
ADD COLUMN IF NOT EXISTS assessment_track TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT;

UPDATE profiles
SET experience_level = CASE designation_level
  WHEN 'Level 1' THEN 'entry_level'
  WHEN 'Level 2' THEN 'mid_level'
  WHEN 'Level 3' THEN 'mid_level'
  WHEN 'Level 4' THEN 'senior_level'
  WHEN 'Level 5' THEN 'lead_level'
  WHEN 'Level 6' THEN 'lead_level'
  ELSE COALESCE(experience_level, 'mid_level')
END
WHERE experience_level IS NULL;

UPDATE profiles
SET candidate_designation = COALESCE(candidate_designation, 'general_lxd')
WHERE role IN ('candidate_onhold', 'candidate_mvp')
  AND candidate_designation IS NULL;

UPDATE exam_questions
SET assessment_track = COALESCE(assessment_track, 'general_lxd'),
    experience_level = COALESCE(experience_level, 'all'),
    section_name = COALESCE(NULLIF(skill_tag, ''), 'General')
WHERE assessment_track IS NULL
   OR experience_level IS NULL
   OR section_name IS NULL;

CREATE INDEX IF NOT EXISTS profiles_candidate_designation_idx
ON profiles (candidate_designation);

CREATE INDEX IF NOT EXISTS profiles_experience_level_idx
ON profiles (experience_level);

CREATE INDEX IF NOT EXISTS exam_questions_bucket_lookup_idx
ON exam_questions (assessment_track, experience_level, is_active);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    role_val text;
    designation_val text;
    experience_val text;
    parsed_role public.user_role;
    mapped_level public.designation_level;
BEGIN
    role_val := new.raw_user_meta_data->>'role';
    designation_val := COALESCE(NULLIF(new.raw_user_meta_data->>'candidate_designation', ''), NULL);
    experience_val := COALESCE(NULLIF(new.raw_user_meta_data->>'experience_level', ''), NULL);

    BEGIN
        parsed_role := role_val::public.user_role;
    EXCEPTION WHEN OTHERS THEN
        parsed_role := 'visitor'::public.user_role;
    END;

    IF parsed_role IS NULL THEN
        parsed_role := 'visitor'::public.user_role;
    END IF;

    mapped_level := CASE experience_val
        WHEN 'entry_level' THEN 'Level 1'::public.designation_level
        WHEN 'mid_level' THEN 'Level 2'::public.designation_level
        WHEN 'senior_level' THEN 'Level 4'::public.designation_level
        WHEN 'lead_level' THEN 'Level 5'::public.designation_level
        ELSE NULL
    END;

    BEGIN
        INSERT INTO public.profiles (
            id,
            email,
            name,
            role,
            candidate_designation,
            experience_level,
            designation_level
        )
        VALUES (
            new.id,
            new.email,
            new.raw_user_meta_data->>'name',
            parsed_role,
            designation_val,
            experience_val,
            mapped_level
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
    END;

    RETURN new;
END;
$$;
