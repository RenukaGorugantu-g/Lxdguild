DELETE FROM public.jobs
WHERE COALESCE(source, '') <> 'employer'
  AND NOT (
    COALESCE(title, '') ~* '(instructional|elearning|e-learning|learning designer|training|curriculum|l&d|lxd)'
  );
