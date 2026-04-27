import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  FileText,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getBaseRole } from "@/lib/profile-role";

export default async function CandidateLandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let baseRole: "candidate" | "employer" | "admin" | "visitor" = "visitor";
  let profileName: string | null = null;

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role, name").eq("id", user.id).single();
    baseRole = getBaseRole(profile);
    profileName = profile?.name ?? null;
  }

  const isSignedInCandidate = baseRole === "candidate";
  const primaryHref = isSignedInCandidate ? "/dashboard/candidate" : "/register?role=candidate";
  const secondaryHref = isSignedInCandidate ? "/dashboard/candidate/exam" : "/membership";

  const features = [
    {
      title: "Assessment-backed credibility",
      copy: "Stand out with validated capability instead of competing on generic resumes alone.",
      icon: BadgeCheck,
      accent: "bg-[#e9fde2] text-[#15911b]",
    },
    {
      title: "Stronger profile readiness",
      copy: "Move from raw profile setup to clearer positioning, richer proof, and better-fit opportunities.",
      icon: FileText,
      accent: "bg-[#f3f4ff] text-[#7281d0]",
    },
    {
      title: "Career momentum",
      copy: "Keep exam, scorecard, course suggestions, and premium support connected in one flow.",
      icon: Trophy,
      accent: "bg-[#ffe9ee] text-[#cc5c82]",
    },
  ];

  return (
    <div className="marketing-page">
      <main className="pt-32">
        <section className="marketing-section pb-16">
          <div className="marketing-container">
            <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-6">
                <div className="marketing-kicker">
                  <Sparkles className="h-3.5 w-3.5" />
                  {isSignedInCandidate ? "Candidate Home" : "Validation Track"}
                </div>
                <h1 className="marketing-title max-w-xl text-5xl sm:text-6xl">
                  {isSignedInCandidate
                    ? `Welcome back${profileName ? `, ${profileName}` : ""}. Keep your career momentum moving.`
                    : "Get verified, build confidence, and unlock stronger-fit opportunities."}
                </h1>
                <p className="marketing-copy max-w-xl text-base leading-8">
                  {isSignedInCandidate
                    ? "Return to your candidate home for exam progress, score insights, profile readiness, and next-step support."
                    : "Move through registration, assessment, recommendations, and profile growth in one cleaner candidate journey."}
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href={primaryHref} className="marketing-primary">
                    {isSignedInCandidate ? "Open Candidate Dashboard" : "Start as Candidate"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={secondaryHref} className="marketing-secondary">
                    {isSignedInCandidate ? "Continue Assessment" : "Explore Membership"}
                  </Link>
                </div>
              </div>

              <div className="marketing-panel p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="marketing-soft-card p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Validation Phase</p>
                    <p className="mt-3 text-4xl font-bold text-[#17a21c]">Skill Test</p>
                    <div className="mt-3 h-1.5 rounded-full bg-[#e2ecd8]">
                      <div className="h-1.5 w-[74%] rounded-full bg-[#23b61f]" />
                    </div>
                  </div>
                  <div className="marketing-soft-card p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Estimated Time</p>
                    <p className="mt-3 text-4xl font-bold text-[#111827]">45 Min</p>
                    <p className="mt-4 text-xs text-[#1da326]">Personalized by designation</p>
                  </div>
                </div>
                <div className="marketing-soft-card mt-4 p-4">
                  <p className="text-sm font-semibold text-[#111827]">Candidate Journey Flow</p>
                  <div className="mt-5 grid grid-cols-4 gap-3">
                    {[
                      { label: "Register", height: 36 },
                      { label: "Assess", height: 58 },
                      { label: "Improve", height: 46 },
                      { label: "Apply", height: 68 },
                    ].map((step, index) => (
                      <div key={step.label} className="space-y-2">
                        <div
                          className={`${index === 3 ? "bg-[#35d421]" : "bg-[#dff5d8]"} rounded-t-xl`}
                          style={{ height: `${step.height}px` }}
                        />
                        <p className="text-[11px] font-semibold text-[#62705f]">{step.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-14">
          <div className="marketing-container grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="marketing-grid-card p-7">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${feature.accent}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-[#111827]">{feature.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#5b6757]">{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section pb-16">
          <div className="marketing-container">
            <div className="mb-8 text-center">
              <h2 className="marketing-title text-4xl">Experience the fluid flow</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <article className="marketing-grid-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eafde2] text-[#15911b]">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#111827]">Verified Track</p>
                    <p className="text-xs text-[#5b6757]">Registration to assessment</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[#647061]">
                  <span className="rounded-full bg-[#eff8ea] px-3 py-1">Register</span>
                  <span className="rounded-full bg-[#eff8ea] px-3 py-1">Designation</span>
                  <span className="rounded-full bg-[#eff8ea] px-3 py-1">Validation</span>
                </div>
                <div className="mt-5 flex gap-2">
                  <button className="rounded-xl bg-[#34d11f] px-4 py-2 text-sm font-semibold text-white">Start</button>
                  <button className="rounded-xl border border-[#d7dfd0] px-4 py-2 text-sm font-semibold text-[#111827]">
                    Prepare
                  </button>
                </div>
              </article>
              <article className="marketing-grid-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold text-[#111827]">Scorecard View</p>
                  <Target className="h-4 w-4 text-[#15911b]" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-[#5b6757]">
                      <span>Readiness</span>
                      <span>84%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#e4eddc]">
                      <div className="h-2 w-[84%] rounded-full bg-[#34d11f]" />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-[#5b6757]">
                      <span>Profile Strength</span>
                      <span>76%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#e4eddc]">
                      <div className="h-2 w-[76%] rounded-full bg-[#b8d8b0]" />
                    </div>
                  </div>
                </div>
              </article>
              <article className="marketing-grid-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold text-[#111827]">Next Actions</p>
                  <BriefcaseBusiness className="h-4 w-4 text-[#cc5c82]" />
                </div>
                <div className="space-y-3 text-sm text-[#5b6757]">
                  <p>Assessment unlocks score-driven recommendations.</p>
                  <p>Course suggestions align to designation and performance tier.</p>
                  <p>Premium membership adds deeper support without changing your candidate role.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-16">
          <div className="marketing-container">
            <div className="mb-8">
              <h2 className="marketing-title text-4xl">Everything you need to move forward</h2>
              <p className="marketing-copy mt-3 max-w-2xl text-sm">
                A focused candidate platform for immediate clarity, prioritizing validation, readiness, and stronger-fit
                visibility.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <article className="marketing-grid-card p-8">
                <h3 className="text-3xl font-bold text-[#111827]">Role-first candidate experience</h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5b6757]">
                  The core path starts with your designation and assessment, then turns score signals into profile guidance,
                  course suggestions, and better next steps.
                </p>
                <div className="mt-8 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full border border-[#dbe3d5] px-4 py-2 text-[#557057]">Assessment Routing</span>
                  <span className="rounded-full border border-[#dbe3d5] px-4 py-2 text-[#557057]">Course Suggestions</span>
                  <span className="rounded-full border border-[#dbe3d5] px-4 py-2 text-[#557057]">Profile Readiness</span>
                </div>
              </article>
              <article className="rounded-[2rem] bg-[#32d61f] p-8 text-white shadow-[0_20px_50px_rgba(31,157,39,0.18)]">
                <BookOpen className="h-6 w-6" />
                <h3 className="mt-8 text-3xl font-bold">Membership fits on top, not instead.</h3>
                <p className="mt-4 text-sm leading-7 text-white/88">
                  Add premium templates, guided resources, and stronger prep support while keeping the same candidate identity.
                </p>
              </article>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <article className="marketing-grid-card p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                  <Target className="h-6 w-6 text-[#111827]" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-[#111827]">Score-led recommendations</h3>
                <p className="mt-3 text-sm leading-7 text-[#5b6757]">
                  Recommendations are matched to designation, set, and performance percentage.
                </p>
              </article>
              <article className="marketing-grid-card p-8">
                <p className="text-sm font-semibold text-[#111827]">Verified opportunity flow</p>
                <p className="mt-3 text-sm leading-7 text-[#5b6757]">
                  Build a more complete career path with better proof, cleaner positioning, and premium readiness resources.
                </p>
                <Link href={primaryHref} className="mt-5 inline-flex text-sm font-semibold text-[#15911b]">
                  {isSignedInCandidate ? "Open candidate workspace" : "Explore candidate path"}
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-20">
          <div className="marketing-container rounded-[2.25rem] bg-[radial-gradient(circle_at_top,rgba(137,222,119,0.18),transparent_40%),rgba(255,255,255,0.56)] px-8 py-14 text-center">
            <h2 className="marketing-title text-5xl">Ready to validate your next move?</h2>
            <p className="marketing-copy mx-auto mt-4 max-w-2xl text-sm">
              Start with your candidate flow, then add membership only when you want deeper support around the same journey.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={primaryHref} className="marketing-primary">
                {isSignedInCandidate ? "Open Candidate Hub" : "Create Candidate Account"}
              </Link>
              <Link href="/membership" className="marketing-secondary">
                View Membership
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
