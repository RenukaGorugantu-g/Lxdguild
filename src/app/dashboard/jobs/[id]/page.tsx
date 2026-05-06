import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getJobBoardAccessForUser } from "@/lib/job-board-access";
import { deriveRoleKeyword, scoreSimilarJob } from "@/lib/job-preferences";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { loadProfile } from "@/lib/load-profile";
import { getEmployerPlan } from "@/lib/profile-role";
import { decideApplicationStatus, downloadResumeBuffer } from "@/lib/resume-analysis";
import { extractKeywords, extractSkills, parseResumeFile, scoreCandidate } from "../../../../../ats-module";
import { notFound, redirect } from "next/navigation";
import { MapPin, Building, Calendar, ArrowLeft, CheckCircle, Clock3 } from "lucide-react";
import Link from "next/link";
import ApplyButtonWithModal from "./ApplyButtonWithModal";
import ApplicationReviewActions from "./ApplicationReviewActions";
import ApplicationInterviewScheduleCard from "./ApplicationInterviewScheduleCard";
import EmployerPipelineBoard from "./EmployerPipelineBoard";

type ApplicantRow = {
  id: string;
  status: string;
  resume_id?: string | null;
  resume_url: string | null;
  created_at: string;
  user_id: string;
  ats_score?: number | string | null;
  ats_summary?: string | null;
  ats_auto_decision?: string | null;
};

type LiveAtsResult = {
  score: number;
  summary: string;
  autoDecision: string;
};

type InterviewScheduleSummary = {
  roundLabel?: string | null;
  startAt?: string | null;
  durationMinutes?: number | null;
  meetingProvider?: string | null;
  schedulingUrl?: string | null;
  notes?: string | null;
};

type CachedLiveAtsResult = LiveAtsResult & {
  cachedAt: number;
};

const LIVE_ATS_CACHE_TTL_MS = 10 * 60 * 1000;
const liveAtsCache = new Map<string, CachedLiveAtsResult>();

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

function stripHtml(value: string | null | undefined) {
  return (value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractMinimumYearsOfExperience(description: string) {
  const normalized = description.toLowerCase();
  const patterns = [
    /(\d{1,2})\+?\s+years? of experience/g,
    /minimum of\s+(\d{1,2})\+?\s+years?/g,
    /at least\s+(\d{1,2})\+?\s+years?/g,
    /(\d{1,2})\+?\s+years? experience/g,
  ];
  const matches: number[] = [];

  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      matches.push(Number(match[1]));
    }
  }

  return matches.length ? Math.max(...matches) : 0;
}

function buildAtsSummary({
  score,
  skillMatch,
  experienceMatch,
  keywordMatch,
  missingSkills,
}: {
  score: number;
  skillMatch: number;
  experienceMatch: number;
  keywordMatch: number;
  missingSkills: string[];
}) {
  const summaryParts = [
    `ATS score ${score}%`,
    `skill match ${skillMatch}%`,
    `experience match ${experienceMatch}%`,
    `keyword relevance ${keywordMatch}%`,
  ];

  if (missingSkills.length > 0) {
    summaryParts.push(`missing skills: ${missingSkills.slice(0, 5).join(", ")}`);
  }

  return `${summaryParts.join(" | ")}.`;
}

async function computeLiveAtsResultForApplicant({
  job,
  applicant,
}: {
  job: JobDetailRecord;
  applicant: ApplicantRow;
}): Promise<LiveAtsResult | null> {
  const cacheKey = `${applicant.id}:${applicant.resume_url || "no-resume"}:${job.id}`;
  const cachedEntry = liveAtsCache.get(cacheKey);

  if (cachedEntry && Date.now() - cachedEntry.cachedAt < LIVE_ATS_CACHE_TTL_MS) {
    return {
      score: cachedEntry.score,
      summary: cachedEntry.summary,
      autoDecision: cachedEntry.autoDecision,
    };
  }

  if (!applicant.resume_url) {
    return null;
  }

  try {
    const jobDescription = stripHtml(job.description);
    const scoringSource = `${job.title} ${jobDescription}`.trim();
    const requiredSkills = extractSkills(scoringSource);
    const keywords = extractKeywords(scoringSource, requiredSkills);
    const minimumYearsOfExperience = extractMinimumYearsOfExperience(jobDescription);

    const resumeFile = await downloadResumeBuffer({
      fileUrl: applicant.resume_url,
      fileName: `resume-${applicant.id}.pdf`,
    });

    const parsedResume = await parseResumeFile({
      fileName: resumeFile.fileName,
      mimeType: resumeFile.mimeType || undefined,
      buffer: resumeFile.buffer,
    });

    const scoringResult = scoreCandidate({
      job: {
        title: job.title,
        description: jobDescription,
        requiredSkills,
        preferredSkills: [],
        minimumYearsOfExperience,
        keywords,
      },
      resume: parsedResume,
    });

    const liveAtsResult = {
      score: scoringResult.score,
      summary: buildAtsSummary(scoringResult),
      autoDecision: decideApplicationStatus(scoringResult.score).autoDecision,
    };

    liveAtsCache.set(cacheKey, {
      ...liveAtsResult,
      cachedAt: Date.now(),
    });

    return liveAtsResult;
  } catch (error) {
    console.error("[job-detail] live ATS fallback failed", {
      applicationId: applicant.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

type ApplicantProfile = {
  id: string;
  name: string | null;
  headline: string | null;
  email: string | null;
  role?: string | null;
  portfolio_url?: string | null;
};

type ViewerProfile = {
  id: string;
  role?: string | null;
  name?: string | null;
  headline?: string | null;
  email?: string | null;
  skills?: string[] | null;
};

type SuggestedJob = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  expires_at: string | null;
};

type JobDetailRecord = {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  location: string | null;
  apply_url?: string | null;
  user_id?: string | null;
  external_posted_at?: string | null;
  imported_at?: string | null;
  created_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean | null;
  deletion_request_status?: string | null;
  deleted_at?: string | null;
};

function isMissingColumnError(message?: string | null) {
  const normalized = message || "";
  return (
    normalized.includes("Could not find") ||
    normalized.includes("does not exist") ||
    normalized.includes("schema cache")
  );
}

async function getApplicantsForJob(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string
) {
  const fullQuery = await supabase
    .from("job_applications")
    .select("id, status, resume_id, resume_url, created_at, user_id, ats_score, ats_summary, ats_auto_decision")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (!fullQuery.error) {
    return fullQuery;
  }

  if (fullQuery.error.code !== "42703" && !isMissingColumnError(fullQuery.error.message)) {
    return fullQuery;
  }

  const legacyQuery = await supabase
    .from("job_applications")
    .select("id, status, resume_url, created_at, user_id")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  return {
    ...legacyQuery,
    data: (legacyQuery.data || []).map((application) => ({
      ...application,
      resume_id: null,
      ats_score: null,
      ats_summary: null,
      ats_auto_decision: null,
    })),
  };
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string; view?: string; remote?: string; schedule?: string; page?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const { category, view, remote, schedule, page, q } = await searchParams;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let profile = await loadProfile<ViewerProfile>(
    supabase,
    user.id,
    "id, role, name, headline, email, skills"
  );

  if (!profile) {
    const ensuredProfile = await ensureUserProfile(user);
    if (ensuredProfile) {
      profile = await loadProfile<ViewerProfile>(
        supabase,
        user.id,
        "id, role, name, headline, email, skills"
      );
    }
  }

  if (!profile) {
    redirect("/dashboard");
  }

  const jobQuery = await supabase
    .from("jobs")
    .select("id, title, description, company, location, apply_url, user_id, external_posted_at, imported_at, created_at, expires_at, is_active, deletion_request_status, deleted_at")
    .eq("id", id)
    .single();
  let job = jobQuery.data as JobDetailRecord | null;

  if (jobQuery.error?.code === "42703") {
    const fallbackJobQuery = await supabase
      .from("jobs")
      .select("id, title, description, company, location, apply_url, user_id, created_at")
      .eq("id", id)
      .single();

    job = fallbackJobQuery.data
      ? {
          ...fallbackJobQuery.data,
          external_posted_at: null,
          imported_at: fallbackJobQuery.data.created_at,
          expires_at: null,
          is_active: true,
          deletion_request_status: "none",
          deleted_at: null,
        }
      : null;
  }

  if (!job) notFound();

  const isJobOwner = user.id === job.user_id;
  const {
    canApplyToJobs,
    isFreeAccessCandidate,
    freeApplicationsRemaining,
    lockReason,
  } = await getJobBoardAccessForUser(supabase, user.id, profile);

  if (job.deleted_at && profile?.role !== "admin" && !isJobOwner) {
    notFound();
  }

  const isMvpCandidate = profile?.role === "candidate_mvp";
  const isCandidateViewer = profile?.role?.startsWith("candidate");
  const employerPlan = getEmployerPlan(profile?.role);
  const isPaidEmployer = employerPlan === "pro" || employerPlan === "premium";
  const canApplyToJob = isCandidateViewer && !isJobOwner && canApplyToJobs;
  const roleKeyword = deriveRoleKeyword(job.title);

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, file_url, file_name")
    .eq("user_id", user.id);

  const { data: application } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const savedCompanyQuery = !isJobOwner && job.company
    ? await supabase
        .from("saved_companies")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_name", job.company)
        .maybeSingle()
    : { data: null, error: null };
  const savedCompany = savedCompanyQuery.error?.code === "42P01" ? null : savedCompanyQuery.data;

  const followedRoleQuery = !isJobOwner
    ? await supabase
        .from("followed_job_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("keyword", roleKeyword)
        .maybeSingle()
    : { data: null, error: null };
  const followedRole = followedRoleQuery.error?.code === "42P01" ? null : followedRoleQuery.data;

  const { data: applicants } = isJobOwner
    ? await getApplicantsForJob(supabase, id)
    : { data: null };
  const liveAtsByApplicationId = new Map<string, LiveAtsResult>();
  const interviewSchedulesByApplicationId = new Map<string, InterviewScheduleSummary>();

  const applicantUserIds = ((applicants || []) as ApplicantRow[]).map((app) => app.user_id).filter(Boolean);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminSupabase =
    serviceRoleKey && supabaseUrl
      ? createSupabaseClient(supabaseUrl, serviceRoleKey)
      : null;
  const profileReader = isJobOwner && adminSupabase ? adminSupabase : supabase;
  let applicantProfiles: ApplicantProfile[] = [];
  if (applicantUserIds.length) {
    const fullProfileQuery = await profileReader
      .from("profiles")
      .select("id, name, headline, email, role, portfolio_url")
      .in("id", applicantUserIds);

    if (!fullProfileQuery.error) {
      applicantProfiles = (fullProfileQuery.data || []) as ApplicantProfile[];
    } else if (fullProfileQuery.error.code === "42703" || isMissingColumnError(fullProfileQuery.error.message)) {
      const fallbackProfileQuery = await profileReader
        .from("profiles")
        .select("id, name, headline, email, role")
        .in("id", applicantUserIds);

      applicantProfiles = (fallbackProfileQuery.data || []) as ApplicantProfile[];
    }
  }

  const applicantProfilesById = new Map(applicantProfiles.map((p) => [p.id, p]));
  if (isJobOwner && applicantUserIds.length && adminSupabase) {
    const interviewNotificationsQuery = await adminSupabase
      .from("notifications")
      .select("id, user_id, type, data, created_at")
      .in("user_id", applicantUserIds)
      .eq("type", "job_interview_scheduled")
      .order("created_at", { ascending: false })
      .limit(200);

    for (const notification of interviewNotificationsQuery.data || []) {
      const data = notification.data as Record<string, unknown> | null;
      const applicationId = typeof data?.application_id === "string" ? data.application_id : null;

      if (!applicationId || interviewSchedulesByApplicationId.has(applicationId)) {
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

  if (isJobOwner && applicants?.length) {
    const liveAtsEntries = await Promise.all(
      (applicants as ApplicantRow[]).map(async (applicant) => {
        if (toNumericScore(applicant.ats_score) !== null || applicant.ats_summary || applicant.ats_auto_decision) {
          return null;
        }

        const liveAts = await computeLiveAtsResultForApplicant({ job, applicant });
        return liveAts ? [applicant.id, liveAts] as const : null;
      })
    );

    for (const entry of liveAtsEntries) {
      if (entry) {
        liveAtsByApplicationId.set(entry[0], entry[1]);
      }
    }
  }
  const visibleApplicantRows =
    isJobOwner && !isPaidEmployer
      ? (((applicants as ApplicantRow[] | null) || []).slice(0, 5))
      : (((applicants as ApplicantRow[] | null) || []));
  const hiddenApplicantCount =
    isJobOwner && !isPaidEmployer && applicants?.length
      ? Math.max((applicants.length || 0) - visibleApplicantRows.length, 0)
      : 0;
  const recommendationQuery = supabase
    .from("jobs")
    .select("id, title, company, location, expires_at, created_at, is_active")
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .neq("id", id)
    .order("external_posted_at", { ascending: false, nullsFirst: false })
    .order("imported_at", { ascending: false })
    .limit(40);
  const recommendationResult = await recommendationQuery;
  let recommendationPool: SuggestedJob[] | null = recommendationResult.data as SuggestedJob[] | null;
  const recommendationError = recommendationResult.error;

  if (recommendationError?.code === "42703") {
    const fallbackRecommendations = await supabase
      .from("jobs")
      .select("id, title, company, location, created_at")
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(40);

    recommendationPool = (fallbackRecommendations.data || []).map((item) => ({
      ...item,
      expires_at: null,
    })) as SuggestedJob[];
  }

  const similarJobs = (recommendationPool || [])
    .map((item) => ({
      ...item,
      score: scoreSimilarJob(job.title, item.title, item.company === job.company),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const postedDateSource = job.external_posted_at || job.imported_at || job.created_at || new Date().toISOString();
  const postedDate = new Date(postedDateSource).toLocaleDateString();
  const expiryDate = job.expires_at ? new Date(job.expires_at).toLocaleDateString() : null;
  const isDeactivated = job.is_active === false;
  const hasPendingDeletion = job.deletion_request_status === "pending";
  const returnParams = new URLSearchParams();
  if (q) returnParams.set("q", q);
  if (category) returnParams.set("category", category);
  if (view) returnParams.set("view", view);
  if (remote) returnParams.set("remote", remote);
  if (schedule) returnParams.set("schedule", schedule);
  if (page && page !== "1") returnParams.set("page", page);
  const backToJobsHref = `/dashboard/jobs${returnParams.toString() ? `?${returnParams.toString()}` : ""}`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
      <div className={`${isJobOwner ? "max-w-7xl" : "max-w-4xl"} mx-auto`}>
        <Link href={backToJobsHref} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-brand-600 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Job Board
        </Link>

        <div className="bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="h-32 bg-gradient-to-r from-brand-600/10 to-accent-600/10 border-b border-zinc-100 dark:border-zinc-800 flex items-end p-8">
             <div className="w-16 h-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center -mb-12 shadow-md">
                <Building className="w-8 h-8 text-brand-600" />
             </div>
          </div>

          <div className="p-8 pt-16">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">{job.title}</h1>
                {isDeactivated && (
                  <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
                    This job is deactivated
                  </div>
                )}
                {hasPendingDeletion && (isJobOwner || profile?.role === "admin") && (
                  <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-800">
                    Delete request pending admin review
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-6 text-zinc-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-brand-600" /> {job.company}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-600" /> {job.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-600" /> {postedDate}
                  </div>
                </div>
              </div>

              {isCandidateViewer ? (
                <div className="flex flex-col gap-3 min-w-[200px]">
                  <ApplyButtonWithModal
                    job={job}
                    profile={profile}
                    resumes={resumes || []}
                    alreadyApplied={!!application}
                    canApply={canApplyToJob}
                    roleKeyword={roleKeyword}
                    similarJobs={similarJobs}
                    isCompanySaved={!!savedCompany}
                    isRoleFollowed={!!followedRole}
                    lockReason={
                      lockReason ||
                      "Write the assessment to unlock job applications."
                    }
                    backToJobsHref={backToJobsHref}
                  />
                  <p className="text-[10px] text-center text-zinc-400 uppercase tracking-widest font-bold">
                    {isFreeAccessCandidate && freeApplicationsRemaining > 0
                      ? `${freeApplicationsRemaining} free application${freeApplicationsRemaining === 1 ? "" : "s"} remaining`
                      : "We track your application here, then send you to the official apply page"}
                  </p>
                </div>
              ) : (
                <div className="min-w-[220px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Employer view</p>
                  <p className="text-xs mt-1 text-zinc-500">Application controls are available in the applicants list below.</p>
                </div>
              )}
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-12">
               <div className="md:col-span-2 space-y-8">
                  <section>
                    <h3 className="text-xl font-bold mb-4">Job Description</h3>
                    <div 
                      className="text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-4"
                      dangerouslySetInnerHTML={{ __html: job.description || "" }}
                    />
                  </section>
               </div>

               <div className="space-y-6">
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                     <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-zinc-400">Hiring Process</h4>
                     <ul className="space-y-4">
                        <li className="flex gap-3 text-sm">
                           <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-[10px] font-bold text-brand-600 shrink-0">1</div>
                           <span>LXD Guild Skill Validation</span>
                        </li>
                        <li className="flex gap-3 text-sm">
                           <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-[10px] font-bold text-brand-600 shrink-0">2</div>
                           <span>Internal Portfolio Review</span>
                        </li>
                        <li className="flex gap-3 text-sm">
                           <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 shrink-0">3</div>
                           <span className="text-zinc-400">Direct Interview with {job.company}</span>
                        </li>
                     </ul>
                  </div>

                  <div className="p-6 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-3">
                     <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Listing Freshness</h4>
                     <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                       <Clock3 className="w-4 h-4 text-brand-600" />
                       <span>Posted or refreshed on {postedDate}</span>
                     </div>
                     {expiryDate && (
                       <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                         <Clock3 className="w-4 h-4" />
                         <span>Expected to expire on {expiryDate}</span>
                       </div>
                     )}
                  </div>

                  <div className="p-6 bg-brand-600 text-white rounded-2xl shadow-lg relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CheckCircle className="w-16 h-16" />
                     </div>
                     <p className="text-sm font-bold mb-1">Verified access</p>
                     <p className="text-xs opacity-90 leading-relaxed">
                       {isJobOwner
                         ? "You posted this listing. Review applicants below."
                         : profile?.role === "admin"
                           ? "You are browsing with admin access."
                           : isMvpCandidate
                             ? "Your MVP status gives you priority access to this role."
                            : isFreeAccessCandidate
                              ? freeApplicationsRemaining > 0
                                ? `You have ${freeApplicationsRemaining} free application${freeApplicationsRemaining === 1 ? "" : "s"} left before verification is required.`
                                : "Your free job access is complete. Verify your profile to keep applying."
                              : "Browse now and complete the assessment to unlock applications for this role."}
                     </p>
                  </div>
               </div>
            </div>

            {isJobOwner && (
              <section className="mt-12 space-y-6 rounded-[2rem] border border-zinc-200 bg-[#fbfdfc] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Applicants</p>
                    <h3 className="mt-2 text-2xl font-bold text-zinc-900">Review the full hiring pipeline in one place.</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                      Track movement, inspect ATS results, and jump into interviews or profile review without squeezing the hiring flow into the job description column.
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm">
                    {applicants?.length ?? 0} total applicants
                  </span>
                </div>

                {applicants?.length ? (
                  <>
                    <EmployerPipelineBoard
                      applicants={visibleApplicantRows.map((app) => {
                        const applicantProfile = applicantProfilesById.get(app.user_id);
                        const liveAts = liveAtsByApplicationId.get(app.id);
                        const interviewSchedule = interviewSchedulesByApplicationId.get(app.id) || null;
                        const atsScore = toNumericScore(app.ats_score) ?? liveAts?.score ?? null;
                        const atsSummary = app.ats_summary || liveAts?.summary || null;
                        const atsAutoDecision = app.ats_auto_decision || liveAts?.autoDecision || null;
                        const isLockedMvp = !isPaidEmployer && applicantProfile?.role === "candidate_mvp";

                        return {
                          id: app.id,
                          name: isLockedMvp ? "MVP candidate" : applicantProfile?.name || "Candidate",
                          headline: isLockedMvp
                            ? "Upgrade to Premium to view this MVP candidate profile."
                            : applicantProfile?.headline || applicantProfile?.email || "Candidate application",
                          status: app.status,
                          appliedAt: app.created_at,
                          atsScore,
                          atsSummary,
                          atsAutoDecision,
                          interviewSchedule,
                          resumeHref: isLockedMvp ? null : app.resume_id ? `/api/resumes/${app.resume_id}/download` : app.resume_url || null,
                          portfolioUrl: isLockedMvp ? null : applicantProfile?.portfolio_url || null,
                          profileHref:
                            !isLockedMvp && applicantProfile?.role === "candidate_mvp"
                              ? `/dashboard/employer/candidates/${app.user_id}`
                              : null,
                          isMvp: applicantProfile?.role === "candidate_mvp",
                          lockedMessage: isLockedMvp ? "MVP candidate can't be viewed on the current employer plan." : null,
                          jobTitle: job.title,
                        };
                      })}
                      isPaidEmployer={isPaidEmployer}
                      hiddenApplicantsCount={hiddenApplicantCount}
                    />
                  </>
                ) : (
                  <div className="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-zinc-500 dark:text-zinc-400">
                    No applications have been submitted for this job yet.
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusPillClasses(status: string) {
  if (status === "accepted" || status === "shortlisted") return "bg-green-50 text-green-700 border-green-200";
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}
