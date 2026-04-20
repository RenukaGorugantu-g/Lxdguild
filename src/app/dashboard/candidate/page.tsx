import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle, AlertCircle, FileText, ArrowRight, PlayCircle, User, ChevronRight, Briefcase } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getJobBoardAccessForUser } from "@/lib/job-board-access";
import { getMembershipState } from "@/lib/membership";
import { isVerifiedCandidateRole } from "@/lib/profile-role";
import CertificateUpload from "./certificate-upload";

type CandidateDashboardProfile = {
  name?: string | null;
  role?: string | null;
  membership_status?: string | null;
  membership_plan?: string | null;
  membership_expires_at?: string | null;
  [key: string]: unknown;
};

export default async function CandidateDashboard({ profile: initialProfile }: { profile?: CandidateDashboardProfile | null }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
  
  // Fetch candidate specifics
  const { data: candidate } = await supabase
    .from("candidates")
    .select("*")
    .eq("user_id", user?.id)
    .single();

    // Fetch certificate status if failed
  const { data: certificate } = await supabase
    .from("certificates")
    .select("status")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  const { data: recentApplications } = await supabase
    .from("job_applications")
    .select("id, status, created_at")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const isVerified = isVerifiedCandidateRole(profile.role);
  const membership = getMembershipState(profile);
  const { canAccessJobBoard } = await getJobBoardAccessForUser(supabase, user.id);
  return (
    <div className="premium-shell premium-page">
      <div className="premium-content max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="premium-hero p-7 sm:p-8">
          <div className="flex items-center justify-between">
          <div>
            <div className="premium-badge">Candidate workflow</div>
            <h1 className="mt-4 text-3xl font-bold text-white">Welcome, {profile.name}</h1>
            <p className="premium-copy mt-2">Track your progress and validate your L&amp;D skills through a more guided, premium dashboard experience.</p>
          </div>
          {isVerified && (
             <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium inline-flex items-center gap-2">
               <CheckCircle className="w-5 h-5" /> Verified MVP
             </div>
          )}
        </div>
        </div>

        {/* Progression Journey */}
        <div className="premium-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Your Journey</h2>
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
            <Step active={true} label="Register" icon={<CheckCircle className="w-8 h-8 text-green-500"/>} />
            <div className="flex-1 h-1 bg-brand-100 dark:bg-zinc-800 sm:mt-4 hidden sm:block"></div>
            <Step active={Boolean(candidate?.exam_status !== 'not_started')} label="Test" icon={candidate?.exam_status === 'completed' ? <CheckCircle className="w-8 h-8 text-green-500"/> : <PlayCircle className="w-8 h-8 text-brand-500"/>} />
            <div className="flex-1 h-1 bg-brand-100 dark:bg-zinc-800 sm:mt-4 hidden sm:block"></div>
            <Step active={isVerified} label="Verified" icon={isVerified || certificate?.status === 'approved' ? <CheckCircle className="w-8 h-8 text-green-500"/> : <CheckCircle className="w-8 h-8 text-zinc-300"/>} />
            <div className="flex-1 h-1 bg-brand-100 dark:bg-zinc-800 sm:mt-4 hidden sm:block"></div>
            <Step active={false} label="Hired" icon={<CheckCircle className="w-8 h-8 text-zinc-300"/>} />
          </div>
        </div>

        {/* Action Area */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Exam Status */}
          <div className="premium-card p-6">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-brand-600" />
              Skill Validation Exam
            </h3>
            
            {candidate?.pass_status === 'fail' ? (
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl">
                  <p className="font-medium flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Learning Path Required</p>
                  <p className="text-sm mt-1">You scored {candidate.latest_score}%. To unlock a reattempt, please submit a course completion certificate.</p>
                </div>
                
                {certificate?.status === 'pending' ? (
                  <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-center">
                    <p className="text-sm font-medium">Certificate under review...</p>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Reattempt will be enabled once approved</p>
                  </div>
                ) : candidate.reattempt_allowed ? (
                  <Link href="/dashboard/candidate/exam" className="w-full inline-flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium">
                    Reattempt Exam
                  </Link>
                ) : (
                  <CertificateUpload userId={user.id} />
                )}

                <Link href="/dashboard/candidate/scorecard" className="w-full inline-flex justify-center items-center gap-2 border border-zinc-200 dark:border-zinc-800 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  View Scorecard & Learning Path
                </Link>
              </div>
            ) : isVerified ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl">
                  <p className="font-medium flex items-center gap-2"><CheckCircle className="w-5 h-5"/> Exam Passed</p>
                  <p className="text-sm mt-1">You scored {candidate?.latest_score}%. Your profile is now visible to top employers.</p>
                </div>
                <Link href="/dashboard/candidate/scorecard" className="w-full inline-flex justify-center items-center gap-2 border border-zinc-200 dark:border-zinc-800 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  View Your Scorecard
                </Link>
              </div>
            ) : (
               <div className="space-y-4">
                 <p className="premium-copy">Prove your expertise. Our 30-question assessment will determine your MVP Candidate status.</p>
                 <Link href="/dashboard/candidate/exam" className="flex items-center justify-center gap-2 bg-brand-600 text-white py-2.5 px-4 rounded-lg hover:bg-brand-700 transition">
                   Start Exam <ArrowRight className="w-4 h-4" />
                 </Link>
               </div>
            )}
          </div>

          {/* Job Board Access */}
          <div className="bg-gradient-to-br from-brand-600 to-accent-600 rounded-2xl p-6 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <ArrowRight className="w-32 h-32" />
             </div>
             <h3 className="text-xl font-semibold mb-2 relative z-10">Job Opportunities</h3>
             {canAccessJobBoard ? (
               <div className="relative z-10 space-y-4">
                 <p className="opacity-90">Browse premium, deduplicated requests from Jooble, Adzuna, and Employers.</p>
                 <Link href="/dashboard/jobs" className="inline-block bg-white text-brand-700 font-medium px-6 py-2.5 rounded-lg shadow hover:shadow-lg transition">
                   View Job Board
                 </Link>
               </div>
             ) : (
               <div className="relative z-10 space-y-4">
                  <p className="opacity-90">Pass the validation exam or get your course certificate approved to browse and apply to roles.</p>
                  <button disabled className="bg-white/20 text-white font-medium px-6 py-2.5 rounded-lg cursor-not-allowed">
                    Locked
                  </button>
               </div>
             )}
          </div>

          {/* Professional Profile */}
          <Link 
            href="/dashboard/candidate/profile"
            className="premium-card p-6 transition-all group hover:translate-y-[-2px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center text-brand-600">
                <User className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold mb-1 text-white">Professional Profile</h3>
            <p className="text-[#cde3e1]/72 text-sm">Update your bio, skills, and resume for employers.</p>
          </Link>

          <Link
            href="/dashboard/candidate/applications"
            className="premium-card p-6 transition-all group hover:translate-y-[-2px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center text-brand-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold mb-1 text-white">My Applications</h3>
            <p className="text-[#cde3e1]/72 text-sm">
              {recentApplications?.length
                ? `Track ${recentApplications.length} recent application update${recentApplications.length > 1 ? "s" : ""}.`
                : "See all roles you applied to and current status."}
            </p>
          </Link>

          <Link
            href={membership.active ? "/dashboard/resources" : "/dashboard/membership"}
            className="premium-card p-6 transition-all group hover:translate-y-[-2px] md:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center text-brand-600">
                <FileText className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold mb-1 text-white">Tools & Resources Membership</h3>
            <p className="text-[#cde3e1]/72 text-sm">
              {membership.active
                ? "Your annual membership is active. Open the full resource library."
                : "Download the free resources now and unlock the full library with annual membership."}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Step({ active, label, icon }: { active: boolean, label: string, icon: React.ReactNode }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${active ? "" : "opacity-50 grayscale"}`}>
      {icon}
      <span className="text-sm font-medium text-zinc-950">{label}</span>
    </div>
  )
}
