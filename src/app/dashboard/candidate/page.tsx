import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  BriefcaseBusiness,
  CheckCircle,
  ChevronRight,
  FileText,
  Lock,
  MapPin,
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
  candidate_target_role?: string | null;
  experience_years?: number | null;
  membership_status?: string | null;
  membership_plan?: string | null;
  membership_expires_at?: string | null;
  [key: string]: unknown;
};

function getMarketplaceRoleSuggestions(profile: CandidateDashboardProfile, canViewJobBoard: boolean) {
  if (!canViewJobBoard) {
    return [
      {
        title: "Unlock L&D role matches",
        subtitle: "Complete validation to activate curated marketplace suggestions",
        icon: Lock,
        accent: "bg-[#eef4ea] text-[#7c8778]",
      },
      {
        title: "Prepare your next move",
        subtitle: "ATS guidance and role-fit visibility will open after assessment",
        icon: Sparkles,
        accent: "bg-[#eef4ea] text-[#7c8778]",
      },
    ];
  }

  const years = typeof profile.experience_years === "number" ? profile.experience_years : 0;
  const target = (profile.candidate_target_role || "").toLowerCase();

  if (years >= 8 || target.includes("manager") || target.includes("strategist") || target.includes("head")) {
    return [
      {
        title: "Learning Program Manager",
        subtitle: "Guild Leadership Network • Strategic L&D growth",
        icon: BriefcaseBusiness,
        accent: "bg-[#eaf8e3] text-[#138d1a]",
      },
      {
        title: "Capability Lead",
        subtitle: "Enterprise Learning Studio • Cross-functional",
        icon: Sparkles,
        accent: "bg-[#edf1ff] text-[#5b6fd6]",
      },
    ];
  }

  if (years >= 3 || target.includes("designer") || target.includes("developer") || target.includes("curriculum")) {
    return [
      {
        title: "Learning Experience Designer",
        subtitle: "Guild Talent Network • Remote",
        icon: Sparkles,
        accent: "bg-[#eaf8e3] text-[#138d1a]",
      },
      {
        title: "Instructional Designer",
        subtitle: "Capability Studio • Hybrid",
        icon: BriefcaseBusiness,
        accent: "bg-[#edf1ff] text-[#5b6fd6]",
      },
    ];
  }

  return [
    {
      title: "Learning Coordinator",
      subtitle: "Guild Starter Roles • Early-career pathway",
      icon: MapPin,
      accent: "bg-[#fff2e8] text-[#d97706]",
    },
    {
      title: "Instructional Design Associate",
      subtitle: "Capability Studio • Entry-level L&D track",
      icon: BriefcaseBusiness,
      accent: "bg-[#eaf8e3] text-[#138d1a]",
    },
  ];
}

export default async function CandidateDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let profile = await loadProfile<CandidateDashboardProfile>(
      supabase,
      user.id,
      "id, name, role, candidate_target_role, experience_years, membership_status, membership_plan, membership_expires_at"
    );

  if (!profile) {
    const ensuredProfile = await ensureUserProfile(user);
    if (ensuredProfile) {
      profile = await loadProfile<CandidateDashboardProfile>(
        supabase,
        user.id,
        "id, name, role, candidate_target_role, experience_years, membership_status, membership_plan, membership_expires_at"
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
  const isVerified = isVerifiedCandidateRole(profile.role);
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
  const hasScorecard = examCompleted || typeof candidate?.latest_score === "number";
  const marketSuggestions = getMarketplaceRoleSuggestions(profile, canViewJobBoard);
  const firstName = (profile.name || user.email?.split("@")[0] || "there").trim().split(/\s+/)[0] || "there";

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
    isVerified
      ? "You’re Verified"
      : hasFailedExam
        ? "You’re Closer Than You Think"
        : examCompleted
          ? "Your Validation Result Is Ready"
          : "Your Next Best Step";

  const examCopy =
    isVerified
      ? `You scored ${candidate?.latest_score ?? 0}%, and your profile is now visible for stronger-fit L&D opportunities across the Guild.`
      : hasFailedExam
        ? `You scored ${candidate?.latest_score ?? 0}%. That’s enough signal for us to show you exactly what to improve next. Complete the recommended course path and submit your certificate to unlock a reattempt.`
        : "Take the skill validation assessment to unlock ATS insights, stronger employer visibility, and clearer role-fit guidance. It’s the fastest way to turn your profile into real momentum.";

  const candidateExamTitle =
    isVerified
      ? `You did it, ${firstName}!`
      : hasFailedExam
        ? `Hey ${firstName}, you're so close!`
        : examCompleted
          ? `You're almost there, ${firstName}.`
          : "Your next best step";

  const candidateExamCopy =
    isVerified
      ? `You scored ${candidate?.latest_score ?? 0}%, and your profile is now visible for stronger-fit L&D opportunities across the Guild.`
      : hasFailedExam
        ? "You're just one step away from getting verified. Take the skill test today and unlock the full Guild experience - it's worth it."
        : examCompleted
          ? "Your result is ready. Review your scorecard, follow the suggested learning path, and come back stronger for the next step."
          : "Take the skill validation assessment to unlock ATS insights, stronger employer visibility, and clearer role-fit guidance. It's the fastest way to turn your profile into real momentum.";

  return (
    <div className="marketing-page min-h-screen">
      <div className="marketing-section pt-32 pb-16">
        <div className="marketing-container space-y-12">
          <section className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <h1 className="marketing-title max-w-3xl text-5xl sm:text-6xl">Welcome back, {profile.name}.</h1>
              <p className="marketing-copy max-w-2xl text-base leading-8">
                Your profile is live and you&apos;re officially on your way. Right now you&apos;re in the{" "}
                <span className="font-semibold text-[#138d1a]">
                  {isVerified ? "Verified" : examStarted ? "Validation" : "Registration"}
                </span>{" "}
                phase. Every step you complete improves how you appear to employers and brings the right opportunities closer.
              </p>
              {!isVerified ? (
                <div className="max-w-2xl rounded-[1.5rem] border border-[#d8e6d3] bg-white px-4 py-4 shadow-[0_16px_34px_rgba(94,119,74,0.08)] sm:px-5">
                  <div className="flex flex-col gap-4 sm:gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#15911b]">
                        First milestone
                      </p>
                      <p className="mt-2 text-base font-semibold text-[#111827] sm:text-lg">
                        You have 15 free job applications to get started.
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#5f6d5b] sm:text-[15px]">
                        Pass the skill assessment to unlock access to all jobs, ATS insights, and stronger employer visibility across the Guild.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        href="/dashboard/candidate/exam"
                        className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#118118,#2aa82b)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(24,124,29,0.16)] transition-all hover:translate-y-[-1px]"
                      >
                        Take Skill Assessment
                      </Link>
                      <Link
                        href="/dashboard/jobs"
                        className="inline-flex items-center justify-center rounded-full border border-[#d7e4d1] bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#eef5e5]"
                      >
                        View Jobs
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-4 border-t border-[#dde7d8] pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border-b border-[#dde7d8] pb-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Profile momentum</p>
                  <p className="mt-3 text-4xl font-bold text-[#17a21c]">{candidate?.latest_score ? `${candidate.latest_score}%` : "--"}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-[#e2ecd8]">
                    <div
                      className="h-1.5 rounded-full bg-[#23b61f]"
                      style={{ width: `${candidate?.latest_score ? Math.max(Math.min(candidate.latest_score, 100), 12) : 18}%` }}
                    />
                  </div>
                  {!candidate?.latest_score && (
                    <p className="mt-3 text-xs text-[#7a8577]">Your score and guidance will appear here after your first completed assessment.</p>
                  )}
                </div>
                <div className="border-b border-[#dde7d8] pb-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Job access</p>
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
              <div className="pt-1">
                <p className="text-sm font-semibold text-[#111827]">Your next milestones</p>
                <div className="mt-5 rounded-[1.5rem] border border-[#dde7d8] bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    {journey.map((step, index) => {
                      const isCurrent = step.state === "active";
                      const isDone = step.state === "completed";
                      return (
                        <div key={step.title} className="flex min-w-0 flex-1 items-center gap-2">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${isDone || isCurrent ? "border-[#23b61f] bg-[#eaf8e3] text-[#138d1a]" : "border-[#dbe6d6] bg-[#f5f7f2] text-[#a0aa9b]"}`}>
                            {step.icon}
                          </div>
                          {index < journey.length - 1 && <div className={`h-[3px] flex-1 rounded-full ${isDone ? "bg-[#23b61f]" : "bg-[#dfe7d8]"}`} />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {journey.map((step) => (
                      <div key={step.title} className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#111827]">{step.title}</p>
                        <p className="mt-1 text-xs leading-5 text-[#7a8577]">{step.caption}</p>
                      </div>
                    ))}
                  </div>
                  {!isVerified ? (
                    <div className="mt-5 rounded-[1.2rem] bg-[#f7fbf3] px-4 py-3 text-sm leading-6 text-[#52614f]">
                      Every step you complete improves how you appear to employers. Your next milestone: take the skill assessment. It usually takes about 20 minutes.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.55fr]">
            <article className="border-t border-[#dde7d8] pt-8">
              <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
                <div className="rounded-[1.6rem] bg-[#19324b] p-5 text-white shadow-[0_16px_28px_rgba(15,23,42,0.14)]">
                  <div className="mx-auto flex h-32 w-full items-center justify-center rounded-[1.2rem] bg-[#224463]">
                    <FileText className="h-16 w-16 text-[#b7ffd0]" />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#eaf8e3] px-4 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#138d1a]">
                      Recommended next move
                    </span>
                    <span className="text-sm font-medium text-[#7a8577]">
                      {candidate?.pass_status === "fail" ? "Course proof required" : "45 mins estimated"}
                    </span>
                  </div>

                  <h3 className="mt-5 text-4xl font-bold text-[#111827]">{candidateExamTitle}</h3>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-[#5b6757]">{candidateExamCopy}</p>

                  <div className="mt-8 flex flex-col gap-4">
                    {!isVerified && hasFailedExam ? (
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
                        <div className="w-full max-w-2xl">
                          <CertificateUpload userId={user.id} />
                        </div>
                      )
                    ) : isVerified || hasScorecard ? (
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
                      className={`${
                        !isVerified && hasFailedExam && !candidate.reattempt_allowed && certificate?.status !== "pending"
                          ? "inline-flex w-full max-w-2xl items-center justify-between rounded-[1.4rem] border border-[#d9e4d2] bg-white px-5 py-4 text-left shadow-[0_12px_26px_rgba(87,108,67,0.08)] transition hover:border-[#bdd5b3] hover:bg-[#f8fbf6]"
                          : "marketing-secondary"
                      }`}
                    >
                      {!isVerified && hasFailedExam && !candidate.reattempt_allowed && certificate?.status !== "pending" ? (
                        <>
                          <span>
                            <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#7a8577]">
                              Next Step
                            </span>
                            <span className="mt-1 block text-base font-semibold text-[#111827]">
                              {membership.active ? "Open Resources" : "Prepare First"}
                            </span>
                          </span>
                          <ArrowRight className="h-4 w-4 text-[#138d1a]" />
                        </>
                      ) : (
                        <>
                          {membership.active ? "Open Resources" : "Prepare First"}
                        </>
                      )}
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

              <article className="border-t border-[#dde7d8] px-0 pt-6">
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
      className="flex items-center justify-between border-t border-[#dde7d8] px-0 py-6 transition hover:-translate-y-0.5"
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
