import Link from "next/link";
import { ArrowRight, BadgeCheck, FileText, Sparkles, Target, Trophy } from "lucide-react";
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
  const primaryLabel = isSignedInCandidate ? "Open Candidate Dashboard" : "Start as Candidate";
  const secondaryHref = isSignedInCandidate ? "/dashboard/candidate/exam" : "/membership";
  const secondaryLabel = isSignedInCandidate ? "Continue Candidate Journey" : "Explore Membership";

  const pillars = [
    {
      icon: BadgeCheck,
      title: "Verified credibility",
      copy: "Stand out with assessment-backed proof instead of blending into generic applicant pools.",
    },
    {
      icon: Trophy,
      title: "Career momentum",
      copy: "Move from onboarding to exam, scorecard, profile, and premium opportunities with a clearer path.",
    },
    {
      icon: FileText,
      title: "Premium resources",
      copy: "Unlock tools, templates, and growth assets that support your next role and stronger submissions.",
    },
  ];

  const steps = [
    "Create your Guild profile",
    "Take the skill validation exam",
    "Earn MVP visibility and unlock stronger-fit roles",
    "Use premium resources to keep improving",
  ];

  return (
    <div className="premium-shell">
      <main className="premium-content px-6 pb-24 pt-28">
        <div className="premium-container space-y-8">
          <section className="premium-hero px-7 py-10 sm:px-10 sm:py-14">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="premium-badge">
                  <Sparkles className="h-3.5 w-3.5 text-[#34cd2f]" />
                  {isSignedInCandidate ? "Candidate home" : "For candidates"}
                </div>
                <h1 className="premium-title mt-6 text-5xl sm:text-6xl">
                  {isSignedInCandidate
                    ? `Welcome back${profileName ? `, ${profileName}` : ""}. Your candidate home is ready.`
                    : "Build a candidate journey that feels premium from day one."}
                </h1>
                <p className="premium-copy mt-5 max-w-2xl text-lg leading-8">
                  {isSignedInCandidate
                    ? "Pick up where you left off with assessment progress, profile-building, job readiness, and membership benefits designed around your candidate path."
                    : "LXD Guild helps learning professionals validate real skills, become more discoverable to employers, and access a stronger support system around jobs, readiness, and resources."}
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link href={primaryHref} className="premium-button premium-button-primary">
                    {primaryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={secondaryHref} className="premium-button premium-button-secondary">
                    {secondaryLabel}
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="premium-metric sm:col-span-2">
                  <p className="premium-kicker">Candidate value</p>
                  <p className="mt-3 text-2xl font-bold text-white">
                    {isSignedInCandidate
                      ? "A cleaner signed-in home for your next candidate action."
                      : "A clearer path from skill proof to better opportunities."}
                  </p>
                </div>
                {(isSignedInCandidate
                  ? [
                      "Review your current candidate progress",
                      "Continue the assessment or check readiness",
                      "Strengthen your profile and applications",
                      "Use membership resources to level up faster",
                    ]
                  : steps
                ).map((step, index) => (
                  <div key={step} className="premium-metric">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#80ef7a]">Step {index + 1}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {pillars.map((item) => (
              <article key={item.title} className="premium-card-light p-7">
                <div className="glass-panel mb-6 flex h-14 w-14 items-center justify-center rounded-2xl">
                  <item.icon className="h-7 w-7 text-[#34cd2f]" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-950">{item.title}</h2>
                <p className="premium-light-copy mt-3 text-sm leading-7">{item.copy}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="premium-glass-section p-8">
              <div className="premium-badge">
                <Target className="h-3.5 w-3.5 text-[#5fd5ff]" />
                Candidate flow
              </div>
              <div className="mt-6 space-y-4">
                {[
                  isSignedInCandidate
                    ? "This page now works as your signed-in candidate home."
                    : "Landing page explains the path and builds trust.",
                  isSignedInCandidate
                    ? "Jump back into assessment, profile, and opportunity readiness."
                    : "Registration moves into candidate dashboard and assessment readiness.",
                  "Membership stays visible as an optional premium layer for support and resources.",
                ].map((point) => (
                  <div key={point} className="premium-metric text-white">
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card-light p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Best next step</p>
              <h2 className="mt-4 text-3xl font-bold text-zinc-950">Start free, then add membership when you want more support.</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-600">
                {isSignedInCandidate
                  ? "Your role is still candidate-first. Membership adds premium resource access on top, so you can keep moving through jobs and growth with stronger support."
                  : "Your base role stays candidate-focused. Membership simply adds premium resource access on top, so you can still apply for jobs while using the full toolkit."}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={primaryHref} className="premium-button premium-button-dark">
                  {primaryLabel}
                </Link>
                <Link href="/membership" className="premium-button border border-zinc-200 bg-white text-zinc-800">
                  View Membership Benefits
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
