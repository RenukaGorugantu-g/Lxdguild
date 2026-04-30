-- Stop auto-confirming auth users at the database layer.
-- Email verification should be handled by Supabase Auth settings instead.

DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_confirm_before ON auth.users;

DROP FUNCTION IF EXISTS public.handle_auto_confirm_user();
DROP FUNCTION IF EXISTS public.handle_auto_confirm_user_v2();
