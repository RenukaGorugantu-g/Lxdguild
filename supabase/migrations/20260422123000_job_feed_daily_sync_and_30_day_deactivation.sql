UPDATE jobs
SET expires_at = COALESCE(external_posted_at, imported_at, created_at, timezone('utc'::text, now())) + INTERVAL '30 days'
WHERE is_active = true
  AND (
    expires_at IS NULL
    OR expires_at < COALESCE(external_posted_at, imported_at, created_at, timezone('utc'::text, now())) + INTERVAL '30 days'
  );
