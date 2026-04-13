import { createClient } from "@/utils/supabase/server";
import { getJobBoardAccessForUser } from "@/lib/job-board-access";
import { redirect } from "next/navigation";
import { Briefcase, MapPin, Building, Lock, RefreshCw } from "lucide-react";
import Link from "next/link";

export default async function JobsDashboard({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; appStatus?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { category, appStatus } = await searchParams;

  if (!user) redirect("/login");

  const { canAccessJobBoard } = await getJobBoardAccessForUser(supabase, user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.ilike("title", `%${category}%`);
  }

  const { data: jobsList } = await query;
  let appQuery = supabase
    .from("job_applications")
    .select("id, status, created_at, jobs(id, title, company)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const appStatusFilter = ["applied", "accepted", "rejected"].includes(appStatus || "")
    ? appStatus
    : "all";

  if (appStatusFilter !== "all") {
    appQuery = appQuery.eq("status", appStatusFilter);
  }

  const { data: myApplications } = await appQuery;

  // Simple client-side categorization for filtering
  const categories = [
    "Instructional Designer",
    "eLearning Developer",
    "Learning Experience Designer",
    "L&D Manager",
    "Curriculum Developer"
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">L&D Job Board</h1>
            <p className="text-zinc-500 mt-1">Exclusive roles for verified LXD Guild professionals.</p>
          </div>
          {profile?.role === 'admin' && (
             <Link 
               href="/api/jobs/import" 
               className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
             >
               <RefreshCw className="w-4 h-4" /> Import Latest Jobs
             </Link>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
           {/* Sidebar */}
           <JobSidebar categories={categories} />

           {/* Main Content */}
           <div className="flex-1 space-y-4">
              {!canAccessJobBoard && (
                <div className="p-4 bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/20 rounded-xl text-amber-900 dark:text-amber-300 text-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Jobs are visible, but applying is locked. Complete the assessment to unlock applications.</span>
                  </div>
                  <Link href="/dashboard/candidate/exam" className="px-3 py-1 bg-amber-600 text-white rounded-md text-xs font-bold whitespace-nowrap">
                    Write Assessment
                  </Link>
                </div>
              )}

              {profile?.role?.startsWith("candidate") && (
                <div className="p-5 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">My Applications</h3>
                    <span className="text-xs text-zinc-500">Latest 10</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {["all", "applied", "accepted", "rejected"].map((status) => (
                      <Link
                        key={status}
                        href={status === "all" ? "/dashboard/jobs" : `/dashboard/jobs?appStatus=${status}`}
                        className={`px-2.5 py-1 rounded-full border transition-colors ${
                          appStatusFilter === status
                            ? "bg-brand-600 text-white border-brand-600"
                            : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        {status}
                      </Link>
                    ))}
                    <Link href="/dashboard/candidate/applications" className="ml-auto text-brand-600 hover:underline">
                      Full history
                    </Link>
                  </div>
                  {myApplications && myApplications.length > 0 ? (
                    <ul className="space-y-2">
                      {myApplications.map((application: any) => {
                        const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
                        return (
                          <li key={application.id} className="flex items-center justify-between gap-3 text-sm">
                            <div>
                              <p className="font-medium text-zinc-800 dark:text-zinc-200">
                                {job?.title || "Job"}
                                {job?.company ? ` · ${job.company}` : ""}
                              </p>
                              <p className="text-xs text-zinc-500">
                                Applied on {new Date(application.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusPillClasses(application.status)}`}>
                              {application.status}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-zinc-500">No applications yet. Apply to a role to see updates here.</p>
                  )}
                </div>
              )}

              {(!jobsList || jobsList.length <= 3) && profile?.role === 'admin' && (
                <div className="p-4 bg-blue-50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20 rounded-xl text-blue-800 dark:text-blue-300 text-sm flex items-center justify-between gap-4">
                   <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin-slow" />
                      <span>Job board looks a bit empty. Want to sync fresh roles?</span>
                   </div>
                   <Link href="/api/jobs/import" className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-bold whitespace-nowrap">Sync Now</Link>
                </div>
              )}

              <div className="grid gap-4">
                {jobsList?.map((job) => (
                  <JobCard key={job.id} job={job} canAccessJobBoard={canAccessJobBoard} />
                ))}

                {(!jobsList || jobsList.length === 0) && (
                  <div className="py-20 text-center bg-white dark:bg-surface-dark border rounded-2xl">
                    <RefreshCw className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                    <p className="text-zinc-500">No jobs found. Check back soon for new opportunities.</p>
                  </div>
                )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

function JobCard({ job, canAccessJobBoard }: { job: any; canAccessJobBoard: boolean }) {
  return (
    <div className="bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border p-6 rounded-2xl hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{job.title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Building className="w-4 h-4" /> {job.company}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {job.location}
            </div>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-2 mt-2 leading-relaxed" 
             dangerouslySetInnerHTML={{ __html: job.description }} />
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

function getStatusPillClasses(status: string) {
  if (status === "accepted") return "bg-green-50 text-green-700 border-green-200";
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

import JobSidebar from "./JobSidebar";

