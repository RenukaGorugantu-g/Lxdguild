import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getSiteUrl } from "@/lib/site-url";
import { shouldSurfaceMarketplaceJob } from "@/lib/marketplace-job-filter";

export type PublicJobRecord = {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  location: string | null;
  work_mode?: string | null;
  employment_type?: string | null;
  external_posted_at?: string | null;
  imported_at?: string | null;
  created_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean | null;
  deleted_at?: string | null;
  featured_rank?: number | null;
  source?: string | null;
  user_id?: string | null;
};

const PRIMARY_SELECT =
  "id, title, description, company, location, work_mode, employment_type, external_posted_at, imported_at, created_at, expires_at, is_active, deleted_at, featured_rank, source, user_id";

const FALLBACK_SELECT =
  "id, title, description, company, location, work_mode, employment_type, external_posted_at, imported_at, created_at, expires_at, is_active, source, user_id";

async function getJobsReader() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

const getAdminUserIds = cache(async () => {
  const jobsReader = await getJobsReader();
  const { data, error } = await jobsReader.from("profiles").select("id").eq("role", "admin");
  if (error) return new Set<string>();
  return new Set<string>((data || []).map((profile: { id: string }) => profile.id));
});

function dedupePublicJobs(jobs: PublicJobRecord[]) {
  const seen = new Set<string>();

  return jobs.filter((job) => {
    const key = [
      (job.title || "").trim().toLowerCase(),
      (job.company || "").trim().toLowerCase(),
      (job.location || "").trim().toLowerCase(),
      (job.work_mode || "").trim().toLowerCase(),
      (job.employment_type || "").trim().toLowerCase(),
    ].join("::");

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function sanitizeJobRows(jobs: PublicJobRecord[] | null | undefined) {
  const adminUserIds = await getAdminUserIds();

  return dedupePublicJobs(
    (jobs || [])
    .filter((job) => job.is_active !== false)
    .filter((job) => !job.deleted_at)
    .filter((job) => shouldSurfaceMarketplaceJob(job, { adminUserIds }))
  );
}

export function stripJobHtml(value: string | null | undefined) {
  return (value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function slugifyJobSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildPublicJobSlug(job: Pick<PublicJobRecord, "id" | "title">) {
  return `${slugifyJobSegment(job.title)}-${job.id}`;
}

export function buildPublicJobHref(job: Pick<PublicJobRecord, "id" | "title">) {
  return `/jobs/${buildPublicJobSlug(job)}`;
}

export function buildPublicJobUrl(job: Pick<PublicJobRecord, "id" | "title">) {
  return `${getSiteUrl()}${buildPublicJobHref(job)}`;
}

export function parseJobIdFromSlug(slug: string) {
  const match = slug.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  return match?.[0] || null;
}

export function getJobPostedDate(job: Pick<PublicJobRecord, "external_posted_at" | "imported_at" | "created_at">) {
  return job.external_posted_at || job.imported_at || job.created_at || new Date().toISOString();
}

export function getEmploymentTypeLabel(value?: string | null) {
  if (value === "part_time") return "Part-time";
  if (value === "contract") return "Contract";
  return "Full-time";
}

export function getWorkModeLabel(value?: string | null, location?: string | null) {
  if (value === "remote") return "Remote";
  if (value === "hybrid") return "Hybrid";
  if (value === "onsite") return "On-site";
  return location || "India";
}

export const getPublicJobs = cache(async () => {
  const jobsReader = await getJobsReader();
  const primaryResult = await jobsReader
    .from("jobs")
    .select(PRIMARY_SELECT)
    .eq("is_active", true)
    .order("featured_rank", { ascending: true, nullsFirst: false })
    .order("external_posted_at", { ascending: false, nullsFirst: false })
    .order("imported_at", { ascending: false });

  if (!primaryResult.error) {
    return sanitizeJobRows(primaryResult.data as PublicJobRecord[]);
  }

  if (primaryResult.error.code === "42703") {
    const fallbackResult = await jobsReader
      .from("jobs")
      .select(FALLBACK_SELECT)
      .eq("is_active", true)
      .order("external_posted_at", { ascending: false, nullsFirst: false })
      .order("imported_at", { ascending: false });

    return sanitizeJobRows((fallbackResult.data || []) as PublicJobRecord[]);
  }

  return [] as PublicJobRecord[];
});

export const getPublicFeaturedJobs = cache(async (limit = 6) => {
  const jobs = await getPublicJobs();
  return jobs.filter((job) => job.featured_rank != null).slice(0, limit);
});

export const getPublicNonFeaturedJobs = cache(async (limit = 24) => {
  const jobs = await getPublicJobs();
  return jobs.filter((job) => job.featured_rank == null).slice(0, limit);
});

export const getPublicJobById = cache(async (id: string) => {
  const jobsReader = await getJobsReader();
  const adminUserIds = await getAdminUserIds();
  const primaryResult = await jobsReader
    .from("jobs")
    .select(PRIMARY_SELECT)
    .eq("id", id)
    .single();

  if (!primaryResult.error) {
    const job = primaryResult.data as PublicJobRecord;
    if (job.is_active === false || job.deleted_at || !shouldSurfaceMarketplaceJob(job, { adminUserIds })) return null;
    return job;
  }

  if (primaryResult.error.code === "42703") {
    const fallbackResult = await jobsReader
      .from("jobs")
      .select(FALLBACK_SELECT)
      .eq("id", id)
      .single();

    if (!fallbackResult.error && fallbackResult.data) {
      const fallbackJob = fallbackResult.data as PublicJobRecord;
      if (fallbackJob.is_active === false || !shouldSurfaceMarketplaceJob(fallbackJob, { adminUserIds })) return null;
      return {
        ...fallbackJob,
        deleted_at: null,
        featured_rank: null,
      };
    }
  }

  return null;
});
