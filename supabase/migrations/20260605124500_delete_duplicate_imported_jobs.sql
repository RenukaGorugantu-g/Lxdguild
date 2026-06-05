WITH ranked_jobs AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY
        lower(trim(COALESCE(title, ''))),
        lower(trim(COALESCE(company, ''))),
        lower(trim(COALESCE(location, ''))),
        COALESCE(job_kind, 'standard')
      ORDER BY
        COALESCE(external_posted_at, imported_at, created_at) DESC,
        created_at DESC,
        id DESC
    ) AS row_num
  FROM public.jobs
  WHERE COALESCE(source, '') <> 'employer'
)
DELETE FROM public.jobs
WHERE id IN (
  SELECT id
  FROM ranked_jobs
  WHERE row_num > 1
);
