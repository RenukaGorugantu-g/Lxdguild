import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Briefcase, MapPin, Building, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";

export default async function JobsDashboard({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { category } = await searchParams;

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isVerified = profile?.role === "candidate_mvp" || profile?.role === "admin";

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-6 pt-28">
        <div className="max-w-md text-center bg-white dark:bg-surface-dark p-8 rounded-2xl border shadow-sm">
          <Briefcase className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-zinc-500 mb-6">Only verified MVP candidates can access the exclusive job board. Please pass the skill validation exam to unlock this feature.</p>
          <Link href="/dashboard/candidate" className="inline-block bg-brand-600 text-white px-6 py-2 rounded-lg font-medium">
            Go to Candidate Dashboard
          </Link>
        </div>
      </div>
    );
  }

  let query = supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.ilike("title", `%${category}%`);
  }

  const { data: jobsList } = await query;

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
                  <JobCard key={job.id} job={job} />
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

function JobCard({ job }: { job: any }) {
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
          View Details
        </Link>
      </div>
    </div>
  );
}

import JobSidebar from "./JobSidebar";

