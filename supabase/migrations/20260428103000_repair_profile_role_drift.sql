-- Repair profile role drift caused by stale metadata/profile recreation paths.
-- Only candidates who passed the exam should remain candidate_mvp.
-- Approved course certificates unlock a reattempt, not MVP verification.

UPDATE profiles
SET
  role = 'candidate_mvp'::user_role,
  verification_status = 'verified'::verification_status
WHERE id IN (
  SELECT c.user_id
  FROM candidates c
  WHERE c.pass_status = 'pass'
)
AND role = 'candidate_onhold'::user_role;

UPDATE candidates
SET reattempt_allowed = true
WHERE user_id IN (
  SELECT cert.user_id
  FROM certificates cert
  WHERE cert.status = 'approved'
)
AND COALESCE(pass_status, 'pending'::pass_status) <> 'pass'::pass_status;

UPDATE profiles
SET
  role = 'candidate_onhold'::user_role,
  verification_status = 'unverified'::verification_status
WHERE id IN (
  SELECT cert.user_id
  FROM certificates cert
  JOIN candidates c ON c.user_id = cert.user_id
  WHERE cert.status = 'approved'
    AND COALESCE(c.pass_status, 'pending'::pass_status) <> 'pass'::pass_status
);
