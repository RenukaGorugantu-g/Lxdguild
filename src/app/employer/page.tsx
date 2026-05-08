import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  FileSearch,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getBaseRole } from "@/lib/profile-role";

const ecosystemSteps = [
  {
    icon: BriefcaseBusiness,
    title: "Post Opportunity",
    copy: "Define requirements using role-aware signals and better hiring context.",
  },
  {
    icon: FileSearch,
    title: "Auto-Evaluation",
    copy: "Candidates are surfaced and scored against your exact needs.",
  },
  {
    icon: Users,
    title: "Smart Connect",
    copy: "Direct access to candidate shortlists and fit observations.",
  },
  {
    icon: Target,
    title: "Hire Smarter",
    copy: "Finalise hiring with streamlined review and stronger decision quality.",
  },
] as const;

const atsChecks = [
  "Role-title and skill competency mapping",
  "Automated cultural fit positioning alignment",
] as const;

const workflowCards = [
  {
    eyebrow: "Intelligent matching",
    title: "Hire with AI-powered intelligence",
    copy:
      "Our neural matching layer helps employers read stronger signals from ATS context, verified proof, and role-fit scoring.",
  },
  {
    eyebrow: "Workflow control",
    title: "Manage hiring without complexity",
    copy:
      "Run review, interview scheduling, candidate movement, and next-step decisions from one cleaner employer workflow.",
  },
] as const;

const finalMetrics = [
  { title: "Faster shortlists", detail: "3x", width: "78%" },
  { title: "Direct access", detail: "No middle layer", width: "86%" },
  { title: "Verified profiles", detail: "500+", width: "74%" },
  { title: "Review confidence", detail: "98%", width: "92%" },
] as const;

export default async function EmployerLandingPage() {
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

  const isSignedInEmployer = baseRole === "employer";
  const primaryHref = isSignedInEmployer ? "/dashboard/employer" : "/register?role=employer";
  const secondaryHref = isSignedInEmployer ? "/dashboard/employer/post-job" : "/dashboard/employer/upgrade";

  return (
    <div className="marketing-page">
      <main className="pt-22 sm:pt-24">
        <section className="marketing-section pb-16 pt-3">
          <div className="marketing-container">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7a8773]">
                  Verified hiring intelligence
                </div>
                <h1 className="marketing-title max-w-2xl text-[3rem] leading-[0.96] sm:text-[4.2rem]">
                  {isSignedInEmployer
                    ? `Smarter hiring for modern L&D teams${profileName ? `, ${profileName}` : ""}.`
                    : "Smarter hiring for modern L&D teams."}
                </h1>
                <p className="marketing-copy max-w-2xl text-base leading-8">
                  Discover verified professionals, evaluate talent intelligently, and streamline hiring with a powered
                  recruitment workflow built for modern L&D teams.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href={primaryHref} className="marketing-primary rounded-full px-6">
                    {isSignedInEmployer ? "Open employer hub" : "Hire talent"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={secondaryHref} className="marketing-secondary rounded-full px-6">
                    {isSignedInEmployer ? "Post a role" : "Explore marketplace"}
                  </Link>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-[#0f2028] bg-[#11171c] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                <div className="relative min-h-[360px] overflow-hidden rounded-[1.5rem] border border-white/10">
                  <Image
                    src="/landing-employer-human.png"
                    alt="Employer workspace using AI hiring tools"
                    fill
                    sizes="(max-width: 1024px) 100vw, 430px"
                    className="object-cover object-center"
                    priority
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,20,14,0.04),rgba(10,20,14,0.46))]" />
                  <div className="absolute inset-x-4 bottom-4 rounded-[1.15rem] bg-[#38d62a] px-4 py-3 text-[#092012] shadow-[0_14px_28px_rgba(56,214,42,0.22)]">
                    <p className="text-[11px] font-semibold">Talent match found</p>
                    <p className="mt-1 text-sm font-medium">93% skill overlap</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-16">
          <div className="marketing-container">
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b8775]">The ecosystem fuel line</p>
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">Cinematic hiring ecosystem</h2>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-4">
              {ecosystemSteps.map((item) => (
                <article key={item.title} className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#dde6d8] bg-white text-[#111827] shadow-[0_10px_24px_rgba(87,108,67,0.06)]">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#111827]">{item.title}</h3>
                  <p className="text-sm leading-7 text-[#657160]">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section pb-16">
          <div className="marketing-container grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <article className="rounded-[2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbf1_100%)] p-6 shadow-[0_20px_50px_rgba(87,108,67,0.08)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b8775]">ATS candidate evaluation</p>
              <div className="mt-5 rounded-[1.5rem] border border-[#e2ebde] bg-white p-5 shadow-[0_10px_24px_rgba(87,108,67,0.05)]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] bg-[#f4f8ef] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8775]">Lead instructional designer</p>
                    <p className="mt-2 text-sm font-medium text-[#111827]">Aarav Mehta</p>
                  </div>
                  <div className="rounded-[1.2rem] bg-[#f4f8ef] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8775]">Match score</p>
                    <p className="mt-2 text-sm font-medium text-[#16921d]">92% match</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-[#e2ebde] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8775]">Competencies</p>
                    <p className="mt-2 text-sm font-medium text-[#111827]">9 / 10 core skills</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-[#e2ebde] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8775]">Seniority</p>
                    <p className="mt-2 text-sm font-medium text-[#111827]">8+ years senior level</p>
                  </div>
                </div>

                <p className="mt-5 text-xs leading-6 text-[#6c7868]">
                  ATS insight surface gives hiring teams clearer fit signals before they move candidates to interview.
                </p>
              </div>
            </article>

            <article className="self-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b8775]">AI candidate evaluation</p>
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">See beyond the resume</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5d6958]">
                Our deep scanning AI does more than spot keywords. It understands project context, skill nuance, and
                instructional performance to provide a clearer view of talent alignment.
              </p>
              <div className="mt-6 space-y-3">
                {atsChecks.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-[#50604e]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#17931b]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="bg-[#111413] px-6 py-16 text-white">
          <div className="marketing-container grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#93d89f]">Verified professionals</p>
              <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight">Discover verified professionals</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/70">
                Every profile on LXD Marketplace can surface assessment-backed proof, hiring-relevant signals, and
                stronger confidence for employer review.
              </p>

              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#66ef6a]" />
                  <div>
                    <p className="font-semibold text-white">100% verified roster</p>
                    <p className="mt-1 text-sm leading-6 text-white/68">
                      Skip weak-fit guesswork. Focus on stronger candidate signals and cleaner review confidence.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/6">
                <Image
                  src="/landing-candidate-human.png"
                  alt="Verified candidate profile"
                  fill
                  sizes="(max-width: 1024px) 100vw, 320px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,18,16,0.12),rgba(12,18,16,0.56))]" />
                <div className="absolute inset-x-4 bottom-4 text-sm font-semibold">Sarah Jenkins</div>
              </div>
              <div className="rounded-[1.6rem] bg-white/8 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Client satisfaction</p>
                <p className="mt-3 text-4xl font-semibold text-[#67ee63]">98%</p>
              </div>
              <div className="rounded-[1.6rem] bg-white/8 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Verified certifications</p>
                <p className="mt-3 text-4xl font-semibold text-[#67ee63]">500+</p>
              </div>
              <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/6">
                <Image
                  src="/landing-hero-human.png"
                  alt="Employer-ready professional"
                  fill
                  sizes="(max-width: 1024px) 100vw, 320px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,18,16,0.12),rgba(12,18,16,0.56))]" />
                <div className="absolute inset-x-4 bottom-4 text-sm font-semibold">Marcus Thorne</div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-16 pt-16">
          <div className="marketing-container grid gap-6 lg:grid-cols-2">
            {workflowCards.map((card, index) => (
              <article
                key={card.title}
                className={`overflow-hidden rounded-[2rem] border p-7 shadow-[0_20px_50px_rgba(87,108,67,0.08)] ${
                  index === 0
                    ? "border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f6faef_100%)]"
                    : "border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f6faef_100%)]"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b8775]">{card.eyebrow}</p>
                <h2 className="mt-3 max-w-lg text-4xl font-semibold leading-tight text-[#111827]">{card.title}</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#5e6a59]">{card.copy}</p>
                <div className="mt-8 rounded-[1.4rem] border border-[#e1eadb] bg-white p-5 shadow-[0_10px_24px_rgba(87,108,67,0.06)]">
                  {index === 0 ? (
                    <div className="space-y-4">
                      {[
                        ["Profile fit", "89%"],
                        ["Readiness", "94%"],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f7b74]">
                            <span>{label}</span>
                            <span>{value}</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#e3ecd9]">
                            <div className="h-2 rounded-full bg-[linear-gradient(90deg,#63db52,#17931b)]" style={{ width: value }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-[1rem] border border-[#e4ece0] px-4 py-3 text-sm text-[#30402d]">
                        Review technical fit now
                      </div>
                      <div className="rounded-[1rem] border border-[#e4ece0] px-4 py-3 text-sm text-[#30402d]">
                        Interview tomorrow 2PM
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section pb-18">
          <div className="marketing-container overflow-hidden rounded-[2.3rem] bg-[linear-gradient(135deg,#dff7d8_0%,#eef8e7_100%)] px-8 py-10 shadow-[0_24px_60px_rgba(87,108,67,0.12)]">
            <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="text-[#07131f]">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4f7a4f]">Integrated process</p>
                <h2 className="mt-3 text-5xl font-semibold leading-[0.95]">Move faster from discovery to hiring</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#40563f]">
                  Integrated video conferencing, collaborative technical assessments, and digital contract signing all
                  within one streamlined employer flow.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm text-[#3c523a]">
                  <div>
                    <p className="font-semibold text-[#111827]">3x faster</p>
                    <p className="mt-1">Reduce time-to-hire compared to traditional agencies.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#111827]">Direct access</p>
                    <p className="mt-1">No intermediaries. Direct communication with your experts.</p>
                  </div>
                </div>
              </div>

              <div className="relative min-h-[320px] overflow-hidden rounded-[1.8rem] border border-[#0f2028] bg-[#11171c] p-3 shadow-[0_24px_60px_rgba(15,23,42,0.14)] lg:min-h-[360px]">
                <div className="relative h-full overflow-hidden rounded-[1.35rem]">
                  <Image
                    src="/landing-membership-human.png"
                    alt="Collaborative hiring and interview review"
                    fill
                    sizes="(max-width: 1024px) 100vw, 520px"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,24,0.1),rgba(8,17,24,0.42))]" />
                  <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/88 text-[#111827] shadow-[0_14px_28px_rgba(15,23,42,0.16)]">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-20">
          <div className="marketing-container text-center">
            <h2 className="mx-auto max-w-3xl text-4xl font-semibold text-[#111827]">Ready to build your elite L&D team?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#647160]">
              Join hundreds of forward-thinking companies already using LXD Marketplace to scale their learning
              initiatives with verified intelligence.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={primaryHref} className="marketing-primary rounded-full px-7">
                {isSignedInEmployer ? "Open employer profile" : "Create employer profile"}
              </Link>
              <Link href={secondaryHref} className="marketing-secondary rounded-full px-7">
                {isSignedInEmployer ? "Continue hiring flow" : "Upgrade to premium"}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
