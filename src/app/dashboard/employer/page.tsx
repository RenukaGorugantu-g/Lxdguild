import { createClient } from "@/utils/supabase/server";
import { Search, Lock, User, Star } from "lucide-react";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header content */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Employer Hub</h1>
            <p className="text-zinc-500 mt-1">Discover pre-vetted L&D talent ready to hire.</p>
          </div>
          {isFreePlan ? (
            <div className="flex items-center gap-3 bg-white dark:bg-surface-dark border p-3 rounded-xl shadow-sm">
              <div className="text-sm">
                <p className="font-semibold">Free Plan</p>
                <p className="text-zinc-500">Limited candidate view</p>
              </div>
              <Link href="/dashboard/employer/upgrade" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                Upgrade to Pro
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-200">
               <Star className="w-4 h-4" /> {profile.role === "employer_pro" ? "Pro Plan" : "Premium Plan"} Active
            </div>
          )}
        </div>

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

                 {!isFreePlan && (
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

