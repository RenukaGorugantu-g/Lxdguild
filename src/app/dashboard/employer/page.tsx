import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Search, Lock, Star, Building2, Mail, PenSquare } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import PostedJobsSection from "./PostedJobsSection";
import { getMembershipState } from "@/lib/membership";
import { getEmployerPlan } from "@/lib/profile-role";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { loadProfile } from "@/lib/load-profile";

type EmployerDashboardProfile = {
  role?: string | null;
  name?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  company_name?: string | null;
  employer_designation?: string | null;
  membership_status?: string | null;
  membership_plan?: string | null;
  membership_expires_at?: string | null;
  [key: string]: unknown;
};

type EmployerCandidateCard = {
  id: string;
  name?: string | null;
  designation_level?: string | null;
  headline?: string | null;
  candidates?: Array<{ latest_score?: number | null }> | null;
  resumes?: Array<{ id: string; file_url?: string | null; file_name?: string | null }> | null;
};

type PostedJobRow = {
  id: string;
  title: string;
  company?: string | null;
  location?: string | null;
  created_at: string;
  apply_url?: string | null;
  is_active?: boolean | null;
  deletion_request_status?: string | null;
  deleted_at?: string | null;
  applicant_count?: number;
};

export default async function EmployerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  let profile = await loadProfile<EmployerDashboardProfile>(
    supabase,
    user.id,
    "role, name, headline, bio, location, company_name, employer_designation, membership_status, membership_plan, membership_expires_at"
  );

  if (!profile) {
    const ensuredProfile = await ensureUserProfile(user);
    if (ensuredProfile) {
      profile = await loadProfile<EmployerDashboardProfile>(
        supabase,
        user.id,
        "role, name, headline, bio, location, company_name, employer_designation, membership_status, membership_plan, membership_expires_at"
      );
    }
  }

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  const employerPlan = getEmployerPlan(profile.role);
  const isFreePlan = employerPlan === "free";
  const isProPlan = employerPlan === "pro" || employerPlan === "premium";
  const membership = getMembershipState(profile);
  const showEmployerUpgrade = isFreePlan;
  const [postedJobs, mvpCount] = await Promise.all([
    getPostedJobs(supabase, user.id),
    showEmployerUpgrade ? getMvpCandidateCount(supabase) : Promise.resolve(null),
  ]);

  return (
    <div className="premium-shell premium-page">
      <div className="premium-content max-w-6xl mx-auto space-y-8">
        
        {/* Header content */}
        <div className="premium-hero p-7 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="premium-badge">Employer workflow</div>
            <h1 className="mt-4 text-3xl font-bold text-white">Employer Hub</h1>
            <p className="premium-copy mt-2">
              {showEmployerUpgrade
                ? `There are ${mvpCount ?? 0} verified MVP candidates available. Upgrade to Pro to unlock full access.`
                : "Discover pre-vetted L&D talent ready to hire."}
            </p>
            {(profile.company_name || profile.employer_designation) && (
              <p className="mt-3 text-sm text-[#cde3e1]/72">
                {profile.employer_designation ? `${profile.employer_designation.replaceAll("_", " ")} at ` : ""}
                {profile.company_name || "your company"}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
                Employer plan: {employerPlan === "pro" ? "Pro" : employerPlan === "premium" ? "Premium" : "Free"}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
                Membership: {membership.active ? "Active" : "Inactive"}
              </span>
            </div>
            {membership.active && isFreePlan && (
              <p className="mt-3 max-w-2xl text-xs leading-6 text-[#cde3e1]/80">
                Your Guild membership is active for resources and member benefits. Employer Pro/Premium is a separate hiring plan, so you can still see employer upgrade prompts while membership stays active.
              </p>
            )}
          </div>
          {showEmployerUpgrade ? (
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
                 <Star className="w-4 h-4" /> {employerPlan === "pro" ? "Pro Plan" : "Premium Plan"} Active
              </div>
              <Link href="/dashboard/employer/post-job" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
                Post a Job
              </Link>
            </div>
          )}
        </div>
        </div>

        {showEmployerUpgrade && (
          <div className="premium-card-light p-5 text-sm text-yellow-900">
            <p className="font-semibold">MVP candidates are available</p>
            <p className="mt-2">We currently have <span className="font-semibold">{mvpCount ?? 0}</span> verified MVP candidates. Upgrade to Pro to unlock full profile details and connect with them.</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="premium-card-light p-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-[#138d1a]" />
              <h2 className="text-lg font-semibold text-[#111827]">Employer Profile</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#5b6757]">
              {profile.headline || "Add a sharper employer headline and company context so every candidate sees a stronger first impression."}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#8a9482]">
              {[profile.name, profile.location, profile.company_name].filter(Boolean).join(" | ") || "Profile details still light"}
            </p>
            <Link href="/dashboard/employer/profile" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#138d1a] hover:text-[#0b7f14]">
              <PenSquare className="h-4 w-4" />
              Edit Employer Details
            </Link>
          </div>

          <div className="premium-card-light p-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#138d1a]" />
              <h2 className="text-lg font-semibold text-[#111827]">Pricing & Support</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#5b6757]">
              Need a richer hiring workflow or premium access? We&apos;re handling employer pricing through direct consultation for now.
            </p>
            <Link href="/dashboard/employer/upgrade" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#138d1a] hover:text-[#0b7f14]">
              Talk to Us About Pricing
            </Link>
          </div>

          <div className="premium-card-light p-6">
            <div className="flex items-center gap-3">
              <PenSquare className="h-5 w-5 text-[#138d1a]" />
              <h2 className="text-lg font-semibold text-[#111827]">Post Faster</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#5b6757]">
              Use the new guided posting flow with live preview to publish clearer job listings with less friction.
            </p>
            <Link href="/dashboard/employer/post-job" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#138d1a] hover:text-[#0b7f14]">
              Open Post a Job
            </Link>
          </div>
        </div>

        <PostedJobsSection initialJobs={(postedJobs || []) as PostedJobRow[]} />

        <div className="premium-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Tools & Resources Membership</h2>
              <p className="mt-1 text-sm text-[#cde3e1]/72">
                Employer or candidate, membership unlocks the full LXD Guild tools and resources library for one year.
              </p>
            </div>
            <Link
              href={membership.active ? "/dashboard/resources" : "/dashboard/membership"}
              className="premium-button premium-button-primary"
            >
              {membership.active ? "Open Resources" : "Get Membership"}
            </Link>
          </div>
        </div>

        {/* Candidate Search / Discovery */}

        <Suspense fallback={<CandidateDiscoveryFallback />}>
          <EmployerCandidatesPanel isFreePlan={isFreePlan} isProPlan={isProPlan} />
        </Suspense>
      </div>
    </div>
  );
}

async function EmployerCandidatesPanel({
  isFreePlan,
  isProPlan,
}: {
  isFreePlan: boolean;
  isProPlan: boolean;
}) {
  if (isFreePlan) {
    return <LockedCandidateDiscovery />;
  }

  const adminSupabase = createAdminReader();
  const candidateReader = adminSupabase ?? await createClient();
  const { data: mvpCandidates } = await candidateReader
    .from("profiles")
    .select(`
      id,
      name,
      designation_level,
      headline,
      candidates (
        latest_score
      ),
      resumes (
        id,
        file_url,
        file_name
      )
    `)
    .eq("role", "candidate_mvp")
    .limit(10);

  return (
    <div className="premium-card p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#cde3e1]/45" />
          <input
            type="text"
            placeholder="Search verified Instructional Designers, LXDs..."
            className="premium-input pl-10"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(mvpCandidates as EmployerCandidateCard[] | null)?.map((candidate) => (
          <div key={candidate.id} className="border border-white/10 bg-white/6 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold shrink-0">
                {candidate.name?.substring(0, 1) || "C"}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">{candidate.name || "Verified Candidate"}</h3>
                <p className="text-[#cde3e1]/72 text-sm">{candidate.designation_level || "Instructional Designer"}</p>
                {candidate.headline && (
                  <p className="text-[#cde3e1]/48 text-xs mt-0.5">{candidate.headline}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4 text-sm font-medium text-green-700 dark:text-green-500 bg-green-50 dark:bg-green-900/10 w-fit px-3 py-1 rounded-full border border-green-200 dark:border-green-900/30">
              Exam Score: {candidate.candidates?.[0]?.latest_score}%
            </div>

            {isProPlan ? (
              <div className="space-y-2">
                <Link
                  href={`/dashboard/employer/candidates/${candidate.id}`}
                  className="w-full inline-flex justify-center items-center gap-2 border border-white/10 rounded-lg bg-white/8 hover:bg-white/12 transition-colors text-sm font-medium py-2.5 text-white"
                >
                  View Full Profile
                </Link>
                {candidate.resumes?.[0]?.file_url ? (
                  <a
                    href={candidate.resumes[0].id ? `/api/resumes/${candidate.resumes[0].id}/download` : candidate.resumes[0].file_url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex justify-center items-center gap-2 border border-brand-200 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors text-sm font-medium py-2.5"
                  >
                    View Resume
                  </a>
                ) : (
                  <p className="text-xs text-[#cde3e1]/48 text-center">Resume not uploaded yet</p>
                )}
              </div>
            ) : (
              <button className="w-full py-2 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium text-white">
                View Full Profile
              </button>
            )}
          </div>
        ))}

        {mvpCandidates?.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#cde3e1]/72">
            No MVP Candidates available right now. Check back soon.
          </div>
        )}
      </div>
    </div>
  );
}

function LockedCandidateDiscovery() {
  return (
    <div className="premium-card p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#cde3e1]/45" />
          <input
            type="text"
            placeholder="Search verified Instructional Designers, LXDs..."
            className="premium-input pl-10"
            disabled
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="border border-white/10 bg-white/6 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold shrink-0">
                C
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">Verified Candidate</h3>
                <p className="text-[#cde3e1]/72 text-sm">Instructional Designer</p>
                <p className="text-[#cde3e1]/48 text-xs mt-0.5">Unlock Pro to view full candidate details.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4 text-sm font-medium text-green-700 dark:text-green-500 bg-green-50 dark:bg-green-900/10 w-fit px-3 py-1 rounded-full border border-green-200 dark:border-green-900/30">
              Verified MVP
            </div>
            <div className="absolute inset-0 bg-[#091737]/74 backdrop-blur-[2px] flex items-center justify-center transition-opacity">
              <Link href="/dashboard/employer/upgrade" className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-full font-medium shadow-lg">
                <Lock className="w-4 h-4" /> Unlock Profile
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CandidateDiscoveryFallback() {
  return (
    <div className="premium-card p-6">
      <div className="mb-6 h-11 rounded-2xl bg-white/6" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-white/10 bg-white/6 p-5">
            <div className="h-5 w-32 rounded bg-white/10" />
            <div className="mt-3 h-4 w-24 rounded bg-white/10" />
            <div className="mt-6 h-10 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function getPostedJobs(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const postedJobsQuery = await supabase
    .from("jobs")
    .select("id, title, company, location, created_at, apply_url, is_active, deletion_request_status, deleted_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!postedJobsQuery.error) {
    return withApplicantCounts(supabase, (postedJobsQuery.data || []) as PostedJobRow[]);
  }

  if (postedJobsQuery.error.code !== "42703") {
    return [];
  }

  const fallbackJobsQuery = await supabase
    .from("jobs")
    .select("id, title, company, location, created_at, apply_url, is_active")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return withApplicantCounts(
    supabase,
    ((fallbackJobsQuery.data || []).map((job) => ({
      ...job,
      deletion_request_status: null,
      deleted_at: null,
    })) as PostedJobRow[])
  );
}

async function getMvpCandidateCount(supabase: Awaited<ReturnType<typeof createClient>>) {
  const adminSupabase = createAdminReader();
  const countReader = adminSupabase ?? supabase;
  const { count } = await countReader
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "candidate_mvp");

  return count ?? 0;
}

function createAdminReader() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return serviceRoleKey && supabaseUrl
    ? createSupabaseClient(supabaseUrl, serviceRoleKey)
    : null;
}

async function withApplicantCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobs: PostedJobRow[]
) {
  if (jobs.length === 0) {
    return jobs;
  }

  const { data: applications } = await supabase
    .from("job_applications")
    .select("job_id")
    .in("job_id", jobs.map((job) => job.id));

  const counts = new Map<string, number>();
  for (const application of applications || []) {
    const jobId = application.job_id as string | undefined;
    if (!jobId) continue;
    counts.set(jobId, (counts.get(jobId) || 0) + 1);
  }

  return jobs.map((job) => ({
    ...job,
    applicant_count: counts.get(job.id) || 0,
  }));
}
