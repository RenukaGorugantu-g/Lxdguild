import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { notifyUser, notifyAdmins } from "@/lib/notifications";
import { buildInternalApplyValue } from "@/lib/job-apply";

function hasMissingColumn(message: string, column: string) {
  return (
    message.includes(column) &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, company, location, apply_url, description } = body;
    const normalizedApplyUrl = typeof apply_url === "string" ? apply_url.trim() : "";
    const resolvedApplyUrl = normalizedApplyUrl || buildInternalApplyValue(crypto.randomUUID());
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (!title || !company || !location || !description) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Unable to verify user." }, { status: 500 });
    }

    if (!profile.role?.startsWith("employer") && profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (resolvedApplyUrl) {
      const { data: existing } = await supabase.from("jobs").select("id").eq("apply_url", resolvedApplyUrl).single();
      if (existing) {
        return NextResponse.json({ error: "This job has already been posted." }, { status: 409 });
      }
    }

    const fullPayload = {
      title,
      company,
      location,
      description,
      source: "employer",
      apply_url: resolvedApplyUrl,
      user_id: user.id,
      is_active: true,
      imported_at: nowIso,
      last_seen_at: nowIso,
      external_posted_at: nowIso,
      expires_at: expiresAt,
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
            company,
            location,
            description,
            source: "employer",
            apply_url: resolvedApplyUrl,
            user_id: user.id,
          })
          .select("id, title, company");

        if (legacyError) {
          return NextResponse.json({ error: legacyError.message || "Unable to post job." }, { status: 500 });
        }

        const legacyPostedJob = Array.isArray(legacyJob) ? legacyJob[0] : legacyJob;

        await notifyUser(
          user.id,
          "job_posted",
          "Job posted successfully",
          `Your job posting for ${title} at ${company} is live. Apply the latest jobs migrations to enable expiry and freshness tracking.`,
          { job_id: legacyPostedJob?.id, title, company }
        );

        await notifyAdmins(
          "job_posted_admin",
          "Employer posted a new job",
          `An employer posted a new job: ${title} at ${company}. The database is missing job lifecycle columns, so the job was saved in compatibility mode.`,
          { job_id: legacyPostedJob?.id, title, company }
        );

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
          company,
          location,
          description,
          source: "employer",
          apply_url: resolvedApplyUrl,
          is_active: true,
          imported_at: nowIso,
          last_seen_at: nowIso,
          external_posted_at: nowIso,
          expires_at: expiresAt,
        }).select('id, title, company');

        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message || "Unable to post job." }, { status: 500 });
        }

        await notifyAdmins(
          'job_posted_admin',
          'Employer posted a new job',
          `A new employer job was posted: ${title} at ${company}.`,
          { job_id: fallbackJob?.[0]?.id, title, company }
        );

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

    await notifyUser(
      user.id,
      'job_posted',
      'Job posted successfully',
      `Your job posting for ${title} at ${company} is live. Candidates will be notified when they apply.`,
      { job_id: job?.id, title, company }
    );

    await notifyAdmins(
      'job_posted_admin',
      'Employer posted a new job',
      `An employer posted a new job: ${title} at ${company}.`,
      { job_id: job?.id, title, company }
    );

    return NextResponse.json({ success: true, job: job ? { id: job.id } : undefined });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
