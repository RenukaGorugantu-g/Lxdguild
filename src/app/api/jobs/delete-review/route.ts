import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { notifyAdmins, notifyUser } from "@/lib/notifications";

type ReviewAction = "approved" | "rejected";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobId = typeof body.jobId === "string" ? body.jobId : "";
    const action = body.action as ReviewAction;

    if (!jobId || !["approved", "rejected"].includes(action)) {
      return NextResponse.json({ error: "jobId and a valid action are required." }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient() ?? supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: job } = await adminSupabase
      .from("jobs")
      .select("id, title, company, user_id, is_active, deletion_request_status, deleted_at")
      .eq("id", jobId)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const { data: deletedJob } = await adminSupabase
      .from("deleted_jobs")
      .select("id, request_status, requested_at, requested_by_user_id")
      .eq("original_job_id", jobId)
      .single();

    if (!deletedJob) {
      return NextResponse.json({ error: "No deletion request found for this job." }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    if (action === "approved") {
      await adminSupabase
        .from("jobs")
        .update({
          is_active: false,
          deletion_request_status: "approved",
          deletion_reviewed_at: nowIso,
          deletion_reviewed_by: user.id,
          deleted_at: nowIso,
        })
        .eq("id", jobId);

      await adminSupabase
        .from("deleted_jobs")
        .update({
          request_status: "approved",
          reviewed_at: nowIso,
          reviewed_by_user_id: user.id,
          deleted_at: nowIso,
          updated_at: nowIso,
        })
        .eq("original_job_id", jobId);

      if (job.user_id) {
        await notifyUser(
          job.user_id,
          "job_delete_approved",
          "Job deletion approved",
          `Your job ${job.title} at ${job.company || "your company"} has been removed from the live board after admin approval.`,
          { job_id: job.id, title: job.title, company: job.company, request_status: "approved" }
        );
      }

      return NextResponse.json({ success: true, message: "Job deletion approved." });
    }

    await adminSupabase
      .from("jobs")
      .update({
        is_active: true,
        deletion_request_status: "rejected",
        deletion_reviewed_at: nowIso,
        deletion_reviewed_by: user.id,
        deleted_at: null,
      })
      .eq("id", jobId);

    await adminSupabase
      .from("deleted_jobs")
      .update({
        request_status: "rejected",
        reviewed_at: nowIso,
        reviewed_by_user_id: user.id,
        deleted_at: null,
        updated_at: nowIso,
      })
      .eq("original_job_id", jobId);

    if (job.user_id) {
      await notifyUser(
        job.user_id,
        "job_delete_rejected",
        "Job deletion not approved",
        `Your delete request for ${job.title} at ${job.company || "your company"} was reviewed and kept live.`,
        { job_id: job.id, title: job.title, company: job.company, request_status: "rejected" }
      );
    }

    await notifyAdmins(
      "job_delete_reviewed_admin",
      "Job deletion request reviewed",
      `The delete request for ${job.title} at ${job.company || "Unknown company"} was ${action}.`,
      { job_id: job.id, title: job.title, company: job.company, action }
    );

    return NextResponse.json({ success: true, message: "Job deletion rejected and listing kept live." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
