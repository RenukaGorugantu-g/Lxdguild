-- Update the handle_new_user trigger to be completely robust
-- Adds search_path to prevent schema path issues during trigger execution
-- Safely catches cast exceptions (e.g. invalid string passed from client)

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    role_val text;
    parsed_role public.user_role;
BEGIN
    role_val := new.raw_user_meta_data->>'role';
    
    -- Safely attempt to parse the role
    BEGIN
        parsed_role := role_val::public.user_role;
    EXCEPTION WHEN OTHERS THEN
        parsed_role := 'vsisitor'::public.user_role;
    END;

    -- Fallback for NULL
    IF parsed_role IS NULL THEN
        parsed_role := 'visitor'::public.user_role;
    END IF;

    -- Insert into profiles table
    BEGIN
        INSERT INTO public.profiles (id, email, name, role)
        VALUES (new.id, new.email, new.raw_user_meta_data->>'name', parsed_role);
    EXCEPTION WHEN OTHERS THEN
        -- If profile insert fails (e.g., duplicates), log it but DO NOT block user creation
        RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
    END;
    
    RETURN new;
END;
$$;
