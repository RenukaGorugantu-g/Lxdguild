import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getJobBoardAccessForUser } from "@/lib/job-board-access";
import { deriveRoleKeyword, scoreSimilarJob } from "@/lib/job-preferences";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { loadProfile } from "@/lib/load-profile";
import { notFound, redirect } from "next/navigation";
import { MapPin, Building, Calendar, ArrowLeft, CheckCircle, Clock3 } from "lucide-react";
import Link from "next/link";
import ApplyButtonWithModal from "./ApplyButtonWithModal";
import ApplicationReviewActions from "./ApplicationReviewActions";

type ApplicantRow = {
  id: string;
  status: string;
  resume_id?: string | null;
  resume_url: string | null;
  created_at: string;
  user_id: string;
  ats_score?: number | null;
  ats_summary?: string | null;
  ats_auto_decision?: string | null;
  ats_matched_keywords?: string[] | null;
  ats_missing_keywords?: string[] | null;
};

type ApplicantProfile = {
  id: string;
  name: string | null;
  headline: string | null;
  email: string | null;
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
      ? await supabase
        .from("job_applications")
        .select("id, status, resume_id, resume_url, created_at, user_id, ats_score, ats_summary, ats_auto_decision, ats_matched_keywords, ats_missing_keywords")
        .eq("job_id", id)
        .order("created_at", { ascending: false })
    : { data: null };

  const applicantUserIds = ((applicants || []) as ApplicantRow[]).map((app) => app.user_id).filter(Boolean);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminSupabase =
    serviceRoleKey && supabaseUrl
      ? createSupabaseClient(supabaseUrl, serviceRoleKey)
      : null;
  const profileReader = isJobOwner && adminSupabase ? adminSupabase : supabase;
  const { data: applicantProfiles } = applicantUserIds.length
    ? await profileReader
        .from("profiles")
        .select("id, name, headline, email")
        .in("id", applicantUserIds)
    : { data: [] as ApplicantProfile[] };

  const applicantProfilesById = new Map((applicantProfiles || []).map((p) => [p.id, p]));
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
      <div className="max-w-4xl mx-auto">
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

                  {isJobOwner && (
                    <section>
                      <div className="flex items-center justify-between mb-4 gap-4">
                        <h3 className="text-xl font-bold">Applicants</h3>
                        <span className="text-sm text-zinc-500">{applicants?.length ?? 0} total</span>
                      </div>

                      {applicants?.length ? (
                        <ul className="space-y-4">
                          {(applicants as ApplicantRow[]).map((app) => {
                            const applicantProfile = applicantProfilesById.get(app.user_id);
                            return (
                            <li key={app.id} className="p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-zinc-900 dark:text-white">{applicantProfile?.name || "Candidate"}</p>
                                  <p className="text-sm text-zinc-500">{applicantProfile?.headline || applicantProfile?.email || 'Candidate application'}</p>
                                </div>
                                <span className={`text-xs uppercase tracking-widest px-2.5 py-1 rounded-full border ${getStatusPillClasses(app.status)}`}>
                                  {app.status}
                                </span>
                              </div>
                              <ApplicationReviewActions applicationId={app.id} currentStatus={app.status} />
                              {typeof app.ats_score === "number" && (
                                <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-zinc-700">
                                  <p className="font-semibold text-zinc-900">ATS match: {Math.round(app.ats_score)}%</p>
                                  {app.ats_summary ? <p className="mt-1 text-xs leading-5 text-zinc-500">{app.ats_summary}</p> : null}
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {app.ats_matched_keywords?.slice(0, 4).map((keyword) => (
                                      <span key={keyword} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                        {keyword}
                                      </span>
                                    ))}
                                    {app.ats_missing_keywords?.slice(0, 4).map((keyword) => (
                                      <span key={keyword} className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                        Missing: {keyword}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {(app.resume_id || app.resume_url) && (
                                <a
                                  href={app.resume_id ? `/api/resumes/${app.resume_id}/download` : app.resume_url || undefined}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-brand-600 hover:underline mt-3 block"
                                >
                                  View resume
                                </a>
                              )}
                              <p className="text-xs text-zinc-400 mt-3">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
                            </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-zinc-500 dark:text-zinc-400">
                          No applications have been submitted for this job yet.
                        </div>
                      )}
                    </section>
                  )}
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
