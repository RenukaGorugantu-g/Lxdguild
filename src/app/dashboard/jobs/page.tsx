import { createClient } from "@/utils/supabase/server";
import { getJobBoardAccessForUser } from "@/lib/job-board-access";
import { syncJobFeedIfStale } from "@/lib/job-feed";
import { isAdminRole } from "@/lib/profile-role";
import { redirect } from "next/navigation";
import { MapPin, Building, Lock, RefreshCw, Clock3, BriefcaseBusiness, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type JobListItem = {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  location: string | null;
  work_mode?: string | null;
  employment_type?: string | null;
  expires_at: string | null;
  external_posted_at: string | null;
  imported_at: string | null;
  created_at?: string | null;
  is_active?: boolean | null;
  source?: string | null;
  job_kind?: string | null;
};

function normalizeJobText(...values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

function matchesRemoteFilter(job: JobListItem, remote?: string) {
  if (remote !== "remote") return true;
  if (job.work_mode) return job.work_mode === "remote";
  const text = normalizeJobText(job.location, job.title, job.description);
  return text.includes("remote") || text.includes("work from home") || text.includes("wfh");
}

function matchesScheduleFilter(job: JobListItem, schedule?: string) {
  if (!schedule || schedule === "all") return true;
  if (schedule === "full-time" && job.employment_type) return job.employment_type === "full_time";
  if (schedule === "part-time" && job.employment_type) return job.employment_type === "part_time";

  const text = normalizeJobText(job.title, job.description, job.location);

  if (schedule === "full-time") {
    return (
      text.includes("full time") ||
      text.includes("full-time") ||
      text.includes("fulltime")
    );
  }

  if (schedule === "part-time") {
    return (
      text.includes("part time") ||
      text.includes("part-time") ||
      text.includes("parttime")
    );
  }

  return true;
}

export default async function JobsDashboard({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; view?: string; remote?: string; schedule?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { category, view, remote, schedule, page } = await searchParams;

  if (!user) redirect("/login");

  const { canAccessJobBoard } = await getJobBoardAccessForUser(supabase, user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const pageSize = 12;

  let query = supabase
    .from("jobs")
    .select("*")
    .order("external_posted_at", { ascending: false, nullsFirst: false })
    .order("imported_at", { ascending: false });

  if (category) {
    query = query.ilike("title", `%${category}%`);
  }

  if (view === "freelance" || view === "standard") {
    query = query.eq("job_kind", view);
  }
  if (remote === "remote") {
    query = query.eq("work_mode", "remote");
  }
  if (schedule === "full-time") {
    query = query.eq("employment_type", "full_time");
  }
  if (schedule === "part-time") {
    query = query.eq("employment_type", "part_time");
  }

  let { data: rawJobsList, error: jobsError } = await query;

  if (jobsError?.code === "42703") {
    let fallbackQuery = supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (category) {
      fallbackQuery = fallbackQuery.ilike("title", `%${category}%`);
    }
    if (view === "freelance" || view === "standard") {
      fallbackQuery = fallbackQuery.eq("job_kind", view);
    }
    if (remote === "remote") {
      fallbackQuery = fallbackQuery.eq("work_mode", "remote");
    }
    if (schedule === "full-time") {
      fallbackQuery = fallbackQuery.eq("employment_type", "full_time");
    }
    if (schedule === "part-time") {
      fallbackQuery = fallbackQuery.eq("employment_type", "part_time");
    }

    const fallback = await fallbackQuery;
    rawJobsList = fallback.data;
    jobsError = fallback.error;
  }

  let jobsList = (rawJobsList || []).filter((job) => job.is_active !== false);

  if ((!jobsList || jobsList.length === 0) && !jobsError) {
    await syncJobFeedIfStale();

    let refreshQuery = supabase
      .from("jobs")
      .select("*")
      .order("external_posted_at", { ascending: false, nullsFirst: false })
      .order("imported_at", { ascending: false });

    if (category) {
      refreshQuery = refreshQuery.ilike("title", `%${category}%`);
    }
    if (view === "freelance" || view === "standard") {
      refreshQuery = refreshQuery.eq("job_kind", view);
    }
    if (remote === "remote") {
      refreshQuery = refreshQuery.eq("work_mode", "remote");
    }
    if (schedule === "full-time") {
      refreshQuery = refreshQuery.eq("employment_type", "full_time");
    }
    if (schedule === "part-time") {
      refreshQuery = refreshQuery.eq("employment_type", "part_time");
    }

    const refreshed = await refreshQuery;

    if (refreshed.error?.code === "42703") {
      let legacyRefreshQuery = supabase.from("jobs").select("*").order("created_at", { ascending: false });
      if (category) {
        legacyRefreshQuery = legacyRefreshQuery.ilike("title", `%${category}%`);
      }
      if (view === "freelance" || view === "standard") {
        legacyRefreshQuery = legacyRefreshQuery.eq("job_kind", view);
      }
      if (remote === "remote") {
        legacyRefreshQuery = legacyRefreshQuery.eq("work_mode", "remote");
      }
      if (schedule === "full-time") {
        legacyRefreshQuery = legacyRefreshQuery.eq("employment_type", "full_time");
      }
      if (schedule === "part-time") {
        legacyRefreshQuery = legacyRefreshQuery.eq("employment_type", "part_time");
      }

      const legacyRefreshed = await legacyRefreshQuery;
      jobsList = (legacyRefreshed.data || []).filter((job) => job.is_active !== false);
    } else {
      jobsList = (refreshed.data || []).filter((job) => job.is_active !== false);
    }
  }

  jobsList = jobsList.filter((job) => matchesRemoteFilter(job, remote));
  jobsList = jobsList.filter((job) => matchesScheduleFilter(job, schedule));

  // Simple client-side categorization for filtering
  const categories = [
    "Instructional Designer",
    "eLearning Developer",
    "Learning Experience Designer",
    "L&D Manager",
    "Curriculum Developer"
  ];
  const freelanceJobs = jobsList.filter((job) => job.job_kind === "freelance").slice(0, 4);
  const featuredFreelanceIds = new Set(freelanceJobs.map((job) => job.id));
  const jobsToRender =
    view === "freelance"
      ? jobsList
      : jobsList.filter((job) => !featuredFreelanceIds.has(job.id));
  const totalJobs = jobsToRender.length;
  const totalPages = Math.max(1, Math.ceil(totalJobs / pageSize));
  const parsedPage = Number(page || "1");
  const currentPage = Number.isFinite(parsedPage)
    ? Math.min(Math.max(1, Math.trunc(parsedPage)), totalPages)
    : 1;
  const paginatedJobs = jobsToRender.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageTitle =
    view === "freelance" ? "Freelance L&D Jobs" : view === "standard" ? "Standard L&D Jobs" : "L&D Job Board";
  const pageDescription =
    view === "freelance"
      ? "Short-term, contract, and freelance-friendly L&D opportunities."
      : "Exclusive roles for verified LXD Guild professionals.";
  const activeFilterChips = [
    remote === "remote" ? "Remote" : null,
    schedule === "full-time" ? "Full-time" : null,
    schedule === "part-time" ? "Part-time" : null,
  ].filter(Boolean);

  const buildJobsHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (view && view !== "all") params.set("view", view);
    if (remote && remote !== "all") params.set("remote", remote);
    if (schedule && schedule !== "all") params.set("schedule", schedule);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/dashboard/jobs${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="premium-shell premium-page">
      <div className="premium-content max-w-7xl mx-auto space-y-8">
        <div className="premium-hero p-7 sm:p-8">
          <div className="flex items-center justify-between gap-6">
          <div>
            <div className="premium-badge">Curated opportunities</div>
            <h1 className="mt-4 text-3xl font-bold text-white">{pageTitle}</h1>
            <p className="premium-copy mt-2">{pageDescription}</p>
            {activeFilterChips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilterChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold text-white"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>
          {isAdminRole(profile?.role) && (
             <Link 
               href="/api/jobs/import" 
               className="premium-button premium-button-primary hidden sm:inline-flex"
             >
               <RefreshCw className="w-4 h-4" /> Import Latest Jobs
             </Link>
          )}
        </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
           {/* Sidebar */}
           <JobSidebar categories={categories} />

           {/* Main Content */}
           <div className="flex-1 space-y-4">
              {view !== "freelance" && freelanceJobs.length > 0 && (
                <div className="premium-card-light p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                        <BriefcaseBusiness className="w-4 h-4 text-brand-600" />
                        Freelance Jobs
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">
                        Contract and consulting work sourced separately for freelance-focused members.
                      </p>
                    </div>
                    <Link
                      href="/dashboard/jobs?view=freelance"
                      className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                    >
                      View all freelance jobs
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {freelanceJobs.map((job) => (
                      <JobCard key={job.id} job={job} canAccessJobBoard={canAccessJobBoard} compact />
                    ))}
                  </div>
                </div>
              )}

              {!canAccessJobBoard && (
                <div className="premium-card-light flex items-center justify-between gap-4 p-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span className="text-amber-900">Jobs are visible, but applying is locked. Complete the assessment to unlock applications.</span>
                  </div>
                  <Link href="/dashboard/candidate/exam" className="px-3 py-1 bg-amber-600 text-white rounded-md text-xs font-bold whitespace-nowrap">
                    Write Assessment
                  </Link>
                </div>
              )}

              {(!jobsList || jobsList.length <= 3) && isAdminRole(profile?.role) && (
                <div className="premium-card-light flex items-center justify-between gap-4 p-4 text-sm">
                   <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin-slow text-sky-700" />
                      <span className="text-sky-800">Job board looks a bit empty. Want to sync fresh roles?</span>
                   </div>
                   <Link href="/api/jobs/import" className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-bold whitespace-nowrap">Sync Now</Link>
                </div>
              )}

              <div className="grid gap-4">
                {paginatedJobs?.map((job) => (
                  <JobCard key={job.id} job={job} canAccessJobBoard={canAccessJobBoard} />
                ))}

                {(!jobsList || jobsList.length === 0) && (
                  <div className="premium-card-light py-20 text-center">
                    <RefreshCw className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                    <p className="text-zinc-500">No jobs found. Check back soon for new opportunities.</p>
                  </div>
                )}
              </div>

              {totalJobs > 0 && totalPages > 1 && (
                <div className="premium-card-light flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-zinc-500">
                    Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalJobs)} of {totalJobs} jobs
                  </p>
                  <div className="flex items-center gap-2">
                    {currentPage > 1 ? (
                      <Link
                        href={buildJobsHref(currentPage - 1)}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-400">
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </span>
                    )}

                    <span className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">
                      Page {currentPage} of {totalPages}
                    </span>

                    {currentPage < totalPages ? (
                      <Link
                        href={buildJobsHref(currentPage + 1)}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Next <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-400">
                        Next <ChevronRight className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}

function JobCard({
  job,
  canAccessJobBoard,
  compact = false,
}: {
  job: JobListItem;
  canAccessJobBoard: boolean;
  compact?: boolean;
}) {
  const expiryDate = job.expires_at ? new Date(job.expires_at).toLocaleDateString() : null;
  const freshnessDate = new Date(
    job.external_posted_at || job.imported_at || job.created_at || new Date().toISOString()
  ).toLocaleDateString();

  return (
    <div className={`bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border ${compact ? "p-4 rounded-xl" : "p-6 rounded-2xl"} hover:shadow-md transition-shadow`}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className={`${compact ? "text-base" : "text-xl"} font-bold`}>{job.title}</h2>
            {job.job_kind === "freelance" && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800">
                Freelance
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Building className="w-4 h-4" /> {job.company}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {job.location}
            </div>
            {job.work_mode === "remote" && (
              <div className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                Remote
              </div>
            )}
            {job.employment_type === "full_time" && (
              <div className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                Full-time
              </div>
            )}
            {job.employment_type === "part_time" && (
              <div className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Part-time
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock3 className="w-4 h-4" /> Posted {freshnessDate}
            </div>
            {expiryDate && (
              <div className="flex items-center gap-1.5 text-amber-700">
                <Clock3 className="w-4 h-4" /> Expires {expiryDate}
              </div>
            )}
          </div>
          {!compact && (
            <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-2 mt-2 leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: job.description || "" }} />
          )}
        </div>
        
        <Link 
          href={`/dashboard/jobs/${job.id}`}
          className="px-6 py-2 border border-zinc-200 dark:border-border rounded-xl font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm whitespace-nowrap"
        >
          {canAccessJobBoard ? "View Details" : "View (Locked)"}
        </Link>
      </div>
    </div>
  );
}

import JobSidebar from "./JobSidebar";
