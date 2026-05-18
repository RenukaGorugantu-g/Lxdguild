import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { buildInternalApplyValue } from "@/lib/job-apply";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { isAdminRole, isEmployerRole } from "@/lib/profile-role";
import { getSiteUrl } from "@/lib/site-url";

function hasMissingColumn(message: string, column: string) {
  return (
    message.includes(column) &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

async function getNextFeaturedRank(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase
    .from("jobs")
    .select("featured_rank")
    .not("featured_rank", "is", null)
    .order("featured_rank", { ascending: false })
    .limit(1);

  if (error) {
    if (error.code === "42703" || hasMissingColumn(error.message || "", "featured_rank")) {
      return null;
    }

    throw error;
  }

  const highestRank = Array.isArray(data) ? data[0]?.featured_rank : null;
  return typeof highestRank === "number" ? highestRank + 1 : 1;
}

function normalizeJobKind(value: unknown) {
  return value === "freelance" ? "freelance" : "standard";
}

function normalizeEmploymentType(value: unknown) {
  if (value === "part_time") return "part_time";
  if (value === "contract") return "contract";
  return "full_time";
}

function notifyJobPosted(userId: string, title: string, company?: string | null, jobId?: string | null) {
  const companyLabel = company?.trim() || "Confidential employer";
  const jobUrl = jobId ? `${getSiteUrl()}/dashboard/jobs/${jobId}` : `${getSiteUrl()}/dashboard/employer`;
  queueMicrotask(() => {
    void import("@/lib/notifications")
      .then(({ notifyUser, notifyAdmins }) =>
        Promise.allSettled([
          notifyUser(
            userId,
            "job_posted",
            "Job posted successfully",
            `Your job posting for ${title} at ${companyLabel} is live. Candidates will be notified when they apply.`,
            { job_id: jobId, title, company: companyLabel, job_url: jobUrl, employer_job_url: jobUrl }
          ),
          notifyAdmins(
            "job_posted_admin",
            "Employer posted a new job",
            `An employer posted a new job: ${title} at ${companyLabel}.`,
            { job_id: jobId, title, company: companyLabel, job_url: jobUrl, employer_job_url: jobUrl }
          ),
        ])
      )
      .catch((error) => {
        console.error("Deferred job post notification failed:", error);
      });
  });
}

function notifyLegacyJobPosted(userId: string, title: string, company?: string | null, jobId?: string | null) {
  const companyLabel = company?.trim() || "Confidential employer";
  const jobUrl = jobId ? `${getSiteUrl()}/dashboard/jobs/${jobId}` : `${getSiteUrl()}/dashboard/employer`;
  queueMicrotask(() => {
    void import("@/lib/notifications")
      .then(({ notifyUser, notifyAdmins }) =>
        Promise.allSettled([
          notifyUser(
            userId,
            "job_posted",
            "Job posted successfully",
            `Your job posting for ${title} at ${companyLabel} is live. Apply the latest jobs migrations to enable expiry and freshness tracking.`,
            { job_id: jobId, title, company: companyLabel, job_url: jobUrl, employer_job_url: jobUrl }
          ),
          notifyAdmins(
            "job_posted_admin",
            "Employer posted a new job",
            `An employer posted a new job: ${title} at ${companyLabel}. The database is missing job lifecycle columns, so the job was saved in compatibility mode.`,
            { job_id: jobId, title, company: companyLabel, job_url: jobUrl, employer_job_url: jobUrl }
          ),
        ])
      )
      .catch((error) => {
        console.error("Deferred compatibility job post notification failed:", error);
      });
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, company, location, apply_url, description, job_kind, employment_type, featured } = body;
    const normalizedCompany = typeof company === "string" ? company.trim() : "";
    const normalizedApplyUrl = typeof apply_url === "string" ? apply_url.trim() : "";
    const resolvedApplyUrl = normalizedApplyUrl || buildInternalApplyValue(crypto.randomUUID());
    const normalizedJobKind = normalizeJobKind(job_kind);
    const normalizedEmploymentType =
      normalizedJobKind === "freelance" ? "contract" : normalizeEmploymentType(employment_type);
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (!title || !location || !description) {
      return NextResponse.json({ error: "Title, location, and description are required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      const ensuredProfile = await ensureUserProfile(user);
      if (ensuredProfile) {
        profile = ensuredProfile;
        profileError = null;
      }
    }

    if (profileError || !profile) {
      return NextResponse.json({ error: "Unable to verify user." }, { status: 500 });
    }

    if (!isEmployerRole(profile.role) && !isAdminRole(profile.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (resolvedApplyUrl) {
      const { data: existing } = await supabase
        .from("jobs")
        .select("id")
        .eq("apply_url", resolvedApplyUrl)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ error: "This job has already been posted." }, { status: 409 });
      }
    }

    const featuredRank =
      isAdminRole(profile.role) && featured === true ? await getNextFeaturedRank(supabase) : null;

    const fullPayload = {
      title,
      company: normalizedCompany || null,
      location,
      description,
      job_kind: normalizedJobKind,
      employment_type: normalizedEmploymentType,
      source: "employer",
      apply_url: resolvedApplyUrl,
      user_id: user.id,
      is_active: true,
      imported_at: nowIso,
      last_seen_at: nowIso,
      external_posted_at: nowIso,
      expires_at: expiresAt,
      ...(featuredRank !== null ? { featured_rank: featuredRank } : {}),
    };

    const { data: insertedJob, error: insertError } = await supabase
      .from("jobs")
      .insert(fullPayload)
      .select("id, title, company");

    if (insertError) {
      const message = insertError.message || "Unable to post job.";
      if (
        hasMissingColumn(message, "expires_at") ||
        hasMissingColumn(message, "last_seen_at") ||
        hasMissingColumn(message, "imported_at") ||
        hasMissingColumn(message, "external_posted_at") ||
        hasMissingColumn(message, "is_active")
      ) {
        const { data: legacyJob, error: legacyError } = await supabase
          .from("jobs")
          .insert({
            title,
            company: normalizedCompany || null,
            location,
            description,
            job_kind: normalizedJobKind,
            employment_type: normalizedEmploymentType,
            source: "employer",
            apply_url: resolvedApplyUrl,
            user_id: user.id,
            ...(featuredRank !== null ? { featured_rank: featuredRank } : {}),
          })
          .select("id, title, company");

        if (legacyError) {
          return NextResponse.json({ error: legacyError.message || "Unable to post job." }, { status: 500 });
        }

        const legacyPostedJob = Array.isArray(legacyJob) ? legacyJob[0] : legacyJob;

        notifyLegacyJobPosted(user.id, title, company, legacyPostedJob?.id);

        return NextResponse.json({
          success: true,
          job: legacyPostedJob ? { id: legacyPostedJob.id } : undefined,
          warning:
            "Job posted in compatibility mode. Run migration 20260416090000_job_feed_lifecycle_and_engagement.sql to add expires_at and related lifecycle columns.",
        });
      }

      if (message.includes("user_id") && message.includes("does not exist")) {
        const { data: fallbackJob, error: fallbackError } = await supabase.from("jobs").insert({
          title,
          company: normalizedCompany || null,
          location,
          description,
          job_kind: normalizedJobKind,
          employment_type: normalizedEmploymentType,
          source: "employer",
          apply_url: resolvedApplyUrl,
          is_active: true,
          imported_at: nowIso,
          last_seen_at: nowIso,
          external_posted_at: nowIso,
          expires_at: expiresAt,
          ...(featuredRank !== null ? { featured_rank: featuredRank } : {}),
        }).select('id, title, company');

        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message || "Unable to post job." }, { status: 500 });
        }

        notifyJobPosted(user.id, title, company, fallbackJob?.[0]?.id);

        return NextResponse.json({
          success: true,
          job: fallbackJob?.[0] ? { id: fallbackJob[0].id } : undefined,
          warning:
            "Job posted, but jobs.user_id is missing from the database schema. Apply pending migrations to restore employer ownership.",
        });
      }

      return NextResponse.json({ error: message }, { status: 500 });
    }

    const job = Array.isArray(insertedJob) ? insertedJob[0] : insertedJob;

    notifyJobPosted(user.id, title, company, job?.id);

    return NextResponse.json({ success: true, job: job ? { id: job.id } : undefined });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
