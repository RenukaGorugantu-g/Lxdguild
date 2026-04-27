-- Fix NULL and invalid user roles
-- Ensure all users have valid roles based on their context

-- First, update any NULL roles to candidate_onhold as default
UPDATE profiles 
SET role = 'candidate_onhold'::user_role
WHERE role IS NULL;

-- Verify no invalid roles exist (in case of data corruption)
UPDATE profiles 
SET role = 'candidate_onhold'::user_role
WHERE role::text NOT IN ('visitor', 'candidate_onhold', 'candidate_mvp', 'employer_free', 'employer_pro', 'employer_premium', 'pro_member', 'admin');

-- Ensure all candidate_onhold users have a corresponding entry in candidates table
INSERT INTO candidates (user_id, exam_status, pass_status)
SELECT id, 'not_started', 'pending'
FROM profiles 
WHERE role IN ('candidate_onhold'::user_role, 'candidate_mvp'::user_role)
AND id NOT IN (SELECT user_id FROM candidates)
ON CONFLICT (user_id) DO NOTHING;

-- Ensure all employer users have a corresponding entry in employers table
INSERT INTO employers (user_id, employer_plan)
SELECT id, role::text::user_role
FROM profiles 
WHERE role IN ('employer_free'::user_role, 'employer_pro'::user_role, 'employer_premium'::user_role)
AND id NOT IN (SELECT user_id FROM employers)
ON CONFLICT (user_id) DO NOTHING;
