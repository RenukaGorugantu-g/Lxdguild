import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { buildInternalApplyValue, isInternalApplyValue } from "@/lib/job-apply";
import { notifyAdmins, notifyUser } from "@/lib/notifications";

type JobRow = {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  location: string | null;
  source: string | null;
  apply_url: string | null;
  user_id: string | null;
  is_active?: boolean | null;
  deletion_request_status?: string | null;
  deletion_requested_at?: string | null;
  deleted_at?: string | null;
};

function hasMissingColumn(message: string, column: string) {
  return (
    message.includes(column) &&
    (message.includes("does not exist") || message.includes("Could not find"))
  );
}

function createDeletedJobPayload(job: JobRow, actorUserId: string, requestedAt: string) {
  return {
    original_job_id: job.id,
    user_id: job.user_id,
    title: job.title,
    description: job.description,
    company: job.company,
    location: job.location,
    source: job.source,
    apply_url: job.apply_url,
    request_status: "pending",
    requested_at: requestedAt,
    requested_by_user_id: actorUserId,
    reviewed_at: null,
    reviewed_by_user_id: null,
    deleted_at: null,
    updated_at: requestedAt,
    job_snapshot: job,
  };
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient() ?? supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (!profile.role?.startsWith("employer") && profile.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, description, company, location, source, apply_url, user_id, is_active, deletion_request_status, deletion_requested_at, deleted_at")
      .eq("id", id)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const resolvedJob = job as JobRow;

    if (profile.role !== "admin" && resolvedJob.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (resolvedJob.deleted_at) {
      return NextResponse.json({
        success: true,
        message: "This job has already been deleted.",
      });
    }

    if (resolvedJob.deletion_request_status === "pending") {
      return NextResponse.json({
        success: true,
        message: "Deletion request already sent. The job stays live until admin review is completed.",
      });
    }

    const nowIso = new Date().toISOString();
    const deletedJobPayload = createDeletedJobPayload(resolvedJob, user.id, nowIso);

    const { error: archiveError } = await adminSupabase
      .from("deleted_jobs")
      .upsert(deletedJobPayload, { onConflict: "original_job_id" });

    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 500 });
    }

    const { error: updateError } = await adminSupabase
      .from("jobs")
      .update({
        deletion_request_status: "pending",
        deletion_requested_at: nowIso,
        deletion_requested_by: user.id,
        deletion_reviewed_at: null,
        deletion_reviewed_by: null,
        deleted_at: null,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (resolvedJob.user_id) {
      await notifyUser(
        resolvedJob.user_id,
        "job_delete_requested",
        "Job deletion request received",
        `Your deletion request for ${resolvedJob.title} at ${resolvedJob.company || "your company"} has been sent to the admin team for approval. The job will stay visible until it is reviewed.`,
        { job_id: resolvedJob.id, title: resolvedJob.title, company: resolvedJob.company, request_status: "pending" }
      );
    }

    await notifyAdmins(
      "job_delete_requested_admin",
      "Employer requested job deletion",
      `Deletion approval is needed for ${resolvedJob.title} at ${resolvedJob.company || "Unknown company"}. Review it from the admin dashboard before it is removed from the live job board.`,
      { job_id: resolvedJob.id, title: resolvedJob.title, company: resolvedJob.company, requested_by: user.id, request_status: "pending" }
    );

    return NextResponse.json({
      success: true,
      message: "Delete request sent to admin. The job remains visible until approval.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { title, company, location, apply_url, description } = body;
    const normalizedApplyUrl = typeof apply_url === "string" ? apply_url.trim() : "";
    const resolvedApplyUrl = normalizedApplyUrl || buildInternalApplyValue(id);
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (!profile.role?.startsWith("employer") && profile.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("user_id, apply_url")
      .eq("id", id)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    if (profile.role !== "admin" && job.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const fullPayload = {
      title,
      company,
      location,
      apply_url: resolvedApplyUrl,
      description,
      is_active: true,
      imported_at: nowIso,
      last_seen_at: nowIso,
      external_posted_at: nowIso,
      expires_at: expiresAt,
    };

    const { error } = await supabase
      .from("jobs")
      .update(fullPayload)
      .eq("id", id);

    if (error) {
      const message = error.message || "Unable to update job.";
      if (
        hasMissingColumn(message, "expires_at") ||
        hasMissingColumn(message, "last_seen_at") ||
        hasMissingColumn(message, "imported_at") ||
        hasMissingColumn(message, "external_posted_at") ||
        hasMissingColumn(message, "is_active")
      ) {
        const { error: legacyError } = await supabase
          .from("jobs")
          .update({
            title,
            company,
            location,
            apply_url: resolvedApplyUrl,
            description,
          })
          .eq("id", id);

        if (legacyError) {
          return NextResponse.json({ error: legacyError.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          warning:
            "Job updated in compatibility mode. Run migration 20260416090000_job_feed_lifecycle_and_engagement.sql to add expires_at and related lifecycle columns.",
        });
      }

      if (hasMissingColumn(message, "apply_url")) {
        const legacyApplyUrl = normalizedApplyUrl || (isInternalApplyValue(job.apply_url) ? job.apply_url : buildInternalApplyValue(id));
        const { error: legacyError } = await supabase
          .from("jobs")
          .update({
            title,
            company,
            location,
            apply_url: legacyApplyUrl,
            description,
          })
          .eq("id", id);

        if (legacyError) {
          return NextResponse.json({ error: legacyError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
