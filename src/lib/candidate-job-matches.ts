import { filterMarketplaceRelevantJobs } from "@/lib/marketplace-job-filter";

export type CandidateMatchJob = {
  id: string;
  title?: string | null;
  description?: string | null;
  company?: string | null;
  location?: string | null;
  work_mode?: string | null;
  employment_type?: string | null;
  featured_rank?: number | null;
  external_posted_at?: string | null;
  imported_at?: string | null;
  created_at?: string | null;
  is_active?: boolean | null;
  source?: string | null;
  user_id?: string | null;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").toLowerCase().replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getTargetKeywords(targetRole?: string | null, designationBucket?: string | null) {
  const normalizedRole = normalizeText(targetRole || "instructional designer");
  const keywords = new Set<string>();

  for (const token of normalizedRole.split(/[^a-z0-9&+-]+/)) {
    if (token.length >= 3) keywords.add(token);
  }

  if (normalizedRole) keywords.add(normalizedRole);

  if (normalizedRole.includes("instructional")) {
    keywords.add("storyline");
    keywords.add("curriculum");
    keywords.add("learning design");
  }

  if (normalizedRole.includes("elearning") || normalizedRole.includes("e-learning")) {
    keywords.add("elearning");
    keywords.add("e-learning");
    keywords.add("articulate");
    keywords.add("captivate");
  }

  if (normalizedRole.includes("manager") || normalizedRole.includes("strategist") || normalizedRole.includes("head")) {
    keywords.add("leadership");
    keywords.add("strategy");
    keywords.add("capability");
  }

  switch ((designationBucket || "").toLowerCase()) {
    case "beginner":
      keywords.add("associate");
      keywords.add("coordinator");
      break;
    case "senior":
      keywords.add("senior");
      keywords.add("lead");
      break;
    case "leader":
      keywords.add("head");
      keywords.add("director");
      keywords.add("manager");
      break;
    default:
      break;
  }

  return [...keywords];
}

function getJobFreshness(job: CandidateMatchJob) {
  const dateValue = job.external_posted_at || job.imported_at || job.created_at || "";
  const parsed = Date.parse(dateValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

function scoreJobForCandidate(job: CandidateMatchJob, targetRole?: string | null, designationBucket?: string | null) {
  const normalizedTitle = normalizeText(job.title);
  const normalizedDescription = normalizeText(job.description);
  const haystack = `${normalizedTitle} ${normalizedDescription} ${normalizeText(job.company)} ${normalizeText(job.location)}`.trim();
  const normalizedRole = normalizeText(targetRole);
  const keywords = getTargetKeywords(targetRole, designationBucket);

  let score = 0;

  if (normalizedRole && normalizedTitle.includes(normalizedRole)) score += 48;
  if (normalizedRole && normalizedDescription.includes(normalizedRole)) score += 22;

  for (const keyword of keywords) {
    if (normalizedTitle.includes(keyword)) {
      score += 14;
      continue;
    }

    if (haystack.includes(keyword)) {
      score += 6;
    }
  }

  if (job.featured_rank != null) {
    score += Math.max(10, 30 - job.featured_rank);
  }

  if (job.work_mode === "remote") score += 2;

  return score;
}

export function selectMatchedJobs(
  jobs: CandidateMatchJob[],
  targetRole?: string | null,
  designationBucket?: string | null,
  limit = 5
) {
  const relevantJobs = filterMarketplaceRelevantJobs(jobs.filter((job) => job.is_active !== false));
  const seen = new Set<string>();

  const scoredJobs = relevantJobs
    .map((job) => ({
      job,
      score: scoreJobForCandidate(job, targetRole, designationBucket),
      freshness: getJobFreshness(job),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return right.freshness - left.freshness;
    });

  const prioritized = (scoredJobs.some((entry) => entry.score > 0)
    ? scoredJobs.filter((entry) => entry.score > 0)
    : scoredJobs
  )
    .map((entry) => entry.job)
    .filter((job) => {
      const key = `${normalizeText(job.title)}|${normalizeText(job.company)}|${normalizeText(job.location)}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return prioritized.slice(0, limit);
}

export function getVerifiedBadgeLabel(targetRole?: string | null) {
  const label = (targetRole || "L&D Professional").trim();
  return `Verified ${label}`;
}
