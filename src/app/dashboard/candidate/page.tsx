import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  ChevronRight,
  FileText,
  Lock,
  PlayCircle,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { getJobBoardAccessForUser } from "@/lib/job-board-access";
import { getMembershipState } from "@/lib/membership";
import { isVerifiedCandidateRole } from "@/lib/profile-role";
import { loadProfile } from "@/lib/load-profile";
import CertificateUpload from "./certificate-upload";

type CandidateDashboardProfile = {
  name?: string | null;
  role?: string | null;
  membership_status?: string | null;
  membership_plan?: string | null;
  membership_expires_at?: string | null;
  [key: string]: unknown;
};

export default async function CandidateDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let profile: CandidateDashboardProfile | null = null;
  const needsMembershipHydration =
    !profile ||
    (profile.membership_status === undefined &&
      profile.membership_plan === undefined &&
      profile.membership_expires_at === undefined);

  if (needsMembershipHydration) {
    profile = await loadProfile<CandidateDashboardProfile>(
      supabase,
      user.id,
      "id, name, role, membership_status, membership_plan, membership_expires_at"
    );
  }

  if (!profile) {
    const ensuredProfile = await ensureUserProfile(user);
    if (ensuredProfile) {
      profile = await loadProfile<CandidateDashboardProfile>(
        supabase,
        user.id,
        "id, name, role, membership_status, membership_plan, membership_expires_at"
      );
    }
  }

  if (!profile) return <div>Loading profile...</div>;

  const [
    candidateResult,
    certificateResult,
    recentApplicationsResult,
    jobBoardAccess,
  ] = await Promise.all([
    supabase
      .from("candidates")
      .select("exam_status, pass_status, latest_score, reattempt_allowed")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("certificates")
      .select("status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("job_applications")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    getJobBoardAccessForUser(supabase, user.id, profile),
  ]);

  const candidate = candidateResult.data;
  const certificate = certificateResult.data;
  const recentApplications = recentApplicationsResult.data;

  const hasPassedExam = candidate?.pass_status === "pass";
  const hasFailedExam = candidate?.pass_status === "fail";
  const isVerified = isVerifiedCandidateRole(profile.role) && hasPassedExam;
  const membership = getMembershipState(profile);
  const {
    canViewJobBoard,
    canApplyToJobs,
    isFreeAccessCandidate,
    freeApplicationsRemaining,
    lockReason,
  } = jobBoardAccess;

  const examStarted = Boolean(candidate?.exam_status && candidate.exam_status !== "not_started");
  const examCompleted = candidate?.exam_status === "completed";

  const journey = [
    {
      title: "Register",
      caption: "Account created & verified",
      state: "completed",
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      title: "Skill Test",
      caption: "Validate your core competencies",
      state: examStarted ? "active" : "next",
      icon: <PlayCircle className="h-5 w-5" />,
    },
    {
      title: "Verified",
      caption: "Earn your Guild badge",
      state: isVerified ? "completed" : "locked",
      icon: <Lock className="h-5 w-5" />,
    },
    {
      title: "Hired",
      caption: "Land your dream position",
      state: "locked",
      icon: <Star className="h-5 w-5" />,
    },
  ] as const;

  const examTitle =
    hasFailedExam
      ? "Learning Path Required"
      : isVerified
        ? "Validation Complete"
        : examCompleted
          ? "Assessment Reviewed"
          : "Skill Validation Exam";

  const examCopy =
    hasFailedExam
      ? `You scored ${candidate?.latest_score ?? 0}%. Submit a course completion certificate to unlock your reattempt.`
      : isVerified
        ? `You scored ${candidate?.latest_score ?? 0}%. Your profile is now visible for stronger-fit opportunities.`
        : "Our assessment measures your practical L&D readiness and unlocks recommendations, resources, and marketplace access.";

  return (
    <div className="marketing-page min-h-screen">
      <div className="marketing-section pt-32 pb-16">
        <div className="marketing-container space-y-12">
          <section className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <h1 className="marketing-title max-w-3xl text-5xl sm:text-6xl">Welcome back, {profile.name}.</h1>
              <p className="marketing-copy max-w-2xl text-base leading-8">
                Your career trajectory is in motion. You&apos;re currently in the{" "}
                <span className="font-semibold text-[#138d1a]">
                  {isVerified ? "Verified" : examStarted ? "Validation" : "Registration"}
                </span>{" "}
                phase. Complete the right next step to unlock stronger-fit roles, premium resources, and cleaner visibility.
              </p>
            </div>

            <div className="marketing-panel p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="marketing-soft-card p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Latest Score</p>
                  <p className="mt-3 text-4xl font-bold text-[#17a21c]">
                    {candidate?.latest_score ? `${candidate.latest_score}%` : "--"}
                  </p>
                  <div className="mt-3 h-1.5 rounded-full bg-[#e2ecd8]">
                    <div
                      className="h-1.5 rounded-full bg-[#23b61f]"
                      style={{ width: `${Math.max(Math.min(candidate?.latest_score ?? 0, 100), 12)}%` }}
                    />
                  </div>
                </div>
                <div className="marketing-soft-card p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Applications</p>
                  <p className="mt-3 text-4xl font-bold text-[#111827]">{recentApplications?.length ?? 0}</p>
                  <p className="mt-4 text-xs text-[#1da326]">
                    {canApplyToJobs
                      ? isFreeAccessCandidate
                        ? `${freeApplicationsRemaining} free applications remaining`
                        : "Marketplace unlocked"
                      : lockReason || "Complete assessment to unlock"}
                  </p>
                </div>
              </div>
              <div className="marketing-soft-card mt-4 p-4">
                <p className="text-sm font-semibold text-[#111827]">Candidate Progress</p>
                <div className="mt-5 grid grid-cols-4 gap-3">
                  {[34, 52, 28, 68].map((height, index) => (
                    <div
                      key={index}
                      className={`${index === 1 ? "bg-[#35d421]" : "bg-[#dff5d8]"} rounded-t-xl`}
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#138d1a]" />
              <h2 className="text-3xl font-bold text-[#111827]">Your Journey</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {journey.map((step) => {
                const isCompleted = step.state === "completed";
                const isActive = step.state === "active";
                const isLocked = step.state === "locked";
                return (
                  <article
                    key={step.title}
                    className={`rounded-[1.9rem] border p-7 shadow-[0_16px_40px_rgba(87,108,67,0.08)] ${
                      isActive
                        ? "border-[#8fd97e] bg-white ring-2 ring-[#a9e99d]/70"
                        : isLocked
                          ? "border-[#e7ece2] bg-white/72 text-[#b4bdb0]"
                          : "border-[#d8e6d3] bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          isCompleted
                            ? "bg-[#138d1a] text-white"
                            : isActive
                              ? "bg-[#138d1a] text-white"
                              : "bg-[#ecf1e7] text-[#a0aa9b]"
                        }`}
                      >
                        {step.icon}
                      </div>
                      <p
                        className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                          isCompleted ? "text-[#138d1a]" : isActive ? "text-[#138d1a]" : "text-[#b4bdb0]"
                        }`}
                      >
                        {isCompleted ? "Completed" : isActive ? "In Progress" : "Locked"}
                      </p>
                    </div>
                    <h3 className={`mt-8 text-2xl font-bold ${isLocked ? "text-[#bac1b8]" : "text-[#111827]"}`}>{step.title}</h3>
                    <p className={`mt-3 text-base leading-7 ${isLocked ? "text-[#c4cbc2]" : "text-[#647061]"}`}>{step.caption}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.55fr]">
            <article className="marketing-grid-card p-8">
              <div className="grid gap-8 md:grid-cols-[260px_1fr] md:items-start">
                <div className="rounded-[1.8rem] bg-[#19324b] p-6 text-white shadow-[0_22px_44px_rgba(15,23,42,0.2)]">
                  <div className="mx-auto flex h-40 w-full items-center justify-center rounded-[1.4rem] bg-[#224463]">
                    <FileText className="h-16 w-16 text-[#b7ffd0]" />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#eaf8e3] px-4 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#138d1a]">
                      Priority Task
                    </span>
                    <span className="text-sm font-medium text-[#7a8577]">
                      {candidate?.pass_status === "fail" ? "Course proof required" : "45 mins estimated"}
                    </span>
                  </div>

                  <h3 className="mt-5 text-4xl font-bold text-[#111827]">{examTitle}</h3>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-[#5b6757]">{examCopy}</p>

                  <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                    {hasFailedExam ? (
                      certificate?.status === "pending" ? (
                        <div className="rounded-full bg-[#eef4ea] px-6 py-4 text-sm font-semibold text-[#5b6757]">
                          Certificate under review
                        </div>
                      ) : candidate.reattempt_allowed ? (
                        <Link href="/dashboard/candidate/exam" className="marketing-primary">
                          Reattempt Exam
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <div className="w-full max-w-sm">
                          <CertificateUpload userId={user.id} />
                        </div>
                      )
                    ) : isVerified ? (
                      <Link href="/dashboard/candidate/scorecard" className="marketing-primary">
                        View Scorecard
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link href="/dashboard/candidate/exam" className="marketing-primary">
                        {examCompleted ? "Continue Review" : "Start Exam"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}

                    <Link
                      href={membership.active ? "/dashboard/resources" : "/dashboard/membership"}
                      className="marketing-secondary"
                    >
                      {membership.active ? "Open Resources" : "Prepare First"}
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            <div className="space-y-6">
              <DashboardSideCard
                href="/dashboard/candidate/profile"
                icon={<User className="h-5 w-5" />}
                accent="bg-[#e9ecff] text-[#6877d3]"
                title="Professional Profile"
                copy="Keep your profile polished and employer-ready."
              />

              <DashboardSideCard
                href="/dashboard/candidate/applications"
                icon={<Briefcase className="h-5 w-5" />}
                accent="bg-[#eaf8e3] text-[#138d1a]"
                title="My Applications"
                copy={
                  recentApplications?.length
                    ? `${recentApplications.length} active tracking update${recentApplications.length > 1 ? "s" : ""}`
                    : "See all role applications and their status."
                }
              />

              <article className="rounded-[1.9rem] border border-[#dde7d8] bg-[radial-gradient(circle_at_top,rgba(181,231,157,0.25),transparent_50%),rgba(255,255,255,0.85)] p-7 shadow-[0_16px_40px_rgba(87,108,67,0.08)]">
                <h3 className="text-2xl font-bold text-[#111827]">Market Insight</h3>
                <p className="mt-4 text-base leading-7 text-[#5b6757]">
                  {canViewJobBoard
                    ? "Based on your progress, new marketplace roles are now aligned to your profile."
                    : "Complete validation to unlock stronger-fit opportunities and premium marketplace access."}
                </p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#e8eef5]" />
                    <div>
                      <p className="font-semibold text-[#111827]">Learning Experience Designer</p>
                      <p className="text-sm text-[#96a193]">Guild Talent Network • Remote</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#e8eef5]" />
                    <div>
                      <p className="font-semibold text-[#111827]">Instructional Designer</p>
                      <p className="text-sm text-[#96a193]">Capability Studio • Hybrid</p>
                    </div>
                  </div>
                </div>
                <Link
                  href={canViewJobBoard ? "/dashboard/jobs" : "/dashboard/candidate/exam"}
                  className="mt-8 inline-flex text-sm font-bold uppercase tracking-[0.16em] text-[#138d1a]"
                >
                  {canViewJobBoard ? "View all opportunities" : "Unlock marketplace"}
                </Link>
              </article>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DashboardSideCard({
  href,
  icon,
  accent,
  title,
  copy,
}: {
  href: string;
  icon: React.ReactNode;
  accent: string;
  title: string;
  copy: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[1.9rem] border border-[#dde7d8] bg-white px-7 py-6 shadow-[0_16px_40px_rgba(87,108,67,0.08)] transition hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>{icon}</div>
        <div>
          <h3 className="text-2xl font-bold text-[#111827]">{title}</h3>
          <p className="mt-1 text-sm text-[#7f8a7b]">{copy}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-[#c2c8be]" />
    </Link>
  );
}
