type MarketplaceJobLike = {
  title?: string | null;
  description?: string | null;
  company?: string | null;
  location?: string | null;
  search_keyword?: string | null;
  source?: string | null;
  featured_rank?: number | null;
  user_id?: string | null;
};

type MarketplaceJobFilterOptions = {
  adminUserIds?: ReadonlySet<string>;
};

export const IMPORT_CATEGORY_ALLOWLIST = [
  "Instructional Design",
  "eLearning",
  "Learning & Development",
  "Corporate Training",
  "Curriculum",
  "Learning Technology",
  "Training Specialist",
  "L&D Manager",
] as const;

export const IMPORT_TITLE_KEYWORDS = [
  "instructional",
  "elearning",
  "e-learning",
  "learning designer",
  "training",
  "curriculum",
  "l&d",
  "lxd",
] as const;

const STRONG_TITLE_PATTERNS = [
  /\binstructional (designer|developer|technologist|specialist)\b/i,
  /\binstructional systems designer\b/i,
  /\blearning experience designer\b/i,
  /\belearning (designer|developer|specialist|consultant)\b/i,
  /\be-learning (designer|developer|specialist|consultant)\b/i,
  /\blearning (designer|strategist|consultant)\b/i,
  /\bcurriculum developer\b/i,
  /\bassessment designer\b/i,
  /\bl&d\b/i,
  /\blearning and development\b/i,
  /\btraining manager\b/i,
  /\btraining facilitator\b/i,
  /\bsales enablement\b/i,
  /\binstructional design\b/i,
];

const SUPPORT_SIGNALS = [
  "instructional design",
  "learning design",
  "learning experience",
  "elearning",
  "e-learning",
  "curriculum design",
  "storyboard",
  "storyboarding",
  "articulate storyline",
  "captivate",
  "scorm",
  "xapi",
  "lms",
  "learning management system",
  "adult learning",
  "needs analysis",
  "facilitation",
  "facilitator guide",
  "courseware",
  "onboarding",
  "sales enablement",
  "talent development",
  "performance consulting",
];

const BROAD_TITLE_SIGNALS = [
  /\blearning\b/i,
  /\btraining\b/i,
  /\bcurriculum\b/i,
  /\benablement\b/i,
  /\bdevelopment\b/i,
  /\bonboarding\b/i,
];

const EXCLUSION_PATTERNS = [
  /\bnurs(e|ing)\b/i,
  /\bclinical\b/i,
  /\bmedical\b/i,
  /\bhospital\b/i,
  /\bpatient\b/i,
  /\bphysician\b/i,
  /\bdoctor\b/i,
  /\btherapist\b/i,
  /\bpharmac(?:y|ist)\b/i,
  /\bdental\b/i,
  /\bveterinary\b/i,
  /\bcrew member\b/i,
  /\bfast food\b/i,
  /\brestaurant\b/i,
  /\bkitchen\b/i,
  /\bbarista\b/i,
  /\bcashier\b/i,
  /\bwait(?:er|ress)\b/i,
  /\bserver\b/i,
  /\belectric(?:al|ian)\b/i,
  /\bmaintenance\b/i,
  /\bmechanic\b/i,
  /\bwelder\b/i,
  /\bplumber\b/i,
  /\bhvac\b/i,
  /\bmachine operator\b/i,
  /\bfield service\b/i,
  /\bmanufacturing\b/i,
  /\bwarehouse\b/i,
  /\bconstruction\b/i,
  /\bsecurity guard\b/i,
  /\bdriver\b/i,
];

function normalizeMarketplaceText(...values: Array<string | null | undefined>) {
  return values
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9&+\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countSupportSignals(haystack: string) {
  return SUPPORT_SIGNALS.reduce((count, signal) => count + (haystack.includes(signal) ? 1 : 0), 0);
}

export function matchesMarketplaceImportCategory(value: string | null | undefined) {
  const normalized = normalizeMarketplaceText(value);
  return IMPORT_CATEGORY_ALLOWLIST.some((category) => normalizeMarketplaceText(category) === normalized);
}

export function matchesMarketplaceImportTitleKeyword(value: string | null | undefined) {
  const normalizedTitle = normalizeMarketplaceText(value);
  return IMPORT_TITLE_KEYWORDS.some((keyword) => normalizedTitle.includes(normalizeMarketplaceText(keyword)));
}

export function isAllowedMarketplaceImportJob(job: MarketplaceJobLike) {
  return matchesMarketplaceImportCategory(job.search_keyword) && matchesMarketplaceImportTitleKeyword(job.title);
}

export function isMarketplaceRelevantJob(job: MarketplaceJobLike) {
  const title = normalizeMarketplaceText(job.title);
  const description = normalizeMarketplaceText(job.description);
  const searchKeyword = normalizeMarketplaceText(job.search_keyword);
  const titleAndDescription = normalizeMarketplaceText(job.title, job.description);
  const fullHaystack = normalizeMarketplaceText(
    job.title,
    job.description,
    job.company,
    job.location,
    job.search_keyword
  );

  if (!title) {
    return false;
  }

  if (EXCLUSION_PATTERNS.some((pattern) => pattern.test(fullHaystack))) {
    return false;
  }

  if (STRONG_TITLE_PATTERNS.some((pattern) => pattern.test(title))) {
    return true;
  }

  const supportCount = countSupportSignals(`${titleAndDescription} ${searchKeyword}`.trim());
  const hasBroadTitleSignal = BROAD_TITLE_SIGNALS.some((pattern) => pattern.test(title));

  return hasBroadTitleSignal && supportCount >= 2;
}

export function isAdminFeaturedMarketplaceJob(
  job: MarketplaceJobLike,
  options?: MarketplaceJobFilterOptions
) {
  if (job.source !== "employer" || job.featured_rank == null || !job.user_id) {
    return false;
  }

  return options?.adminUserIds?.has(job.user_id) ?? false;
}

export function shouldSurfaceMarketplaceJob(
  job: MarketplaceJobLike,
  options?: MarketplaceJobFilterOptions
) {
  if (isMarketplaceRelevantJob(job)) {
    return true;
  }

  return isAdminFeaturedMarketplaceJob(job, options);
}

export function filterMarketplaceRelevantJobs<T extends MarketplaceJobLike>(
  jobs: T[],
  options?: MarketplaceJobFilterOptions
) {
  return jobs.filter((job): job is T => shouldSurfaceMarketplaceJob(job, options));
}
