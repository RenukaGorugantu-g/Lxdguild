import { createAdminClient } from "@/utils/supabase/admin";

const JOB_FEED_KEYWORDS = [
  "Instructional Designer",
  "Senior Instructional Designer",
  "Instructional Systems Designer",
  "Learning Strategist",
  "Learning Experience Designer",
  "eLearning Developer",
  "Curriculum Developer",
  "Learning Designer",
  "L&D Specialist",
  "Learning and Development Manager",
  "Learning Consultant",
  "Assessment Designer",
  "Instructional Technologist",
];

const JOOBLE_LOCATIONS = [
  "Remote",
];
const ADZUNA_COUNTRIES = ["in", "us"];
const STALE_AFTER_HOURS = 24;
const DEACTIVATE_AFTER_DAYS = 30;
const HARD_DELETE_AFTER_DAYS = 60;
const MAX_SOURCE_PAGES = 1;
const RESULTS_PER_PAGE = 50;
const JSEARCH_RESULTS_PER_PAGE = 10;
const SOURCE_TIMEOUT_MS = 12000;
const FREELANCE_SEARCH_QUERIES = [
  "instructional designer freelance remote",
  "elearning developer freelance remote",
];
const JSEARCH_STANDARD_QUERIES = [
  "Instructional Designer",
  "eLearning Developer",
  "Learning Experience Designer",
  "Curriculum Developer",
];
const RELEVANCE_TOKENS = [
  "instructional",
  "learning",
  "elearning",
  "e-learning",
  "curriculum",
  "training",
  "enablement",
  "l&d",
  "learning development",
  "content developer",
  "assessment",
  "courseware",
  "course",
];

type NormalizedJob = {
  title: string;
  description: string;
  company: string;
  location: string;
  work_mode: "remote" | "hybrid" | "onsite";
  employment_type: "full_time" | "part_time" | "contract";
  source: string;
  apply_url: string;
  source_job_id?: string | null;
  search_keyword?: string | null;
  external_posted_at?: string | null;
  imported_at: string;
  last_seen_at: string;
  expires_at: string;
  is_active: boolean;
  job_kind: "standard" | "freelance";
};

type SyncCounters = {
  imported: number;
  refreshed: number;
  expired: number;
  hardDeleted: number;
  skipped: boolean;
  reason?: string;
};

type SyncTrigger = "cron" | "manual" | "stale" | "unknown";

type SyncRunRecord = {
  id: string;
};

type ExistingJobMatch = {
  id: string;
  source: string | null;
  source_job_id: string | null;
  apply_url: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  job_kind?: "standard" | "freelance" | null;
};

type ExistingJobIndex = {
  bySourceId: Map<string, ExistingJobMatch[]>;
  byNormalizedUrl: Map<string, ExistingJobMatch[]>;
  byFingerprint: Map<string, ExistingJobMatch[]>;
};

async function startSyncRun(trigger: SyncTrigger) {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("job_feed_sync_runs")
    .insert({
      trigger_source: trigger,
      status: "running",
    })
    .select("id")
    .single();

  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }

  return data as SyncRunRecord;
}

async function getJobInventoryCounts(supportsLifecycle: boolean) {
  const supabase = createAdminClient();
  if (!supabase) return { activeJobsCount: null, totalJobsCount: null };

  const totalJobsQuery = supabase.from("jobs").select("*", { count: "exact", head: true });
  const activeJobsQuery = supportsLifecycle
    ? supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true)
    : null;

  const [totalJobsResult, activeJobsResult] = await Promise.all([
    totalJobsQuery,
    activeJobsQuery,
  ]);

  return {
    activeJobsCount: supportsLifecycle ? activeJobsResult?.count ?? null : null,
    totalJobsCount: totalJobsResult.count ?? null,
  };
}

async function finishSyncRun(
  runId: string | null | undefined,
  payload: {
    status: "success" | "warning" | "failed" | "skipped";
    imported: number;
    refreshed: number;
    expired: number;
    hardDeleted: number;
    message?: string;
    errorMessage?: string;
    supportsLifecycle: boolean;
  }
) {
  if (!runId) return;

  const supabase = createAdminClient();
  if (!supabase) return;

  const { activeJobsCount, totalJobsCount } = await getJobInventoryCounts(payload.supportsLifecycle);

  const { error } = await supabase
    .from("job_feed_sync_runs")
    .update({
      status: payload.status,
      completed_at: new Date().toISOString(),
      imported_count: payload.imported,
      refreshed_count: payload.refreshed,
      expired_count: payload.expired,
      hard_deleted_count: payload.hardDeleted,
      active_jobs_count: activeJobsCount,
      total_jobs_count: totalJobsCount,
      message: payload.message ?? null,
      error_message: payload.errorMessage ?? null,
    })
    .eq("id", runId);

  if (error && !isMissingSchemaError(error)) {
    throw error;
  }
}

function isMissingSchemaError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === "42703" ||
    maybeError.code === "PGRST205" ||
    maybeError.message?.includes("does not exist") === true ||
    maybeError.message?.includes("schema cache") === true
  );
}

function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function expiryFrom(externalPostedAt: string | null, nowIso: string) {
  const base = externalPostedAt ? new Date(externalPostedAt) : new Date(nowIso);
  base.setUTCDate(base.getUTCDate() + DEACTIVATE_AFTER_DAYS);
  return base.toISOString();
}

function normalizeText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9&+\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeApplyUrl(value: string | null | undefined) {
  if (!value) return "";

  try {
    const url = new URL(value.trim());
    url.hash = "";

    const removableParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gh_src",
      "gh_jid",
      "gclid",
      "fbclid",
      "ref",
      "refid",
      "referral",
      "tracking",
      "track",
    ];

    for (const key of removableParams) {
      url.searchParams.delete(key);
    }

    const keptParams = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
    url.search = "";
    for (const [key, paramValue] of keptParams) {
      url.searchParams.append(key, paramValue);
    }

    const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.protocol}//${url.host.toLowerCase()}${normalizedPath}${url.search}`;
  } catch {
    return value.trim().replace(/\/+$/, "");
  }
}

function buildJobFingerprint(job: Pick<NormalizedJob, "title" | "company" | "location" | "job_kind">) {
  return [
    normalizeText(job.title),
    normalizeText(job.company),
    normalizeText(job.location),
    job.job_kind,
  ].join("::");
}

function buildJobIdentity(job: NormalizedJob) {
  if (job.source_job_id) {
    return `source:${job.source}::${job.source_job_id}`;
  }

  const normalizedApplyUrl = normalizeApplyUrl(job.apply_url);
  if (normalizedApplyUrl) {
    return `url:${normalizedApplyUrl}`;
  }

  return `fingerprint:${buildJobFingerprint(job)}`;
}

function pickPreferredJob(current: NormalizedJob | undefined, candidate: NormalizedJob) {
  if (!current) return candidate;

  const currentDescriptionLength = current.description?.length ?? 0;
  const candidateDescriptionLength = candidate.description?.length ?? 0;
  const currentHasExternalDate = current.external_posted_at ? 1 : 0;
  const candidateHasExternalDate = candidate.external_posted_at ? 1 : 0;

  if (candidateHasExternalDate !== currentHasExternalDate) {
    return candidateHasExternalDate > currentHasExternalDate ? candidate : current;
  }

  if (candidateDescriptionLength !== currentDescriptionLength) {
    return candidateDescriptionLength > currentDescriptionLength ? candidate : current;
  }

  return current;
}

function appendToIndex(map: Map<string, ExistingJobMatch[]>, key: string, value: ExistingJobMatch) {
  if (!key) return;
  const existing = map.get(key);
  if (existing) {
    existing.push(value);
    return;
  }
  map.set(key, [value]);
}

async function preloadExistingJobIndex() {
  const supabase = createAdminClient();
  if (!supabase) {
    return {
      rows: [] as ExistingJobMatch[],
      index: {
        bySourceId: new Map<string, ExistingJobMatch[]>(),
        byNormalizedUrl: new Map<string, ExistingJobMatch[]>(),
        byFingerprint: new Map<string, ExistingJobMatch[]>(),
      } satisfies ExistingJobIndex,
    };
  }

  const { data } = await supabase
    .from("jobs")
    .select("id, source, source_job_id, apply_url, title, company, location, job_kind")
    .neq("source", "employer")
    .limit(50000);

  const rows = (data || []) as ExistingJobMatch[];
  const index: ExistingJobIndex = {
    bySourceId: new Map<string, ExistingJobMatch[]>(),
    byNormalizedUrl: new Map<string, ExistingJobMatch[]>(),
    byFingerprint: new Map<string, ExistingJobMatch[]>(),
  };

  for (const row of rows) {
    if (row.source && row.source_job_id) {
      appendToIndex(index.bySourceId, `${row.source}::${row.source_job_id}`, row);
    }

    const normalizedUrl = normalizeApplyUrl(row.apply_url);
    if (normalizedUrl) {
      appendToIndex(index.byNormalizedUrl, normalizedUrl, row);
    }

    appendToIndex(
      index.byFingerprint,
      buildJobFingerprint({
        title: row.title || "",
        company: row.company || "",
        location: row.location || "",
        job_kind: row.job_kind || "standard",
      }),
      row
    );
  }

  return { rows, index };
}

function findExistingJobsForMatch(job: NormalizedJob, index: ExistingJobIndex) {
  const matches = new Map<string, ExistingJobMatch>();

  if (job.source_job_id) {
    for (const row of index.bySourceId.get(`${job.source}::${job.source_job_id}`) || []) {
      matches.set(row.id, row);
    }
  }

  const normalizedUrl = normalizeApplyUrl(job.apply_url);
  if (normalizedUrl) {
    for (const row of index.byNormalizedUrl.get(normalizedUrl) || []) {
      matches.set(row.id, row);
    }
  }

  for (const row of index.byFingerprint.get(buildJobFingerprint(job)) || []) {
    matches.set(row.id, row);
  }

  return [...matches.values()];
}

function inferWorkMode(...values: Array<string | null | undefined>) {
  const haystack = normalizeText(values.filter(Boolean).join(" "));
  if (
    haystack.includes("remote") ||
    haystack.includes("work from home") ||
    haystack.includes("wfh")
  ) {
    return "remote" as const;
  }
  if (haystack.includes("hybrid")) {
    return "hybrid" as const;
  }
  return "onsite" as const;
}

function inferEmploymentType(...values: Array<string | null | undefined>) {
  const haystack = normalizeText(values.filter(Boolean).join(" "));
  if (
    haystack.includes("part time") ||
    haystack.includes("part-time") ||
    haystack.includes("parttime")
  ) {
    return "part_time" as const;
  }
  if (
    haystack.includes("contract") ||
    haystack.includes("freelance") ||
    haystack.includes("consultant")
  ) {
    return "contract" as const;
  }
  return "full_time" as const;
}

function isRelevantLndRole(title: string, description: string, keyword: string) {
  const haystack = `${normalizeText(title)} ${normalizeText(description)} ${normalizeText(keyword)}`;
  return RELEVANCE_TOKENS.some((token) => haystack.includes(token));
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAdzunaJobs(
  keyword: string,
  country: string,
  nowIso: string
): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID || "38c5d4ef";
  const appKey = process.env.ADZUNA_APP_KEY || "456857cd33fb800c9e17dfc068c108b5";
  const results: NormalizedJob[] = [];

  for (let page = 1; page <= MAX_SOURCE_PAGES; page += 1) {
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(keyword)}&results_per_page=${RESULTS_PER_PAGE}&content-type=application/json&sort_by=date`;
    const resp = await fetchWithTimeout(url, { cache: "no-store" });
    if (!resp.ok) continue;

    const data = await resp.json();
    for (const job of data.results || []) {
      const applyUrl = job.redirect_url || "";
      const title = job.title || "";
      const description = job.description || "";
      if (!applyUrl || !title) continue;
      if (!isRelevantLndRole(title, description, keyword)) continue;

      const externalPostedAt = normalizeDate(job.created);
      results.push({
        title,
        description,
        company: job.company?.display_name || "Unknown",
        location: job.location?.display_name || "Remote",
        work_mode: inferWorkMode(job.location?.display_name, title, description),
        employment_type: inferEmploymentType(title, description),
        source: "adzuna",
        apply_url: applyUrl,
        source_job_id: job.id ? String(job.id) : null,
        search_keyword: keyword,
        external_posted_at: externalPostedAt,
        imported_at: nowIso,
        last_seen_at: nowIso,
        expires_at: expiryFrom(externalPostedAt, nowIso),
        is_active: true,
        job_kind: "standard",
      });
    }

    if (!(data.results || []).length) {
      break;
    }
  }

  return results;
}

async function fetchJoobleJobs(keyword: string, location: string, nowIso: string): Promise<NormalizedJob[]> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return [];

  const results: NormalizedJob[] = [];

  for (let page = 1; page <= MAX_SOURCE_PAGES; page += 1) {
    const resp = await fetchWithTimeout(`https://jooble.org/api/${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        keywords: keyword,
        location,
        page,
        resultsPerPage: RESULTS_PER_PAGE,
      }),
    });

    if (!resp.ok) continue;

    const data = await resp.json();
    for (const job of data.jobs || []) {
      const applyUrl = job.link || "";
      const title = job.title || "";
      const description = job.snippet || "";
      if (!applyUrl || !title) continue;
      if (!isRelevantLndRole(title, description, keyword)) continue;

      const externalPostedAt = normalizeDate(job.updated || job.created || job.pubDate);
      results.push({
        title,
        description,
        company: job.company || "Unknown",
        location: job.location || location || "Remote",
        work_mode: inferWorkMode(job.location || location, title, description),
        employment_type: inferEmploymentType(title, description),
        source: "jooble",
        apply_url: applyUrl,
        source_job_id: job.id ? String(job.id) : null,
        search_keyword: keyword,
        external_posted_at: externalPostedAt,
        imported_at: nowIso,
        last_seen_at: nowIso,
        expires_at: expiryFrom(externalPostedAt, nowIso),
        is_active: true,
        job_kind: "standard",
      });
    }

    if (!(data.jobs || []).length) {
      break;
    }
  }

  return results;
}

async function fetchJSearchJobs(
  query: string,
  nowIso: string,
  jobKind: "standard" | "freelance",
  publisherFilter?: string
): Promise<NormalizedJob[]> {
  const rapidApiKey =
    process.env.RAPIDAPI_KEY ||
    process.env.RAPID_API_KEY ||
    process.env.X_RAPIDAPI_KEY;
  if (!rapidApiKey) return [];

  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=1`;
  const resp = await fetchWithTimeout(url, {
    headers: {
      "x-rapidapi-key": rapidApiKey,
      "x-rapidapi-host": "jsearch.p.rapidapi.com",
    },
    cache: "no-store",
  });

  if (!resp.ok) return [];

  const data = await resp.json();
  const jobs: Array<Record<string, unknown>> = Array.isArray(data.data)
    ? (data.data.slice(0, JSEARCH_RESULTS_PER_PAGE) as Array<Record<string, unknown>>)
    : [];

  return jobs
    .filter((job) => {
      const title = String(job.job_title || "");
      const description = String(job.job_description || "");
      const publisher = String(job.job_publisher || "");
      const matchesPublisher = publisherFilter
        ? publisher.toLowerCase().includes(publisherFilter.toLowerCase())
        : true;
      return title && matchesPublisher && isRelevantLndRole(title, description, query);
    })
    .map((job) => {
      const applyUrl = String(job.job_apply_link || job.job_google_link || "");
      const title = String(job.job_title || "");
      const description = String(job.job_description || "");
      const externalPostedAt = normalizeDate(job.job_posted_at_datetime_utc || job.job_posted_at_timestamp);
      const city = String(job.job_city || "").trim();
      const state = String(job.job_state || "").trim();
      const country = String(job.job_country || "").trim();
      const remote = Boolean(job.job_is_remote);
      const location = remote
        ? "Remote"
        : [city, state, country].filter(Boolean).join(", ") || "Remote";

      const publisher = String(job.job_publisher || "rapidapi");
      const normalizedPublisher = publisher.toLowerCase();
      const source =
        normalizedPublisher.includes("indeed")
          ? "indeed"
          : `jsearch:${publisher}`;

      return {
        title,
        description,
        company: String(job.employer_name || "Unknown"),
        location,
        work_mode: remote ? "remote" : inferWorkMode(location, title, description),
        employment_type: inferEmploymentType(
          title,
          description,
          Array.isArray(job.job_employment_types) ? job.job_employment_types.join(" ") : null
        ),
        source,
        apply_url: applyUrl,
        source_job_id: job.job_id ? String(job.job_id) : null,
        search_keyword: query,
        external_posted_at: externalPostedAt,
        imported_at: nowIso,
        last_seen_at: nowIso,
        expires_at: expiryFrom(externalPostedAt, nowIso),
        is_active: true,
        job_kind: jobKind,
      } satisfies NormalizedJob;
    })
    .filter((job) => job.apply_url);
}

async function fetchJSearchFreelanceJobs(query: string, nowIso: string): Promise<NormalizedJob[]> {
  return fetchJSearchJobs(query, nowIso, "freelance");
}

async function fetchJSearchIndeedJobs(query: string, nowIso: string): Promise<NormalizedJob[]> {
  return fetchJSearchJobs(query, nowIso, "standard", "indeed");
}

export async function syncJobFeed(options?: { trigger?: SyncTrigger }) {
  const supabase = createAdminClient();
  if (!supabase) {
    return { imported: 0, refreshed: 0, expired: 0, hardDeleted: 0, skipped: true, reason: "Missing service role credentials." };
  }

  const nowIso = new Date().toISOString();
  const supportsLifecycle = await hasJobFeedLifecycleSchema();
  const trigger = options?.trigger ?? "unknown";
  const syncRun = await startSyncRun(trigger);

  try {
    if (supportsLifecycle) {
      await supabase
        .from("job_feed_sync_state")
        .upsert({
          id: 1,
          last_sync_status: "running",
          last_sync_message: "Job sync in progress",
          updated_at: nowIso,
        });
    }

    const collected = new Map<string, NormalizedJob>();

    const adzunaRequests = JOB_FEED_KEYWORDS.flatMap((keyword) =>
      ADZUNA_COUNTRIES.map((country) => fetchAdzunaJobs(keyword, country, nowIso))
    );
    const joobleRequests = JOB_FEED_KEYWORDS
      .slice(0, 4)
      .flatMap((keyword) => JOOBLE_LOCATIONS.map((location) => fetchJoobleJobs(keyword, location, nowIso)));
    const jsearchRequests = [
      ...FREELANCE_SEARCH_QUERIES.map((query) => fetchJSearchFreelanceJobs(query, nowIso)),
      ...JSEARCH_STANDARD_QUERIES.map((query) => fetchJSearchIndeedJobs(query, nowIso)),
    ];

    const sourceResults = await Promise.all([
      ...adzunaRequests,
      ...joobleRequests,
      ...jsearchRequests,
    ]);

    for (const jobs of sourceResults) {
      for (const job of jobs) {
        const identity = buildJobIdentity(job);
        const existing = collected.get(identity);
        collected.set(identity, pickPreferredJob(existing, job));
      }
    }

    if (collected.size === 0) {
      const emptyResult = {
        imported: 0,
        refreshed: 0,
        expired: 0,
        hardDeleted: 0,
        skipped: true,
        reason: "No jobs were returned from any configured source, so existing listings were left unchanged.",
      } satisfies SyncCounters;

      if (supportsLifecycle) {
        await supabase
          .from("job_feed_sync_state")
          .upsert({
            id: 1,
            last_synced_at: nowIso,
            last_sync_status: "warning",
            last_sync_message: emptyResult.reason,
            updated_at: nowIso,
          });
      }

      await finishSyncRun(syncRun?.id, {
        status: "warning",
        imported: emptyResult.imported,
        refreshed: emptyResult.refreshed,
        expired: emptyResult.expired,
        hardDeleted: emptyResult.hardDeleted,
        message: emptyResult.reason,
        supportsLifecycle,
      });

      return emptyResult;
    }

    const result = supportsLifecycle
      ? await upsertLifecycleJobs(collected, nowIso)
      : await upsertLegacyJobs(collected);

    if (supportsLifecycle) {
      await supabase
        .from("job_feed_sync_state")
        .upsert({
          id: 1,
          last_synced_at: nowIso,
          last_sync_status: "success",
          last_sync_message: `Imported ${result.imported}, refreshed ${result.refreshed}, expired ${result.expired}.`,
          updated_at: nowIso,
        });
    }

    await finishSyncRun(syncRun?.id, {
      status: result.skipped ? "skipped" : "success",
      imported: result.imported,
      refreshed: result.refreshed,
      expired: result.expired,
      hardDeleted: result.hardDeleted,
      message: result.reason ?? `Imported ${result.imported}, refreshed ${result.refreshed}, expired ${result.expired}, deleted ${result.hardDeleted}.`,
      supportsLifecycle,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    if (supportsLifecycle) {
      await supabase
        .from("job_feed_sync_state")
        .upsert({
          id: 1,
          last_sync_status: "failed",
          last_sync_message: message,
          updated_at: nowIso,
        });
    }
    await finishSyncRun(syncRun?.id, {
      status: "failed",
      imported: 0,
      refreshed: 0,
      expired: 0,
      hardDeleted: 0,
      errorMessage: message,
      message: "Job sync failed.",
      supportsLifecycle,
    });
    throw error;
  }
}

export async function syncJobFeedIfStale() {
  const supabase = createAdminClient();
  if (!supabase) return { ran: false, reason: "Missing service role credentials." };

  const supportsLifecycle = await hasJobFeedLifecycleSchema();
  if (!supportsLifecycle) {
    const result = await syncJobFeed({ trigger: "stale" });
    return { ran: true, ...result, mode: "legacy" as const };
  }

  const { data: syncState } = await supabase
    .from("job_feed_sync_state")
    .select("last_synced_at, last_sync_status")
    .eq("id", 1)
    .maybeSingle();

  const lastSyncedAt = syncState?.last_synced_at ? new Date(syncState.last_synced_at) : null;
  const hoursSinceLastSync = lastSyncedAt
    ? (Date.now() - lastSyncedAt.getTime()) / (1000 * 60 * 60)
    : Number.POSITIVE_INFINITY;

  if (hoursSinceLastSync < STALE_AFTER_HOURS && syncState?.last_sync_status !== "failed") {
    return { ran: false, reason: "Feed still fresh." };
  }

  const result = await syncJobFeed({ trigger: "stale" });
  return { ran: true, ...result };
}

export function getJobFeedKeywords() {
  return JOB_FEED_KEYWORDS;
}

async function hasJobFeedLifecycleSchema() {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const [jobsColumnsCheck, syncStateCheck] = await Promise.all([
    supabase
      .from("jobs")
      .select("is_active, imported_at, last_seen_at, expires_at, external_posted_at, source_job_id, search_keyword, job_kind, work_mode, employment_type")
      .limit(1),
    supabase.from("job_feed_sync_state").select("id").eq("id", 1).maybeSingle(),
  ]);

  return !jobsColumnsCheck.error && !syncStateCheck.error;
}

async function upsertLegacyJobs(collected: Map<string, NormalizedJob>): Promise<SyncCounters> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { imported: 0, refreshed: 0, expired: 0, hardDeleted: 0, skipped: true, reason: "Missing service role credentials." };
  }

  const { index } = await preloadExistingJobIndex();

  let imported = 0;
  let refreshed = 0;

  for (const job of collected.values()) {
    const matches = findExistingJobsForMatch(job, index);
    const [primaryMatch] = matches;

    const payload = {
      title: job.title,
      description: job.description,
      company: job.company,
      location: job.location,
      work_mode: job.work_mode,
      employment_type: job.employment_type,
      source: job.source,
      apply_url: job.apply_url,
      job_kind: job.job_kind,
    };

    if (primaryMatch?.id) {
      refreshed += 1;
      const { error: updateError } = await supabase.from("jobs").update(payload).eq("id", primaryMatch.id);
      if (updateError) throw updateError;

      const duplicateIds = matches.slice(1).map((match) => match.id);
      if (duplicateIds.length) {
        const { data: appliedRows } = await supabase
          .from("job_applications")
          .select("job_id")
          .in("job_id", duplicateIds);

        const appliedIds = new Set((appliedRows || []).map((row) => row.job_id));
        const safeToDelete = duplicateIds.filter((id) => !appliedIds.has(id));
        if (safeToDelete.length) {
          const { error: deleteError } = await supabase.from("jobs").delete().in("id", safeToDelete);
          if (deleteError) throw deleteError;
        }
      }
    } else {
      imported += 1;
      const { error: insertError } = await supabase.from("jobs").insert(payload);
      if (insertError) throw insertError;
    }
  }

  return { imported, refreshed, expired: 0, hardDeleted: 0, skipped: false };
}

async function upsertLifecycleJobs(collected: Map<string, NormalizedJob>, nowIso: string): Promise<SyncCounters> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { imported: 0, refreshed: 0, expired: 0, hardDeleted: 0, skipped: true, reason: "Missing service role credentials." };
  }

  const { index } = await preloadExistingJobIndex();

  let imported = 0;
  let refreshed = 0;

  for (const job of collected.values()) {
    const matches = findExistingJobsForMatch(job, index);
    const [primaryMatch] = matches;

    if (primaryMatch?.id) {
      refreshed += 1;
      const { error: updateError } = await supabase
        .from("jobs")
        .update({
          title: job.title,
          description: job.description,
          company: job.company,
          location: job.location,
          work_mode: job.work_mode,
          employment_type: job.employment_type,
          source: job.source,
          source_job_id: job.source_job_id,
          search_keyword: job.search_keyword,
          external_posted_at: job.external_posted_at,
          last_seen_at: job.last_seen_at,
          expires_at: job.expires_at,
          is_active: true,
          job_kind: job.job_kind,
        })
        .eq("id", primaryMatch.id);

      if (updateError) throw updateError;

      const duplicateIds = matches.slice(1).map((match) => match.id);
      if (duplicateIds.length) {
        const { data: appliedRows } = await supabase
          .from("job_applications")
          .select("job_id")
          .in("job_id", duplicateIds);

        const appliedIds = new Set((appliedRows || []).map((row) => row.job_id));
        const safeToDeactivate = duplicateIds.filter((id) => !appliedIds.has(id));

        if (safeToDeactivate.length) {
          const { error: deactivateError } = await supabase
            .from("jobs")
            .update({ is_active: false, last_seen_at: nowIso })
            .in("id", safeToDeactivate);

          if (deactivateError) throw deactivateError;
        }
      }
    } else {
      imported += 1;
      const { error: insertError } = await supabase.from("jobs").insert(job);
      if (insertError) throw insertError;
    }
  }

  const expiryThreshold = new Date();
  expiryThreshold.setUTCDate(expiryThreshold.getUTCDate() - DEACTIVATE_AFTER_DAYS);

  const { data: staleJobs } = await supabase
    .from("jobs")
    .select("id")
    .or(`expires_at.lt.${nowIso},last_seen_at.lt.${expiryThreshold.toISOString()}`)
    .eq("is_active", true);

  const staleJobIds = (staleJobs || []).map((job) => job.id);
  let expired = 0;
  if (staleJobIds.length) {
    expired = staleJobIds.length;
    await supabase
      .from("jobs")
      .update({ is_active: false })
      .in("id", staleJobIds);
  }

  const deleteThreshold = new Date();
  deleteThreshold.setUTCDate(deleteThreshold.getUTCDate() - HARD_DELETE_AFTER_DAYS);

  const { data: deletableJobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("is_active", false)
    .neq("source", "employer")
    .lt("last_seen_at", deleteThreshold.toISOString());

  const deletableJobIds = (deletableJobs || []).map((job) => job.id);

  let hardDeleted = 0;
  if (deletableJobIds.length) {
    const { data: appliedRows } = await supabase
      .from("job_applications")
      .select("job_id")
      .in("job_id", deletableJobIds);

    const appliedJobIds = new Set((appliedRows || []).map((row) => row.job_id));
    const safeToDelete = deletableJobIds.filter((jobId) => !appliedJobIds.has(jobId));

    if (safeToDelete.length) {
      hardDeleted = safeToDelete.length;
      await supabase
        .from("jobs")
        .delete()
        .in("id", safeToDelete);
    }
  }

  return { imported, refreshed, expired, hardDeleted, skipped: false };
}
