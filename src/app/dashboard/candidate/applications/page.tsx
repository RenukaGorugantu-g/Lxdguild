import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Briefcase, ExternalLink } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { normalizeExternalApplyUrl } from "@/lib/job-apply";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata(
  "My Applications",
  "Private view of your submitted LXD Guild job applications and interview progress."
);

type ApplicationJob = {
  id?: string;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  apply_url?: string | null;
  is_active?: boolean | null;
  expires_at?: string | null;
};

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  ats_score?: number | string | null;
  ats_summary?: string | null;
  ats_auto_decision?: string | null;
  jobs: ApplicationJob | ApplicationJob[] | null;
};

type InterviewScheduleSummary = {
  roundLabel?: string | null;
  startAt?: string | null;
  durationMinutes?: number | null;
  meetingProvider?: string | null;
  schedulingUrl?: string | null;
  notes?: string | null;
};

function toNumericScore(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatInterviewDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString();
}

function getDisplayApplicationStatus(status: string, isExternal: boolean) {
  return isExternal ? "applied" : status;
}

export default async function CandidateApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { status } = await searchParams;
  const validStatuses = ["applied", "screening", "on_hold", "shortlisted", "interview_scheduled", "rejected"];
  const statusFilter = validStatuses.includes(status || "") ? status : "all";

  let query = supabase
    .from("job_applications")
    .select("id, status, created_at, ats_score, ats_summary, ats_auto_decision, jobs(id, title, company, location, apply_url, is_active, expires_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const applicationsQuery = await query;
  let applications: ApplicationRow[] | null = (applicationsQuery.data as ApplicationRow[] | null) ?? null;
  const interviewSchedulesByApplicationId = new Map<string, InterviewScheduleSummary>();

  if (applicationsQuery.error?.code === "42703") {
    let fallbackQuery = supabase
      .from("job_applications")
      .select("id, status, created_at, resume_url, jobs(id, title, company, location, apply_url, is_active)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const fallbackApplications = await fallbackQuery;
    applications = (fallbackApplications.data || []) as ApplicationRow[];
  }

  const visibleApplications = (applications || []).filter((application) => {
    const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
    const isExternal = Boolean(normalizeExternalApplyUrl(job?.apply_url));
    const displayStatus = getDisplayApplicationStatus(application.status, isExternal);
    return statusFilter === "all" ? true : displayStatus === statusFilter;
  });

  const applicationIds = (applications || []).map((application) => application.id);
  if (applicationIds.length > 0) {
    const notificationsQuery = await supabase
      .from("notifications")
      .select("id, data, type, created_at")
      .eq("user_id", user.id)
      .eq("type", "job_interview_scheduled")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!notificationsQuery.error) {
      for (const notification of notificationsQuery.data || []) {
        const data = notification.data as Record<string, unknown> | null;
        const applicationId = typeof data?.application_id === "string" ? data.application_id : null;

        if (!applicationId || !applicationIds.includes(applicationId) || interviewSchedulesByApplicationId.has(applicationId)) {
          continue;
        }

        interviewSchedulesByApplicationId.set(applicationId, {
          roundLabel: typeof data?.round_label === "string" ? data.round_label : null,
          startAt: typeof data?.start_at === "string" ? data.start_at : null,
          durationMinutes:
            typeof data?.duration_minutes === "number"
              ? data.duration_minutes
              : typeof data?.duration_minutes === "string"
                ? Number(data.duration_minutes)
                : null,
          meetingProvider: typeof data?.meeting_provider === "string" ? data.meeting_provider : null,
          schedulingUrl: typeof data?.scheduling_url === "string" ? data.scheduling_url : null,
          notes: typeof data?.notes === "string" ? data.notes : null,
        });
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 pt-28 pb-16 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link href="/dashboard/candidate" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700">
            <ArrowLeft className="w-4 h-4" /> Back to Candidate Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-[#111827]">My Applied Jobs</h1>
          <p className="mt-1 text-zinc-500">Track application outcomes from employers in one place.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {["all", ...validStatuses].map((item) => (
            <Link
              key={item}
              href={item === "all" ? "/dashboard/candidate/applications" : `/dashboard/candidate/applications?status=${item}`}
              className={`px-3 py-1.5 rounded-full border transition-colors ${
                statusFilter === item
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {formatStatusLabel(item)}
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          {visibleApplications.length > 0 ? (
            <ul className="space-y-4">
              {visibleApplications.map((application: ApplicationRow) => {
                const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
                const externalApplyUrl = normalizeExternalApplyUrl(job?.apply_url);
                const isExternal = Boolean(externalApplyUrl);
                const displayStatus = getDisplayApplicationStatus(application.status, isExternal);
                const isJobDeactivated = job?.is_active === false;
                const atsScore = toNumericScore(application.ats_score);
                const interviewSchedule = interviewSchedulesByApplicationId.get(application.id) || null;
                const formattedInterviewDate = formatInterviewDate(interviewSchedule?.startAt);
                return (
                  <li key={application.id} className="rounded-2xl border border-zinc-200 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-brand-600" />
                          <p className="font-semibold text-[#111827]">{job?.title || "Job listing"}</p>
                        </div>
                        <p className="text-sm text-zinc-500">
                          {[job?.company, job?.location].filter(Boolean).join(" | ") || "Company details unavailable"}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Applied on {new Date(application.created_at).toLocaleDateString()}
                        </p>
                        {isJobDeactivated && (
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                            This job is now deactivated
                          </p>
                        )}
                      </div>
                      <span className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusPillClasses(displayStatus)}`}>
                        {formatStatusLabel(displayStatus)}
                      </span>
                    </div>
                    {(atsScore !== null || application.ats_summary || (!isExternal && application.ats_auto_decision)) && (
                      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">ATS review</p>
                            <p className="mt-1 text-sm font-semibold text-zinc-900">
                              {atsScore !== null ? `Resume match score: ${Math.round(atsScore)}%` : "ATS analysis available"}
                            </p>
                            {application.ats_summary && <p className="mt-1 text-sm text-zinc-600">{application.ats_summary}</p>}
                          </div>
                          {!isExternal && application.ats_auto_decision && (
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-blue-800">
                              {application.ats_auto_decision.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {interviewSchedule && (
                      <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">Interview schedule</p>
                            {interviewSchedule.roundLabel && <p className="mt-1 text-sm font-semibold text-zinc-900">{interviewSchedule.roundLabel}</p>}
                            {formattedInterviewDate && <p className="mt-1 text-sm text-zinc-700">Scheduled for {formattedInterviewDate}</p>}
                            {typeof interviewSchedule.durationMinutes === "number" && (
                              <p className="mt-1 text-sm text-zinc-700">Duration: {interviewSchedule.durationMinutes} minutes</p>
                            )}
                            {interviewSchedule.notes && <p className="mt-2 text-sm text-zinc-600">{interviewSchedule.notes}</p>}
                          </div>
                          {interviewSchedule.meetingProvider && (
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                              {interviewSchedule.meetingProvider.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                        {interviewSchedule.schedulingUrl && (
                          <a
                            href={interviewSchedule.schedulingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100"
                          >
                            Open interview link
                          </a>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-3">
                      {job?.id && (
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          View Job
                        </Link>
                      )}
                      {externalApplyUrl && (
                        <a
                          href={externalApplyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
                        >
                          Continue Official Apply <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {!externalApplyUrl && (
                        <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                          Applied Inside LXD Guild
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-zinc-500">
              No applications found for this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusPillClasses(status: string) {
  if (status === "shortlisted") return "bg-green-50 text-green-700 border-green-200";
  if (status === "interview_scheduled") return "bg-sky-50 text-sky-700 border-sky-200";
  if (status === "on_hold") return "bg-amber-50 text-amber-800 border-amber-200";
  if (status === "screening") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}
