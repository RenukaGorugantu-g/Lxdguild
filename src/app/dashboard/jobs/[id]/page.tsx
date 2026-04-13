import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getJobBoardAccessForUser } from "@/lib/job-board-access";
import { notFound, redirect } from "next/navigation";
import { Briefcase, MapPin, Building, Calendar, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import ApplyButtonWithModal from "./ApplyButtonWithModal";
import ApplicationReviewActions from "./ApplicationReviewActions";

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = await params;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!job) notFound();

  const isJobOwner = user.id === job.user_id;
  const { canAccessJobBoard } = await getJobBoardAccessForUser(supabase, user.id);

  // Fetch Profile and Resumes
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isMvpCandidate = profile?.role === "candidate_mvp";
  const isEmployerViewer = profile?.role?.startsWith("employer");
  const isCandidateViewer = profile?.role?.startsWith("candidate");
  const canApplyToJob = isCandidateViewer && !isJobOwner && canAccessJobBoard;

  const { data: resumes } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", user.id);

  // Check if already applied
  const { data: application } = await supabase
    .from("job_applications")
    .select("*")
    .eq("job_id", id)
    .eq("user_id", user.id)
    .single();

  const { data: applicants } = isJobOwner
    ? await supabase
        .from("job_applications")
        .select("id, status, resume_url, created_at, user_id")
        .eq("job_id", id)
        .order("created_at", { ascending: false })
    : { data: null };

  const applicantUserIds = (applicants || []).map((app: any) => app.user_id).filter(Boolean);
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
    : { data: [] as any[] };

  const applicantProfilesById = new Map((applicantProfiles || []).map((p: any) => [p.id, p]));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard/jobs" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-brand-600 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Job Board
        </Link>

        <div className="bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-3xl overflow-hidden shadow-sm">
          {/* Header Banner */}
          <div className="h-32 bg-gradient-to-r from-brand-600/10 to-accent-600/10 border-b border-zinc-100 dark:border-zinc-800 flex items-end p-8">
             <div className="w-16 h-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center -mb-12 shadow-md">
                <Building className="w-8 h-8 text-brand-600" />
             </div>
          </div>

          <div className="p-8 pt-16">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-6 text-zinc-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-brand-600" /> {job.company}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-600" /> {job.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-600" /> {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {isCandidateViewer ? (
                <div className="flex flex-col gap-3 min-w-[200px]">
                  <ApplyButtonWithModal
                    job={job}
                    user={user}
                    profile={profile}
                    resumes={resumes || []}
                    alreadyApplied={!!application}
                    canApply={canApplyToJob}
                    lockReason="Write the assessment to unlock job applications."
                  />
                  <p className="text-[10px] text-center text-zinc-400 uppercase tracking-widest font-bold">Applications managed by LXD Guild</p>
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
                      dangerouslySetInnerHTML={{ __html: job.description }}
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
                          {applicants.map((app: any) => {
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
                              {app.resume_url && (
                                <a href={app.resume_url} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:underline mt-3 block">
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
                            : "Complete the assessment to unlock applications for this role."}
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
  if (status === "accepted") return "bg-green-50 text-green-700 border-green-200";
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}
