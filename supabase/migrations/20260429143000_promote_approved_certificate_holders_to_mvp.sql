-- Approved certificates now grant MVP access.
-- Repair users who were previously left in candidate_onhold after certificate approval.

UPDATE candidates
SET
  pass_status = 'pass'::pass_status,
  reattempt_allowed = false
WHERE user_id IN (
  SELECT cert.user_id
  FROM certificates cert
  WHERE cert.status = 'approved'
);

UPDATE profiles
SET
  role = 'candidate_mvp'::user_role,
  verification_status = 'verified'::verification_status
WHERE id IN (
  SELECT cert.user_id
  FROM certificates cert
  WHERE cert.status = 'approved'
);
