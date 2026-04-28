-- Normalize legacy membership markers so the app and database agree.

UPDATE profiles
SET
  membership_plan = COALESCE(membership_plan, CASE
    WHEN membership_status = 'pro' THEN 'pro'
    WHEN membership_status = 'premium' THEN 'premium'
    WHEN membership_status IN ('paid', 'member') THEN 'member_annual'
    ELSE membership_plan
  END),
  membership_status = CASE
    WHEN membership_status IN ('pro', 'premium', 'paid', 'member') THEN 'active'
    ELSE membership_status
  END
WHERE membership_status IN ('pro', 'premium', 'paid', 'member');
