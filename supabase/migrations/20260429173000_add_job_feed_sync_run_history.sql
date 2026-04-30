CREATE TABLE IF NOT EXISTS public.job_feed_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_source TEXT NOT NULL DEFAULT 'unknown'
    CHECK (trigger_source IN ('cron', 'manual', 'stale', 'unknown')),
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'warning', 'failed', 'skipped')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMP WITH TIME ZONE,
  run_day DATE GENERATED ALWAYS AS (((started_at AT TIME ZONE 'utc')::date)) STORED,
  imported_count INT NOT NULL DEFAULT 0,
  refreshed_count INT NOT NULL DEFAULT 0,
  expired_count INT NOT NULL DEFAULT 0,
  hard_deleted_count INT NOT NULL DEFAULT 0,
  active_jobs_count INT,
  total_jobs_count INT,
  message TEXT,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS job_feed_sync_runs_run_day_idx
  ON public.job_feed_sync_runs (run_day DESC, started_at DESC);

ALTER TABLE public.job_feed_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE VIEW public.job_feed_daily_metrics AS
SELECT
  run_day,
  COUNT(*) FILTER (WHERE status = 'success') AS successful_runs,
  COUNT(*) FILTER (WHERE status = 'warning') AS warning_runs,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_runs,
  SUM(imported_count) AS imported_count,
  SUM(refreshed_count) AS refreshed_count,
  SUM(expired_count) AS expired_count,
  SUM(hard_deleted_count) AS hard_deleted_count,
  MAX(active_jobs_count) AS latest_active_jobs_count,
  MAX(total_jobs_count) AS latest_total_jobs_count,
  MAX(completed_at) AS last_completed_at
FROM public.job_feed_sync_runs
WHERE status <> 'running'
GROUP BY run_day;
