ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS employer_designation TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT;

ALTER TABLE employers
ADD COLUMN IF NOT EXISTS employer_designation TEXT;

CREATE INDEX IF NOT EXISTS profiles_company_name_idx
ON profiles (company_name);

CREATE INDEX IF NOT EXISTS profiles_employer_designation_idx
ON profiles (employer_designation);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    role_val text;
    candidate_designation_val text;
    experience_val text;
    employer_designation_val text;
    company_name_val text;
    parsed_role public.user_role;
    mapped_level public.designation_level;
BEGIN
    role_val := new.raw_user_meta_data->>'role';
    candidate_designation_val := COALESCE(NULLIF(new.raw_user_meta_data->>'candidate_designation', ''), NULL);
    experience_val := COALESCE(NULLIF(new.raw_user_meta_data->>'experience_level', ''), NULL);
    employer_designation_val := COALESCE(NULLIF(new.raw_user_meta_data->>'employer_designation', ''), NULL);
    company_name_val := COALESCE(NULLIF(new.raw_user_meta_data->>'company_name', ''), NULL);

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
            designation_level,
            employer_designation,
            company_name
        )
        VALUES (
            new.id,
            new.email,
            new.raw_user_meta_data->>'name',
            parsed_role,
            candidate_designation_val,
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
