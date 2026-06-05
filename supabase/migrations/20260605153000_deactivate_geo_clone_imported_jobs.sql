WITH ranked_jobs AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        lower(trim(COALESCE(title, ''))),
        lower(trim(COALESCE(company, ''))),
        lower(trim(COALESCE(source, ''))),
        COALESCE(job_kind, 'standard'),
        COALESCE(work_mode, 'onsite'),
        COALESCE(employment_type, 'full_time'),
        left(
          regexp_replace(
            regexp_replace(lower(COALESCE(description, '')), '<[^>]+>', ' ', 'g'),
            '\s+',
            ' ',
            'g'
          ),
          240
        )
      ORDER BY
        COALESCE(external_posted_at, imported_at, created_at) DESC,
        created_at DESC,
        id DESC
    ) AS row_num
  FROM public.jobs
  WHERE COALESCE(source, '') <> 'employer'
    AND COALESCE(is_active, false) = true
)
UPDATE public.jobs
SET is_active = false
WHERE id IN (
  SELECT id
  FROM ranked_jobs
  WHERE row_num > 1
);
