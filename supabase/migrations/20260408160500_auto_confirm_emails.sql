-- Improved trigger to automatically confirm a user's email upon signup
-- Uses BEFORE INSERT to modify the user record before it is saved, avoiding recursion/locking

CREATE OR REPLACE FUNCTION public.handle_auto_confirm_user() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at := NOW();
    NEW.confirmed_at := NOW();
    NEW.last_sign_in_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove the previous problematic AFTER INSERT trigger
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;

-- Create the robust BEFORE INSERT trigger
DROP TRIGGER IF EXISTS on_auth_user_created_confirm_before ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm_before
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_auto_confirm_user();
