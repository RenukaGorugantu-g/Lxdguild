import { createAdminClient } from "@/utils/supabase/admin";

const JOB_FEED_KEYWORDS = [
  "Instructional Designer",
  "Senior Instructional Designer",
  "Lead Instructional Designer",
  "Instructional Design Manager",
  "Instructional Systems Designer",
  "Learning Strategist",
  "Learning Experience Designer",
  "Learning Experience Architect",
  "eLearning Developer",
  "Senior eLearning Developer",
  "Digital Learning Developer",
  "Online Learning Developer",
  "Curriculum Developer",
  "Curriculum Designer",
  "Curriculum Specialist",
  "Learning Designer",
  "L&D Specialist",
  "Learning and Development Specialist",
  "Learning and Development Manager",
  "Learning and Development Partner",
  "L&D Manager",
  "Learning Consultant",
  "Training Designer",
  "Training Specialist",
  "Training Manager",
  "Training Facilitator",
  "Training Developer",
  "Talent Development Specialist",
  "Talent Development Manager",
  "Enablement Designer",
  "Sales Enablement",
  "Sales Enablement Manager",
  "Revenue Enablement",
  "Learning Program Manager",
  "Content Developer",
  "Assessment Designer",
  "Instructional Technologist",
  "Learning Content Developer",
  "Learning Program Specialist",
  "Learning Experience Manager",
  "Corporate Trainer",
  "LMS Administrator",
  "LMS Specialist",
  "Learning Operations Specialist",
];

const JOOBLE_LOCATIONS = [
  "India",
  "United States",
  "Remote",
  "United Kingdom",
  "Canada",
  "Australia",
  "Singapore",
  "United Arab Emirates",
];
const ADZUNA_COUNTRIES = ["in", "us", "gb", "ca", "au", "sg"];
const STALE_AFTER_HOURS = 24;
const DEACTIVATE_AFTER_DAYS = 30;
const HARD_DELETE_AFTER_DAYS = 60;
const MAX_SOURCE_PAGES = 8;
const RESULTS_PER_PAGE = 50;
const JSEARCH_RESULTS_PER_PAGE = 10;
const FREELANCE_SEARCH_QUERIES = [
  "instructional designer freelance remote",
  "instructional designer contract remote",
  "elearning developer freelance remote",
  "learning designer freelance remote",
  "training consultant freelance remote",
];
const JSEARCH_STANDARD_QUERIES = [
  "Instructional Designer",
  "eLearning Developer",
  "Learning Experience Designer",
  "Curriculum Developer",
  "Learning and Development Manager",
  "Training Manager",
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
  skipped: boolean;
  reason?: string;
};

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
  return (value || "").toLowerCase().replace(/[^a-z0-9&+\s-]/g, " ");
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
    const resp = await fetch(url, { cache: "no-store" });
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
    const resp = await fetch(`https://jooble.org/api/${apiKey}`, {
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
  const resp = await fetch(url, {
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

export async function syncJobFeed() {
  const supabase = createAdminClient();
  if (!supabase) {
    return { imported: 0, refreshed: 0, expired: 0, skipped: true, reason: "Missing service role credentials." };
  }

  const nowIso = new Date().toISOString();
  const supportsLifecycle = await hasJobFeedLifecycleSchema();

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

    for (const keyword of JOB_FEED_KEYWORDS) {
      for (const country of ADZUNA_COUNTRIES) {
        const jobs = await fetchAdzunaJobs(keyword, country, nowIso);
        for (const job of jobs) {
          collected.set(job.apply_url, job);
        }
      }

      for (const location of JOOBLE_LOCATIONS) {
        const jobs = await fetchJoobleJobs(keyword, location, nowIso);
        for (const job of jobs) {
          collected.set(job.apply_url, job);
        }
      }
    }

    for (const query of FREELANCE_SEARCH_QUERIES) {
      const jobs = await fetchJSearchFreelanceJobs(query, nowIso);
      for (const job of jobs) {
        collected.set(job.apply_url, job);
      }
    }

    for (const query of JSEARCH_STANDARD_QUERIES) {
      const jobs = await fetchJSearchIndeedJobs(query, nowIso);
      for (const job of jobs) {
        collected.set(job.apply_url, job);
      }
    }

    if (collected.size === 0) {
      const emptyResult = {
        imported: 0,
        refreshed: 0,
        expired: 0,
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
    throw error;
  }
}

export async function syncJobFeedIfStale() {
  const supabase = createAdminClient();
  if (!supabase) return { ran: false, reason: "Missing service role credentials." };

  const supportsLifecycle = await hasJobFeedLifecycleSchema();
  if (!supportsLifecycle) {
    const result = await syncJobFeed();
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

  const result = await syncJobFeed();
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
    return { imported: 0, refreshed: 0, expired: 0, skipped: true, reason: "Missing service role credentials." };
  }

  let imported = 0;
  let refreshed = 0;

  for (const job of collected.values()) {
    const { data: existing, error: existingError } = await supabase
      .from("jobs")
      .select("id")
      .eq("apply_url", job.apply_url)
      .maybeSingle();

    if (existingError && !isMissingSchemaError(existingError)) {
      throw existingError;
    }

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

    if (existing?.id) {
      refreshed += 1;
      const { error: updateError } = await supabase.from("jobs").update(payload).eq("id", existing.id);
      if (updateError) throw updateError;
    } else {
      imported += 1;
      const { error: insertError } = await supabase.from("jobs").insert(payload);
      if (insertError) throw insertError;
    }
  }

  return { imported, refreshed, expired: 0, skipped: false };
}

async function upsertLifecycleJobs(collected: Map<string, NormalizedJob>, nowIso: string): Promise<SyncCounters> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { imported: 0, refreshed: 0, expired: 0, skipped: true, reason: "Missing service role credentials." };
  }

  let imported = 0;
  let refreshed = 0;

  for (const job of collected.values()) {
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("apply_url", job.apply_url)
      .maybeSingle();

    if (existing?.id) {
      refreshed += 1;
      await supabase
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
          imported_at: job.imported_at,
          expires_at: job.expires_at,
          is_active: true,
          job_kind: job.job_kind,
        })
        .eq("id", existing.id);
    } else {
      imported += 1;
      await supabase.from("jobs").insert(job);
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

  if (deletableJobIds.length) {
    const { data: appliedRows } = await supabase
      .from("job_applications")
      .select("job_id")
      .in("job_id", deletableJobIds);

    const appliedJobIds = new Set((appliedRows || []).map((row) => row.job_id));
    const safeToDelete = deletableJobIds.filter((jobId) => !appliedJobIds.has(jobId));

    if (safeToDelete.length) {
      await supabase
        .from("jobs")
        .delete()
        .in("id", safeToDelete);
    }
  }

  return { imported, refreshed, expired, skipped: false };
}
