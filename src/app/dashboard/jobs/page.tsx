import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getJobBoardAccessForUser } from "@/lib/job-board-access";
import { syncJobFeedIfStale } from "@/lib/job-feed";
import { isAdminRole } from "@/lib/profile-role";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { redirect } from "next/navigation";
import {
  BriefcaseBusiness,
  Building,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Lock,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import JobSidebar from "./JobSidebar";

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
    return text.includes("full time") || text.includes("full-time") || text.includes("fulltime");
  }

  if (schedule === "part-time") {
    return text.includes("part time") || text.includes("part-time") || text.includes("parttime");
  }

  return true;
}

export default async function JobsDashboard({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; view?: string; remote?: string; schedule?: string; page?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const jobsReader = adminSupabase ?? supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { category, view, remote, schedule, page, q } = await searchParams;

  if (!user) redirect("/login");

  let { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (!profile) {
    const ensuredProfile = await ensureUserProfile(user);
    if (!ensuredProfile) {
      redirect("/login");
    }
    profile = ensuredProfile;
  }

  // Verify role is set and valid for job board access
  const roleStr = String(profile.role || "").toLowerCase();
  if (!roleStr || (!roleStr.startsWith("candidate") && roleStr !== "admin")) {
    const ensuredProfile = await ensureUserProfile(user);
    if (ensuredProfile) {
      profile = ensuredProfile;
    }
  }

  const {
    canViewJobBoard,
    canApplyToJobs,
    isFreeAccessCandidate,
    freeApplicationLimit,
    freeApplicationsUsed,
    freeApplicationsRemaining,
    lockReason,
  } = await getJobBoardAccessForUser(supabase, user.id, profile);
  if (!canViewJobBoard) {
    redirect("/dashboard");
  }
  const pageSize = 12;
  const normalizedQuery = q?.trim() || "";

  let query = jobsReader
    .from("jobs")
    .select("id, title, description, company, location, work_mode, employment_type, expires_at, external_posted_at, imported_at, created_at, is_active, source, job_kind")
    .order("external_posted_at", { ascending: false, nullsFirst: false })
    .order("imported_at", { ascending: false });

  if (category) query = query.ilike("title", `%${category}%`);
  if (normalizedQuery) {
    query = query.or(`title.ilike.%${normalizedQuery}%,company.ilike.%${normalizedQuery}%,location.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`);
  }
  if (view === "freelance" || view === "standard") query = query.eq("job_kind", view);
  if (remote === "remote") query = query.eq("work_mode", "remote");
  if (schedule === "full-time") query = query.eq("employment_type", "full_time");
  if (schedule === "part-time") query = query.eq("employment_type", "part_time");

  let { data: rawJobsList, error: jobsError } = await query;

  if (jobsError?.code === "42703") {
    let fallbackQuery = jobsReader
      .from("jobs")
      .select("id, title, description, company, location, work_mode, employment_type, expires_at, external_posted_at, imported_at, created_at, is_active, source, job_kind")
      .order("created_at", { ascending: false });
    if (category) fallbackQuery = fallbackQuery.ilike("title", `%${category}%`);
    if (normalizedQuery) {
      fallbackQuery = fallbackQuery.or(`title.ilike.%${normalizedQuery}%,company.ilike.%${normalizedQuery}%,location.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`);
    }
    if (view === "freelance" || view === "standard") fallbackQuery = fallbackQuery.eq("job_kind", view);
    if (remote === "remote") fallbackQuery = fallbackQuery.eq("work_mode", "remote");
    if (schedule === "full-time") fallbackQuery = fallbackQuery.eq("employment_type", "full_time");
    if (schedule === "part-time") fallbackQuery = fallbackQuery.eq("employment_type", "part_time");

    const fallback = await fallbackQuery;
    rawJobsList = fallback.data;
    jobsError = fallback.error;
  }

  let jobsList = (rawJobsList || []).filter((job) => job.is_active !== false);

  if ((!jobsList || jobsList.length === 0) && !jobsError) {
    await syncJobFeedIfStale();

    let refreshQuery = jobsReader
      .from("jobs")
      .select("id, title, description, company, location, work_mode, employment_type, expires_at, external_posted_at, imported_at, created_at, is_active, source, job_kind")
      .order("external_posted_at", { ascending: false, nullsFirst: false })
      .order("imported_at", { ascending: false });

    if (category) refreshQuery = refreshQuery.ilike("title", `%${category}%`);
    if (normalizedQuery) {
      refreshQuery = refreshQuery.or(`title.ilike.%${normalizedQuery}%,company.ilike.%${normalizedQuery}%,location.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`);
    }
    if (view === "freelance" || view === "standard") refreshQuery = refreshQuery.eq("job_kind", view);
    if (remote === "remote") refreshQuery = refreshQuery.eq("work_mode", "remote");
    if (schedule === "full-time") refreshQuery = refreshQuery.eq("employment_type", "full_time");
    if (schedule === "part-time") refreshQuery = refreshQuery.eq("employment_type", "part_time");

    const refreshed = await refreshQuery;

    if (refreshed.error?.code === "42703") {
      let legacyRefreshQuery = jobsReader
        .from("jobs")
        .select("id, title, description, company, location, work_mode, employment_type, expires_at, external_posted_at, imported_at, created_at, is_active, source, job_kind")
        .order("created_at", { ascending: false });
      if (category) legacyRefreshQuery = legacyRefreshQuery.ilike("title", `%${category}%`);
      if (normalizedQuery) {
        legacyRefreshQuery = legacyRefreshQuery.or(`title.ilike.%${normalizedQuery}%,company.ilike.%${normalizedQuery}%,location.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`);
      }
      if (view === "freelance" || view === "standard") legacyRefreshQuery = legacyRefreshQuery.eq("job_kind", view);
      if (remote === "remote") legacyRefreshQuery = legacyRefreshQuery.eq("work_mode", "remote");
      if (schedule === "full-time") legacyRefreshQuery = legacyRefreshQuery.eq("employment_type", "full_time");
      if (schedule === "part-time") legacyRefreshQuery = legacyRefreshQuery.eq("employment_type", "part_time");

      const legacyRefreshed = await legacyRefreshQuery;
      jobsList = (legacyRefreshed.data || []).filter((job) => job.is_active !== false);
    } else {
      jobsList = (refreshed.data || []).filter((job) => job.is_active !== false);
    }
  }

  if ((!jobsList || jobsList.length === 0) && !jobsError) {
    let recentJobsQuery = jobsReader
      .from("jobs")
      .select("id, title, description, company, location, work_mode, employment_type, expires_at, external_posted_at, imported_at, created_at, is_active, source, job_kind")
      .order("created_at", { ascending: false })
      .limit(50);

    if (category) recentJobsQuery = recentJobsQuery.ilike("title", `%${category}%`);
    if (normalizedQuery) {
      recentJobsQuery = recentJobsQuery.or(`title.ilike.%${normalizedQuery}%,company.ilike.%${normalizedQuery}%,location.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`);
    }
    if (view === "freelance" || view === "standard") recentJobsQuery = recentJobsQuery.eq("job_kind", view);

    const recentJobs = await recentJobsQuery;
    jobsList = (recentJobs.data || []).filter((job) => job.source !== "employer" || job.is_active !== false);
  }

  jobsList = jobsList.filter((job) => matchesRemoteFilter(job, remote));
  jobsList = jobsList.filter((job) => matchesScheduleFilter(job, schedule));

  const categories = ["Instructional Designer", "eLearning Developer", "Learning Experience Designer", "L&D Manager", "Curriculum Developer"];
  const freelanceJobs = jobsList.filter((job) => job.job_kind === "freelance").slice(0, 4);
  const featuredFreelanceIds = new Set(freelanceJobs.map((job) => job.id));
  const jobsToRender = view === "freelance" ? jobsList : jobsList.filter((job) => !featuredFreelanceIds.has(job.id));
  const totalJobs = jobsToRender.length;
  const totalPages = Math.max(1, Math.ceil(totalJobs / pageSize));
  const parsedPage = Number(page || "1");
  const currentPage = Number.isFinite(parsedPage) ? Math.min(Math.max(1, Math.trunc(parsedPage)), totalPages) : 1;
  const paginatedJobs = jobsToRender.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageTitle = view === "freelance" ? "Freelance L&D Jobs" : view === "standard" ? "Standard L&D Jobs" : "L&D Job Board";
  const pageDescription =
    view === "freelance"
      ? "Short-term, contract, and freelance-friendly L&D opportunities."
      : "Exclusive roles for verified LXD Guild professionals.";
  const activeFilterChips = [
    normalizedQuery ? `Search: ${normalizedQuery}` : null,
    remote === "remote" ? "Remote" : null,
    schedule === "full-time" ? "Full-time" : null,
    schedule === "part-time" ? "Part-time" : null,
  ].filter(Boolean);

  const buildJobsHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (normalizedQuery) params.set("q", normalizedQuery);
    if (category) params.set("category", category);
    if (view && view !== "all") params.set("view", view);
    if (remote && remote !== "all") params.set("remote", remote);
    if (schedule && schedule !== "all") params.set("schedule", schedule);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/dashboard/jobs${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="marketing-page min-h-screen">
      <div className="marketing-section pt-32 pb-16">
        <div className="marketing-container space-y-8">
          <section className="grid items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="marketing-kicker">Curated opportunities</div>
              <div>
                <h1 className="marketing-title max-w-2xl text-5xl">{pageTitle}</h1>
                <p className="marketing-copy mt-4 max-w-2xl text-base leading-8">{pageDescription}</p>
              </div>
              {activeFilterChips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeFilterChips.map((chip) => (
                    <span key={chip} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4f5b4b] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="marketing-panel p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="marketing-soft-card p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Visible Roles</p>
                  <p className="mt-3 text-4xl font-bold text-[#17a21c]">{jobsList.length}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-[#e2ecd8]">
                    <div className="h-1.5 w-[82%] rounded-full bg-[#23b61f]" />
                  </div>
                </div>
                <div className="marketing-soft-card p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Application Access</p>
                  <p className="mt-3 text-4xl font-bold text-[#111827]">
                    {canApplyToJobs ? (isFreeAccessCandidate ? "Free" : "Open") : "Locked"}
                  </p>
                  <p className="mt-4 text-xs text-[#1da326]">
                    {canApplyToJobs
                      ? isFreeAccessCandidate
                        ? `${freeApplicationsRemaining} of ${freeApplicationLimit} free applications left`
                        : "Verified candidates can apply"
                      : lockReason || "Assessment required first"}
                  </p>
                </div>
              </div>
              <div className="marketing-soft-card mt-4 p-4">
                <p className="text-sm font-semibold text-[#111827]">Marketplace Flow</p>
                <div className="mt-5 grid grid-cols-5 gap-3">
                  {[34, 46, 28, 62, 44].map((height, index) => (
                    <div key={index} className={`${index === 3 ? "bg-[#35d421]" : "bg-[#dff5d8]"} rounded-t-xl`} style={{ height: `${height + 18}px` }} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-8 lg:flex-row">
            <JobSidebar categories={categories} />

            <div className="flex-1 space-y-4">
              {view !== "freelance" && freelanceJobs.length > 0 && (
                <div className="marketing-grid-card p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                        <BriefcaseBusiness className="h-4 w-4 text-[#23b61f]" />
                        Freelance Jobs
                      </div>
                      <p className="mt-1 text-sm text-[#5b6757]">
                        Contract and consulting work sourced separately for freelance-focused members.
                      </p>
                    </div>
                    <Link href="/dashboard/jobs?view=freelance" className="marketing-secondary">
                      View all freelance jobs
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {freelanceJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        canApplyToJobs={canApplyToJobs}
                        compact
                        lockReason={lockReason}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isFreeAccessCandidate && freeApplicationsRemaining > 0 && (
                <div className="marketing-grid-card flex items-center justify-between gap-4 p-4 text-sm">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <BriefcaseBusiness className="h-4 w-4 text-emerald-700" />
                    You are on free marketplace access. {freeApplicationsUsed} used, {freeApplicationsRemaining} remaining.
                  </div>
                  <Link href="/dashboard/candidate/profile" className="marketing-secondary whitespace-nowrap px-4 py-2 text-sm">
                    Strengthen Profile
                  </Link>
                </div>
              )}

              {!canApplyToJobs && (
                <div className="marketing-grid-card flex items-center justify-between gap-4 p-4 text-sm">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Lock className="h-4 w-4 text-amber-700" />
                    {lockReason || "Jobs are visible, but applying is locked. Complete the assessment to unlock applications."}
                  </div>
                  <Link
                    href={isFreeAccessCandidate ? "/dashboard/candidate/profile" : "/dashboard/candidate/exam"}
                    className="marketing-primary whitespace-nowrap px-4 py-2 text-sm"
                  >
                    {isFreeAccessCandidate ? "Verify to Continue" : "Write Assessment"}
                  </Link>
                </div>
              )}

              {(!jobsList || jobsList.length <= 3) && isAdminRole(profile?.role) && (
                <div className="marketing-grid-card flex items-center justify-between gap-4 p-4 text-sm">
                  <div className="flex items-center gap-2 text-[#335769]">
                    <RefreshCw className="h-4 w-4 text-[#23b61f]" />
                    Job board looks a bit empty. Want to sync fresh roles?
                  </div>
                  <Link href="/api/jobs/import" className="marketing-primary whitespace-nowrap px-4 py-2 text-sm">
                    Sync Now
                  </Link>
                </div>
              )}

              <div className="grid gap-4">
                {paginatedJobs.map((job) => (
                  <JobCard key={job.id} job={job} canApplyToJobs={canApplyToJobs} lockReason={lockReason} />
                ))}

                {jobsList.length === 0 && (
                  <div className="marketing-grid-card py-20 text-center">
                    <Search className="mx-auto mb-4 h-12 w-12 text-[#d2d9ce]" />
                    <p className="font-semibold text-[#111827]">
                      {normalizedQuery ? `No jobs matched "${normalizedQuery}".` : "No jobs found right now."}
                    </p>
                    <p className="mt-2 text-[#6d7d68]">
                      {normalizedQuery ? "Try a broader keyword like designer, remote, curriculum, or learning." : "Check back soon for new opportunities."}
                    </p>
                  </div>
                )}
              </div>

              {totalJobs > 0 && totalPages > 1 && (
                <div className="marketing-grid-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-[#6d7d68]">
                    Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalJobs)} of {totalJobs} jobs
                  </p>
                  <div className="flex items-center gap-2">
                    {currentPage > 1 ? (
                      <Link href={buildJobsHref(currentPage - 1)} className="marketing-secondary gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-[#dbe3d5] px-4 py-2 text-sm font-medium text-[#a4aca1]">
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </span>
                    )}

                    <span className="rounded-xl bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                      Page {currentPage} of {totalPages}
                    </span>

                    {currentPage < totalPages ? (
                      <Link href={buildJobsHref(currentPage + 1)} className="marketing-secondary gap-2">
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-[#dbe3d5] px-4 py-2 text-sm font-medium text-[#a4aca1]">
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function JobCard({
  job,
  canApplyToJobs,
  compact = false,
  lockReason,
}: {
  job: JobListItem;
  canApplyToJobs: boolean;
  compact?: boolean;
  lockReason?: string | null;
}) {
  const expiryDate = job.expires_at ? new Date(job.expires_at).toLocaleDateString() : null;
  const freshnessDate = new Date(job.external_posted_at || job.imported_at || job.created_at || new Date().toISOString()).toLocaleDateString();

  return (
    <div className={`marketing-grid-card ${compact ? "p-4" : "p-6"} transition-shadow hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]`}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className={`${compact ? "text-base" : "text-xl"} font-bold text-[#111827]`}>{job.title}</h2>
            {job.job_kind === "freelance" && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800">
                Freelance
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#5b6757]">
            <div className="flex items-center gap-1.5">
              <Building className="h-4 w-4" />
              {job.company}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {job.location}
            </div>
            {job.work_mode === "remote" && <div className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">Remote</div>}
            {job.employment_type === "full_time" && <div className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">Full-time</div>}
            {job.employment_type === "part_time" && <div className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">Part-time</div>}
            <div className="flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" />
              Posted {freshnessDate}
            </div>
            {expiryDate && (
              <div className="flex items-center gap-1.5 text-amber-700">
                <Clock3 className="h-4 w-4" />
                Expires {expiryDate}
              </div>
            )}
          </div>
          {!compact && (
            <p
              className="mt-2 text-sm leading-relaxed text-[#5b6757]"
              dangerouslySetInnerHTML={{ __html: job.description || "" }}
            />
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Link href={`/dashboard/jobs/${job.id}`} className="marketing-secondary whitespace-nowrap">
            {canApplyToJobs ? "View Details" : "View Role"}
          </Link>
          {!canApplyToJobs && (
          <div className="relative z-20 flex flex-col items-end gap-2">
            <p className="max-w-[220px] text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
              {lockReason || "Complete assessment to unlock"}
            </p>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
