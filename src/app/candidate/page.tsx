import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, BriefcaseBusiness, Sparkles, Target } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getBaseRole } from "@/lib/profile-role";

const journeySteps = [
  {
    step: "01",
    title: "Profile creation",
    copy: "Build your verified identity with designation, resume, and proof of capability.",
  },
  {
    step: "02",
    title: "AI diagnosis",
    copy: "Turn your resume and profile into clear signals, strengths, and improvement areas.",
  },
  {
    step: "03",
    title: "Validation",
    copy: "Use assessments and scorecards to create stronger proof for recruiters and hiring teams.",
  },
  {
    step: "04",
    title: "Precision placement",
    copy: "Move toward stronger-fit roles with ATS insight, readiness support, and better targeting.",
  },
] as const;

const expertiseTiles = [
  { title: "Live scorecards", value: "94%", width: "94%", kind: "score" },
  { title: "Designation-based tracks", value: "12", width: "76%", kind: "track" },
  { title: "Resume optimizer", value: "+18%", width: "82%", kind: "lift" },
  { title: "Opportunity matching", value: "42", width: "88%", kind: "match" },
] as const;

const uspPoints = [
  {
    eyebrow: "Resume analyzer",
    title: "See how strong your resume really is.",
    copy:
      "Upload a resume and get a readiness score, ATS-facing signals, clearer strengths, and the exact areas you should improve next.",
    stats: [
      ["Resume score", "93%"],
      ["ATS readiness", "88%"],
    ],
  },
  {
    eyebrow: "Skill-gap engine",
    title: "Know what to strengthen before you apply.",
    copy:
      "We detect visible skills, missing signals, and the next capabilities that would improve how employers and ATS systems read your profile.",
    stats: [
      ["Detected skills", "21"],
      ["Focus areas", "4"],
    ],
  },
  {
    eyebrow: "Resume optimizer",
    title: "Turn weak positioning into cleaner ATS fit.",
    copy:
      "Generate stronger summary language, better bullet points, cleaner skills sections, and formatting that is easier for employers to scan.",
    stats: [
      ["Projected lift", "+18%"],
      ["Cleaner bullets", "Ready"],
    ],
  },
  {
    eyebrow: "Career path predictor",
    title: "Map the most realistic next move.",
    copy:
      "Use your resume and current skills to predict adjacent L&D roles, the skill gaps behind them, and the timeline to get there.",
    stats: [
      ["Next paths", "2-3"],
      ["Timeline", "0-6 mo"],
    ],
  },
] as const;

const actionEngine = [
  "ATS score and match context",
  "Resume rewrite suggestions",
  "Cover letter generation",
  "Academy course recommendations",
] as const;

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
  const secondaryHref = isSignedInCandidate ? "/dashboard/candidate/exam" : "/register?role=candidate&intent=skill-validation";

  return (
    <div className="marketing-page">
      <main className="pt-22 sm:pt-24">
        <section className="marketing-section pb-14 pt-3">
          <div className="marketing-container">
            <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="space-y-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7a8773]">
                  Candidate career system
                </div>
                <h1 className="marketing-title max-w-2xl text-[3.2rem] leading-[0.96] sm:text-[4.3rem]">
                  {isSignedInCandidate
                    ? `Your AI-powered career growth platform${profileName ? `, ${profileName}` : ""}.`
                    : "Your AI-powered career growth platform for L&D."}
                </h1>
                <p className="marketing-copy max-w-2xl text-base leading-8">
                  Understand how hiring teams see you, validate your strengths, improve your resume, and move toward
                  better-fit opportunities with one connected candidate ecosystem.
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full border border-[#dbe6d6] bg-white/90 px-4 py-2 text-[#51604d] shadow-[0_10px_24px_rgba(87,108,67,0.06)]">
                    Resume analyzer
                  </span>
                  <span className="rounded-full border border-[#dbe6d6] bg-white/90 px-4 py-2 text-[#51604d] shadow-[0_10px_24px_rgba(87,108,67,0.06)]">
                    ATS insights
                  </span>
                  <span className="rounded-full border border-[#dbe6d6] bg-white/90 px-4 py-2 text-[#51604d] shadow-[0_10px_24px_rgba(87,108,67,0.06)]">
                    Career path prediction
                  </span>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href={primaryHref} className="marketing-primary rounded-full px-6">
                    {isSignedInCandidate ? "Open candidate hub" : "Start as candidate"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={secondaryHref} className="marketing-secondary rounded-full px-6">
                    {isSignedInCandidate ? "Skill validation" : "Start skill validation"}
                  </Link>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbf1_100%)] p-4 shadow-[0_24px_60px_rgba(87,108,67,0.08)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,205,47,0.08),transparent_28%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(95,213,255,0.06),transparent_24%)]" />
                <div className="relative min-h-[470px] overflow-hidden rounded-[1.7rem] border border-[#102028] bg-[#10161d] shadow-[0_18px_44px_rgba(15,23,42,0.14)]">
                  <Image
                    src="/landing-candidate-human.png"
                    alt="Candidate using AI-powered career tools"
                    fill
                    sizes="(max-width: 1024px) 100vw, 620px"
                    className="object-cover object-[center_28%]"
                    priority
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,14,19,0.06),rgba(7,14,19,0.58))]" />
                  <div className="absolute inset-x-4 bottom-4 rounded-[1.3rem] border border-white/10 bg-[rgba(8,17,24,0.72)] px-4 py-4 text-white backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9be6a1]">Candidate insight layer</p>
                    <p className="mt-2 max-w-lg text-sm leading-7 text-white/80">
                      Diagnose positioning gaps, strengthen proof, and improve your application materials before you enter the market.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#121514] px-6 py-14 text-white">
          <div className="marketing-container">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">The journey to career mastery</h2>
            </div>
            <div className="mt-10 grid gap-8 lg:grid-cols-4">
              {journeySteps.map((step, index) => (
                <article key={step.step} className="relative text-center">
                  {index < journeySteps.length - 1 ? (
                    <div className="absolute left-[calc(100%-0.5rem)] top-5 hidden h-px w-14 border-t border-dashed border-white/16 lg:block" />
                  ) : null}
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[11px] font-bold uppercase tracking-[0.2em] text-[#111827]">
                    {step.step}
                  </div>
                  <h3 className={`mt-5 text-xl font-semibold ${index === journeySteps.length - 1 ? "text-[#5dec61]" : "text-white"}`}>
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/64">{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section pb-16 pt-16">
          <div className="marketing-container">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7b8775]">Why candidates choose LXD Guild</p>
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">
                More than a profile builder. It is a candidate action engine.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[#5b6757]">
                Instead of only storing your information, the platform actively diagnoses your resume, scores readiness,
                suggests what to improve, and turns that insight into clearer next actions.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {uspPoints.slice(0, 2).map((point, index) => (
                <article
                  key={point.title}
                  className={`overflow-hidden rounded-[2rem] border p-6 shadow-[0_20px_50px_rgba(87,108,67,0.08)] ${
                    index % 2 === 0
                      ? "border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f6faef_100%)]"
                      : "border-[#132019] bg-[#101713] text-white"
                  }`}
                >
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.22em] ${
                      index % 2 === 0 ? "text-[#7b8775]" : "text-[#9ee7a9]"
                    }`}
                  >
                    {point.eyebrow}
                  </p>
                  <h3 className={`mt-3 text-3xl font-semibold leading-tight ${index % 2 === 0 ? "text-[#111827]" : "text-white"}`}>
                    {point.title}
                  </h3>
                  <p className={`mt-4 text-sm leading-7 ${index % 2 === 0 ? "text-[#5b6757]" : "text-white/72"}`}>{point.copy}</p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {point.stats.map(([label, value]) => (
                      <div
                        key={label}
                        className={`rounded-[1.35rem] px-4 py-4 ${
                          index % 2 === 0 ? "bg-white shadow-[0_10px_24px_rgba(87,108,67,0.06)]" : "bg-white/6"
                        }`}
                      >
                        <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${index % 2 === 0 ? "text-[#7b8775]" : "text-white/55"}`}>
                          {label}
                        </p>
                        <p className={`mt-2 text-2xl font-semibold ${index % 2 === 0 ? "text-[#16921d]" : "text-[#6af06a]"}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section pb-16 pt-16">
          <div className="marketing-container rounded-[2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f6faef_100%)] p-7 shadow-[0_20px_50px_rgba(87,108,67,0.08)]">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b8775]">Candidate insight system</p>
                <h2 className="mt-3 text-4xl font-semibold text-[#111827]">See where your career can go next.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f6b5a]">
                  Use assessments, AI analysis, and role-fit signals to understand what you should improve, what roles are
                  realistic next, and how to move toward better-fit opportunities with stronger positioning.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    "Role-fit guidance",
                    "Career path prediction",
                    "Opportunity matching",
                    "Stronger applications",
                  ].map((item) => (
                    <div key={item} className="rounded-[1.3rem] border border-[#e1eadb] bg-white px-4 py-4 text-sm font-medium text-[#30402d] shadow-[0_10px_24px_rgba(87,108,67,0.06)]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.7rem] bg-[#101713] p-6 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a7efad]">Placement intelligence</p>
                <div className="mt-5 space-y-4">
                  {[
                    ["See where you stand", "Understand ATS fit, missing signals, and clearer next actions."],
                    ["Build stronger proof", "Use scorecards, resume optimization, and guided support."],
                    ["Move with precision", "Apply with better targeting instead of guesswork."],
                  ].map(([title, copy]) => (
                    <div key={title} className="rounded-[1.3rem] border border-white/10 bg-white/6 px-4 py-4">
                      <p className="font-semibold text-white">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/70">{copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-16">
          <div className="marketing-container">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <article className="relative overflow-hidden rounded-[2rem] border border-[#112019] bg-[#0f1712] p-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                <Image
                  src="/landing-candidate-human.png"
                  alt="Candidate AI upgrade workflow"
                  fill
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="object-cover object-center opacity-25"
                />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a7efad]">USP stack</p>
                  <h3 className="mt-3 text-3xl font-semibold leading-tight">Resume intelligence that turns into action.</h3>
                  <div className="mt-8 space-y-4">
                    {[
                      ["Analyze resume", "Score strengths, missing signals, ATS readiness."],
                      ["Fix the resume", "Rewrite bullets, summary, and skills section."],
                      ["Generate support", "Create cover letters and learning suggestions."],
                    ].map(([title, copy]) => (
                      <div key={title} className="rounded-[1.3rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-sm">
                        <p className="font-semibold text-white">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-white/70">{copy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <article className="overflow-hidden rounded-[2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f5faef_100%)] p-7 shadow-[0_20px_50px_rgba(87,108,67,0.08)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b8775]">From insight to execution</p>
                <h2 className="mt-3 text-4xl font-semibold text-[#111827]">One candidate workflow, multiple upgrade layers.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5b6757]">
                  Your profile does not stop at a score. Once the system reads your resume, it can immediately help you
                  rewrite it, generate a cover letter, suggest LXD Guild academy directions, and predict the next role you
                  can realistically grow into.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {actionEngine.map((item) => (
                    <div key={item} className="rounded-[1.35rem] border border-[#e1eadb] bg-white px-4 py-4 text-sm font-medium text-[#30402d] shadow-[0_10px_24px_rgba(87,108,67,0.06)]">
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-20">
          <div className="marketing-container overflow-hidden rounded-[2.3rem] bg-[linear-gradient(135deg,#32d61f_0%,#22b91f_100%)] px-8 py-10 shadow-[0_24px_60px_rgba(31,157,39,0.2)]">
            <div className="grid items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="text-[#07131f]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#0a3b11]">Expertise engine</p>
                <h2 className="mt-3 text-5xl font-semibold leading-[0.95]">Validate your expertise</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#0d3414]">
                  Start with your candidate flow, strengthen your proof, and unlock better guidance for career growth
                  and opportunity placement.
                </p>
                <Link
                  href={primaryHref}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0f1611] px-6 py-3 text-sm font-semibold text-white"
                >
                  Take assessment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {expertiseTiles.map((tile, index) => (
                  <div
                    key={tile.title}
                    className={`rounded-[1.5rem] p-5 shadow-[0_16px_34px_rgba(7,19,31,0.08)] ${
                      index % 2 === 0 ? "bg-[#7ef06c]/95 text-[#08210e]" : "bg-[#55d84b]/92 text-[#08210e]"
                    }`}
                  >
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/30">
                      {tile.kind === "score" ? <BookOpen className="h-4 w-4" /> : null}
                      {tile.kind === "track" ? <BadgeCheck className="h-4 w-4" /> : null}
                      {tile.kind === "lift" ? <Target className="h-4 w-4" /> : null}
                      {tile.kind === "match" ? <BriefcaseBusiness className="h-4 w-4" /> : null}
                    </div>
                    <p className="text-sm font-medium text-[#123019]">{tile.title}</p>
                    <p className="mt-3 text-3xl font-semibold">{tile.value}</p>
                    <div className="mt-4 h-2 rounded-full bg-black/10">
                      <div
                        className="h-2 rounded-full bg-[#0f1611] shadow-[0_0_18px_rgba(15,22,17,0.16)] animate-pulse"
                        style={{ width: tile.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
