-- Fix the auto-confirm trigger by removing the old AFTER INSERT one and adding the correct BEFORE INSERT one
-- This fixes the "Database error saving new user"

-- 1. Remove the problematic AFTER INSERT trigger
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;

-- 2. Create the robust BEFORE INSERT trigger
CREATE OR REPLACE FUNCTION public.handle_auto_confirm_user_v2() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at := NOW();
    NEW.confirmed_at := NOW();
    NEW.last_sign_in_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_confirm_before ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm_before
    BEFORE INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_auto_confirm_user_v2();
