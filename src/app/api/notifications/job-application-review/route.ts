import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { notifyAdmins, notifyUser } from "@/lib/notifications";
import { getSiteUrl } from "@/lib/site-url";
import { selectMatchedJobs, type CandidateMatchJob } from "@/lib/candidate-job-matches";

type ReviewAction = "shortlisted" | "rejected" | "on_hold";

function isMissingColumnError(message?: string | null) {
  const normalized = message || "";
  return (
    normalized.includes("Could not find") ||
    normalized.includes("does not exist") ||
    normalized.includes("schema cache")
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : null;
  }

  return null;
}

async function updateApplicationReviewStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  applicationId: string,
  action: ReviewAction
) {
  const timestamp = new Date().toISOString();
  const updatePayload: Record<string, string> = {
    status: action,
    reviewed_at: timestamp,
  };

  if (action === "shortlisted") {
    updatePayload.shortlisted_at = timestamp;
  }

  if (action === "rejected") {
    updatePayload.rejected_at = timestamp;
  }

  const fullUpdate = await supabase
    .from("job_applications")
    .update(updatePayload)
    .eq("id", applicationId)
    .select("id");

  if (!fullUpdate.error) {
    return fullUpdate;
  }

  if (fullUpdate.error.code !== "42703" && !isMissingColumnError(fullUpdate.error.message)) {
    return fullUpdate;
  }

  return supabase
    .from("job_applications")
    .update({
      status: action,
    })
    .eq("id", applicationId)
    .select("id");
}

async function updateApplicationReviewStatusWithAdmin(applicationId: string, action: ReviewAction) {
  const admin = createAdminClient();

  if (!admin) {
    return {
      data: null,
      error: new Error("Admin Supabase client is not configured."),
    };
  }

  const timestamp = new Date().toISOString();
  const updatePayload: Record<string, string> = {
    status: action,
    reviewed_at: timestamp,
  };

  if (action === "shortlisted") {
    updatePayload.shortlisted_at = timestamp;
  }

  if (action === "rejected") {
    updatePayload.rejected_at = timestamp;
  }

  const fullUpdate = await admin
    .from("job_applications")
    .update(updatePayload)
    .eq("id", applicationId)
    .select("id");

  if (!fullUpdate.error) {
    return fullUpdate;
  }

  if (fullUpdate.error.code !== "42703" && !isMissingColumnError(fullUpdate.error.message)) {
    return fullUpdate;
  }

  return admin
    .from("job_applications")
    .update({
      status: action,
    })
    .eq("id", applicationId)
    .select("id");
}

export async function POST(req: Request) {
  const body = await req.json();
  const { applicationId, action } = body as {
    applicationId?: string;
    action?: ReviewAction;
  };

  if (!applicationId || !action || !["shortlisted", "rejected", "on_hold"].includes(action)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient() ?? supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let application = null;
  let appError = null;

  const applicationWithResumeLink = await adminSupabase
    .from("job_applications")
    .select("id, user_id, job_id, status, resume_id, resume_url, jobs(user_id, title, company, description, location)")
    .eq("id", applicationId)
    .single();

  application = applicationWithResumeLink.data;
  appError = applicationWithResumeLink.error;

  if (appError?.code === "42703" || appError?.message?.includes("resume_id")) {
    const legacyApplicationQuery = await adminSupabase
      .from("job_applications")
      .select("id, user_id, job_id, status, resume_url, jobs(user_id, title, company, description, location)")
      .eq("id", applicationId)
      .single();

    appError = legacyApplicationQuery.error;
    application = legacyApplicationQuery.data ? { ...legacyApplicationQuery.data, resume_id: null } : null;
  }

  if (appError || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
  const isAdmin = viewerProfile?.role === "admin";
  const isJobOwner = job?.user_id === user.id;
  const siteUrl = getSiteUrl();
  const jobUrl = `${siteUrl}/dashboard/jobs/${application.job_id}`;

  if (!isAdmin && !isJobOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (application.status === "rejected") {
    return NextResponse.json({ error: "Final decision already recorded for this application." }, { status: 409 });
  }

  if (application.status === action) {
    return NextResponse.json({ error: "This application is already in that status." }, { status: 409 });
  }

  let { data: updatedRows, error: updateError } = await updateApplicationReviewStatus(
    supabase,
    applicationId,
    action
  );
  let updateErrorMessage: string | null = getErrorMessage(updateError);

  if (!updateError && (!updatedRows || updatedRows.length === 0)) {
    const adminUpdateResult = await updateApplicationReviewStatusWithAdmin(applicationId, action);
    updatedRows = adminUpdateResult.data;
    updateError = adminUpdateResult.error as typeof updateError;
    updateErrorMessage = getErrorMessage(adminUpdateResult.error);
  }

  if (updateError || updateErrorMessage) {
    return NextResponse.json({ error: updateErrorMessage || updateError?.message || "Application update failed." }, { status: 500 });
  }

  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json(
      { error: "Application status could not be updated. Check job_applications update policy." },
      { status: 403 }
    );
  }

  const { data: candidateProfile } = await adminSupabase
    .from("profiles")
    .select("candidate_target_role, candidate_designation")
    .eq("id", application.user_id)
    .maybeSingle();

  const matchedJobsUrl = `${siteUrl}/dashboard/candidate`;
  let matchedJobData: Record<string, string> = {};

  if (action === "on_hold") {
    const jobsQuery = await adminSupabase
      .from("jobs")
      .select("id, title, description, company, location, work_mode, employment_type, featured_rank, external_posted_at, imported_at, created_at, is_active, source, user_id")
      .eq("is_active", true)
      .neq("id", application.job_id)
      .limit(40);

    if (!jobsQuery.error) {
      const matchedJobs = selectMatchedJobs(
        (jobsQuery.data || []) as CandidateMatchJob[],
        candidateProfile?.candidate_target_role || null,
        candidateProfile?.candidate_designation || null,
        3
      );

      matchedJobData = matchedJobs.reduce<Record<string, string>>((acc, matchedJob, index) => {
        const position = index + 1;
        acc[`matched_job_${position}_title`] = matchedJob.title || "Matched role";
        acc[`matched_job_${position}_company`] = matchedJob.company || "LXD Guild employer";
        acc[`matched_job_${position}_location`] = matchedJob.location || "India";
        acc[`matched_job_${position}_url`] = `${siteUrl}/dashboard/jobs/${matchedJob.id}`;
        return acc;
      }, {});
    }
  }

  const candidateTitle =
    action === "shortlisted"
      ? "Application shortlisted"
      : action === "on_hold"
        ? "Application on hold"
        : "Application update";

  const candidateMessage =
    action === "shortlisted"
      ? `Your application for ${job?.title || "the role"} at ${job?.company || "the company"} was accepted for the next hiring step.`
      : action === "on_hold"
        ? `Your application for ${job?.title || "the role"} at ${job?.company || "the company"} is on hold for now while the team looks for a closer fit for this position.`
        : `Your application for ${job?.title || "the role"} at ${job?.company || "the company"} was not selected for the next stage.`;

  const adminTitle =
    action === "shortlisted"
      ? "Candidate accepted by employer"
      : action === "on_hold"
        ? "Candidate put on hold"
        : "Candidate rejected by employer";

  const adminMessage =
    action === "shortlisted"
      ? `Employer moved a candidate forward for ${job?.title || "the role"} at ${job?.company || "the company"}.`
      : action === "on_hold"
        ? `Employer placed a candidate on hold for ${job?.title || "the role"} at ${job?.company || "the company"}.`
        : `Employer rejected a candidate for ${job?.title || "the role"} at ${job?.company || "the company"}.`;

  const notificationResults = await Promise.allSettled([
    notifyUser(application.user_id, "job_application_reviewed", candidateTitle, candidateMessage, {
      application_id: applicationId,
      job_id: application.job_id,
      title: job?.title || "",
      company: job?.company || "",
      job_url: jobUrl,
      status: action,
      matched_jobs_url: matchedJobsUrl,
      target_role: candidateProfile?.candidate_target_role || "",
      designation_bucket: candidateProfile?.candidate_designation || "",
      ...matchedJobData,
    }),
    notifyAdmins("job_application_reviewed_admin", adminTitle, adminMessage, {
      application_id: applicationId,
      applicant_id: application.user_id,
      job_id: application.job_id,
      title: job?.title || "",
      company: job?.company || "",
      job_url: jobUrl,
      status: action,
      reviewer_id: user.id,
    }),
  ]);

  const rejectedNotifications = notificationResults
    .map((result, index) => ({ result, index }))
    .filter((entry): entry is { result: PromiseRejectedResult; index: number } => entry.result.status === "rejected");

  if (rejectedNotifications.length > 0) {
    console.error("[job-application-review] notification delivery failed", {
      applicationId,
      rejectedNotifications: rejectedNotifications.map(({ index, result }) => ({
        index,
        reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
      })),
    });
  }

  return NextResponse.json({ success: true, status: action });
}
