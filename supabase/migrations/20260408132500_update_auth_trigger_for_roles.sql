-- Update the handle_new_user trigger to parse the role from user metadata
-- Fallback to 'visitor' if the role is not provided or invalid

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'name', 
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'visitor'::user_role)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
