type JobLike = {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  work_mode?: string | null;
  employment_type?: string | null;
  job_kind?: string | null;
  source?: string | null;
  description?: string | null;
};

function normalizeJobDedupText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9&+\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildDescriptionSignature(value: string | null | undefined) {
  const normalized = normalizeJobDedupText(value);
  if (!normalized) return "";
  return normalized.slice(0, 240);
}

export function buildVisibleJobDedupKey(job: JobLike) {
  return [
    normalizeJobDedupText(job.title),
    normalizeJobDedupText(job.company),
    normalizeJobDedupText(job.source),
    normalizeJobDedupText(job.job_kind),
    normalizeJobDedupText(job.work_mode),
    normalizeJobDedupText(job.employment_type),
    buildDescriptionSignature(job.description),
  ].join("::");
}

