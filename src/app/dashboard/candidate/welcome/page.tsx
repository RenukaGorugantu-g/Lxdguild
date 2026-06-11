import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, MapPin, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { getJobBoardAccessForUser } from "@/lib/job-board-access";
import { loadProfile } from "@/lib/load-profile";
import { buildNoIndexMetadata } from "@/lib/seo";
import { getVerifiedBadgeLabel, selectMatchedJobs, type CandidateMatchJob } from "@/lib/candidate-job-matches";

export const metadata: Metadata = buildNoIndexMetadata(
  "Welcome to Your Dashboard",
  "See your first matched L&D jobs and continue onboarding inside your LXD Guild dashboard."
);

type WelcomeProfile = {
  name?: string | null;
  role?: string | null;
  candidate_target_role?: string | null;
  candidate_designation?: string | null;
};

const JOB_SELECT =
  "id, title, description, company, location, work_mode, employment_type, featured_rank, external_posted_at, imported_at, created_at, is_active, source, user_id";

export default async function CandidateWelcomePage(props: PageProps<"/dashboard/candidate/welcome">) {
  const searchParams = await props.searchParams;
  const justVerified = searchParams.verified === "1";
  const supabase = await createClient();
  const jobsReader = createAdminClient() ?? supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let profile = await loadProfile<WelcomeProfile>(
    supabase,
    user.id,
    "name, role, candidate_target_role, candidate_designation"
  );

  if (!profile) {
    const ensuredProfile = await ensureUserProfile(user);
    if (ensuredProfile) {
      profile = await loadProfile<WelcomeProfile>(
        supabase,
        user.id,
        "name, role, candidate_target_role, candidate_designation"
      );
    }
  }

  if (!profile) redirect("/dashboard");
  if (profile.role === "admin") redirect("/dashboard/admin");
  if (profile.role === "pro_member" || String(profile.role || "").startsWith("employer")) {
    redirect("/dashboard/employer");
  }
  if (!String(profile.role || "").startsWith("candidate")) {
    redirect("/dashboard");
  }

  const [access, jobsResult] = await Promise.all([
    getJobBoardAccessForUser(supabase, user.id, profile),
    jobsReader
      .from("jobs")
      .select(JOB_SELECT)
      .eq("is_active", true)
      .order("featured_rank", { ascending: true, nullsFirst: false })
      .order("external_posted_at", { ascending: false, nullsFirst: false })
      .order("imported_at", { ascending: false })
      .limit(24),
  ]);

  const matchedJobs = selectMatchedJobs(
    ((jobsResult.data || []) as CandidateMatchJob[]),
    profile.candidate_target_role,
    profile.candidate_designation,
    5
  );
  const targetRole = profile.candidate_target_role || "Instructional Designer";
  const firstName = (profile.name || user.email?.split("@")[0] || "there").trim().split(/\s+/)[0] || "there";
  const verifiedBadgeLabel = getVerifiedBadgeLabel(targetRole);

  return (
    <div className="marketing-page min-h-screen">
      <div className="marketing-section pt-28 pb-16">
        <div className="marketing-container space-y-8">
          <section className="marketing-panel p-6 sm:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="marketing-kicker">{justVerified ? "You&apos;re in" : "Welcome back"}</div>
                <h1 className="marketing-title mt-4 max-w-3xl text-5xl">
                  Here are your first 5 matched jobs, {firstName}.
                </h1>
                <p className="marketing-copy mt-4 max-w-2xl text-base leading-8">
                  {justVerified
                    ? "Your email is verified and your dashboard is unlocked. Start with these matched roles right away and use your free applications while momentum is high."
                    : "Your account is live. Start exploring roles right now, use your free applications first, and get verified when you want stronger visibility with hiring teams."}
                </p>
              </div>

              <div className="w-full max-w-[340px] rounded-[1.8rem] border border-[#d8e6d3] bg-white p-5 shadow-[0_18px_36px_rgba(94,119,74,0.08)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#15911b]">
                  {justVerified ? "Verified and live" : "Live now"}
                </p>
                <p className="mt-3 text-2xl font-bold text-[#111827]">
                  {access.freeApplicationsRemaining} free applications available right now
                </p>
                <p className="mt-2 text-sm leading-7 text-[#5f6d5b]">
                  No assessment needed to start. Browse roles first, then choose verification when you want premium access and a stronger trust signal.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/jobs" className="marketing-primary">
                Browse all jobs
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard/candidate" className="marketing-secondary">
                Open my dashboard
              </Link>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              {matchedJobs.map((job) => (
                <article key={job.id} className="marketing-grid-card p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-bold text-[#111827]">{job.title || "Matched role"}</h2>
                        <span className="rounded-full bg-[#eef8e8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#138d1a]">
                          Verified candidates preferred
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#5b6757]">
                        <span className="inline-flex items-center gap-1.5">
                          <BriefcaseBusiness className="h-4 w-4" />
                          {job.company || "L&D Employer"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {job.location || "India"}
                        </span>
                        {job.work_mode === "remote" ? (
                          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">Remote</span>
                        ) : null}
                      </div>
                    </div>

                    <Link href={`/dashboard/jobs/${job.id}`} className="marketing-secondary whitespace-nowrap">
                      View role
                    </Link>
                  </div>
                </article>
              ))}

              {matchedJobs.length === 0 ? (
                <article className="marketing-grid-card p-6">
                  <h2 className="text-xl font-bold text-[#111827]">Your matched roles are loading</h2>
                  <p className="mt-3 text-sm leading-7 text-[#5b6757]">
                    Your dashboard is ready. Open the job board to browse the latest L&amp;D opportunities while we sharpen the role matching.
                  </p>
                  <Link href="/dashboard/jobs" className="mt-5 inline-flex text-sm font-bold uppercase tracking-[0.16em] text-[#138d1a]">
                    Browse jobs
                  </Link>
                </article>
              ) : null}
            </div>

            <aside className="space-y-6">
              <div className="marketing-grid-card p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                  <BadgeCheck className="h-4 w-4 text-[#138d1a]" />
                  Get Verified
                </div>
                <p className="mt-4 text-2xl font-bold text-[#111827]">
                  Take the 10-min skill assessment and unlock premium roles.
                </p>
                <p className="mt-3 text-sm leading-7 text-[#5b6757]">
                  Earn your Verified L&amp;D badge, show stronger proof of capability, and move into the roles where employers prefer verified candidates.
                </p>
                <Link href="/dashboard/candidate/exam" className="marketing-primary mt-6">
                  Take the 10-min skill assessment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="marketing-grid-card p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Badge preview</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#eef8e8] px-4 py-2 text-sm font-semibold text-[#138d1a]">
                  <Sparkles className="h-4 w-4" />
                  {verifiedBadgeLabel}
                </div>
                <p className="mt-4 text-sm leading-7 text-[#5b6757]">
                  Your profile will show this badge to hiring managers across the marketplace once you complete verification.
                </p>
              </div>

              <div className="marketing-grid-card p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7d68]">How this helps</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[#5b6757]">
                  <li>You keep immediate access to your free applications.</li>
                  <li>Verification adds a stronger trust signal for employers.</li>
                  <li>Premium roles are easier to spot once your badge is live.</li>
                </ul>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}
