import { createClient } from "@/utils/supabase/server";
import { Search, Lock, Star } from "lucide-react";
import Link from "next/link";
import PostedJobsSection from "./PostedJobsSection";

export default async function EmployerDashboard({ profile: initialProfile }: { profile?: any }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = initialProfile;
  if (!profile && user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  // Get MVP Candidates. The RLS only allows them to see those with pass_status = 'pass'.
  // We query profiles and candidate data. 
  // In Supabase we do something like:
  const { data: mvpCandidates } = await supabase
    .from("profiles")
    .select(`
      id,
      name,
      designation_level,
      candidates (
        latest_score
      )
    `)
    .eq("role", "candidate_mvp")
    .limit(10);

  const isFreePlan = profile.role === "employer_free";
  const isProPlan = profile.role === "employer_pro" || profile.role === "employer_premium";
  const mvpCount = mvpCandidates?.length ?? 0;

  const { data: postedJobs } = await supabase
    .from("jobs")
    .select("id, title, company, location, created_at, apply_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header content */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Employer Hub</h1>
            <p className="text-zinc-500 mt-1">
              {isFreePlan
                ? `There are ${mvpCount} verified MVP candidates available. Upgrade to Pro to unlock full access.`
                : "Discover pre-vetted L&D talent ready to hire."}
            </p>
          </div>
          {isFreePlan ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white dark:bg-surface-dark border p-3 rounded-xl shadow-sm">
              <div className="text-sm">
                <p className="font-semibold">Free Plan</p>
                <p className="text-zinc-500">You can post jobs, but candidate access is limited.</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/dashboard/employer/post-job" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                  Post a Job
                </Link>
                <Link href="/dashboard/employer/upgrade" className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-200">
                 <Star className="w-4 h-4" /> {profile.role === "employer_pro" ? "Pro Plan" : "Premium Plan"} Active
              </div>
              <Link href="/dashboard/employer/post-job" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                Post a Job
              </Link>
            </div>
          )}
        </div>

        {isFreePlan && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-sm text-yellow-900">
            <p className="font-semibold">MVP candidates are available</p>
            <p className="mt-2">We currently have <span className="font-semibold">{mvpCount}</span> verified MVP candidates. Upgrade to Pro to unlock full profile details and connect with them.</p>
          </div>
        )}

        <PostedJobsSection initialJobs={postedJobs || []} />

        {/* Candidate Search / Discovery */}

        <div className="bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search verified Instructional Designers, LXDs..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-zinc-50 dark:bg-black focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mvpCandidates?.map((candidate: any) => (
               <div key={candidate.id} className="border border-zinc-200 dark:border-border rounded-xl p-5 relative overflow-hidden group">
                 <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold shrink-0">
                      {isFreePlan ? "C" : candidate.name.substring(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{isFreePlan ? "Verified Candidate" : candidate.name}</h3>
                      <p className="text-zinc-500 text-sm">{candidate.designation_level}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 mb-4 text-sm font-medium text-green-700 dark:text-green-500 bg-green-50 dark:bg-green-900/10 w-fit px-3 py-1 rounded-full border border-green-200 dark:border-green-900/30">
                    Exam Score: {candidate.candidates?.[0]?.latest_score}%
                 </div>
                 
                 {isFreePlan && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href="/dashboard/employer/upgrade" className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-full font-medium shadow-lg">
                        <Lock className="w-4 h-4" /> Unlock Profile
                      </Link>
                    </div>
                 )}

                 {isProPlan && (
                   <Link
                     href={`/dashboard/employer/candidates/${candidate.id}`}
                     className="w-full inline-flex justify-center items-center gap-2 border border-zinc-200 dark:border-border rounded-lg hover:bg-zinc-50 dark:hover:bg-[#1a1c23] transition-colors text-sm font-medium py-2.5"
                   >
                     View Profile & Resume
                   </Link>
                 )}
                 {!isFreePlan && !isProPlan && (
                    <button className="w-full py-2 border rounded-lg hover:bg-zinc-50 dark:hover:bg-[#1a1c23] transition-colors text-sm font-medium">
                      View Full Profile
                    </button>
                 )}
               </div>
            ))}

            {mvpCandidates?.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500">
                No MVP Candidates available right now. Check back soon.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

