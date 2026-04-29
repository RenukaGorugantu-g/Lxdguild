import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Briefcase, ExternalLink } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { normalizeExternalApplyUrl } from "@/lib/job-apply";

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
  ats_score?: number | null;
  ats_summary?: string | null;
  ats_auto_decision?: string | null;
  jobs: ApplicationJob | ApplicationJob[] | null;
};

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
  const validStatuses = ["applied", "screening", "shortlisted", "interview_scheduled", "rejected"];
  const statusFilter = validStatuses.includes(status || "") ? status : "all";

  let query = supabase
    .from("job_applications")
    .select("id, status, created_at, ats_score, ats_summary, ats_auto_decision, jobs(id, title, company, location, apply_url, is_active, expires_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const applicationsQuery = await query;
  let applications: ApplicationRow[] | null = (applicationsQuery.data as ApplicationRow[] | null) ?? null;

  if (applicationsQuery.error?.code === "42703") {
    let fallbackQuery = supabase
      .from("job_applications")
      .select("id, status, created_at, resume_url, jobs(id, title, company, location, apply_url, is_active)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      fallbackQuery = fallbackQuery.eq("status", statusFilter);
    }

    const fallbackApplications = await fallbackQuery;
    applications = (fallbackApplications.data || []).map((application) => ({
      ...application,
      ats_score: null,
      ats_summary: null,
      ats_auto_decision: null,
    })) as ApplicationRow[];
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Link href="/dashboard/candidate" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700">
            <ArrowLeft className="w-4 h-4" /> Back to Candidate Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-4">My Applied Jobs</h1>
          <p className="text-zinc-500 mt-1">Track application outcomes from employers in one place.</p>
        </div>

        <div className="flex items-center gap-2 text-sm">
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

        <div className="bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-2xl p-6">
          {applications && applications.length > 0 ? (
            <ul className="space-y-4">
              {applications.map((application: ApplicationRow) => {
                const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
                const externalApplyUrl = normalizeExternalApplyUrl(job?.apply_url);
                const isJobDeactivated = job?.is_active === false;
                return (
                  <li key={application.id} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-brand-600" />
                          <p className="font-semibold">{job?.title || "Job listing"}</p>
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
                      <span className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusPillClasses(application.status)}`}>
                        {formatStatusLabel(application.status)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {typeof application.ats_score === "number" && (
                        <span className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
                          ATS Match {Math.round(application.ats_score)}%
                        </span>
                      )}
                      {application.ats_auto_decision === "manual_review" && application.ats_summary && (
                        <span className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700">
                          Manual review: {application.ats_summary}
                        </span>
                      )}
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
            <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-500">
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
  if (status === "screening") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}
