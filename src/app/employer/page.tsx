import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileSearch,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getBaseRole } from "@/lib/profile-role";
import { buildFaqJsonLd, toJsonLdScriptProps } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Hire Verified Instructional Designers & L&D Talent | India",
  description:
    "Discover skill-validated L&D professionals with AI-powered hiring intelligence. Post jobs, evaluate candidates, and hire instructional designers faster with smart ATS workflows.",
  keywords: [
    "Hire instructional designers India",
    "Recruit L&D professionals",
    "Find eLearning developers",
    "Hire learning experience designers",
    "L&D talent recruitment platform",
    "Instructional design staffing solutions",
    "Verified L&D talent pool",
    "AI-powered L&D recruitment",
    "Hire curriculum developers",
    "Corporate training recruitment",
    "Learning consultant hiring",
    "EdTech talent acquisition",
    "Skill-validated instructional designers",
    "ATS integration for L&D hiring",
    "Employer hiring platform L&D",
  ],
  alternates: {
    canonical: "/employer",
  },
  openGraph: {
    title: "Hire Verified Instructional Designers & L&D Talent | India",
    description:
      "Discover skill-validated L&D professionals with AI-powered hiring intelligence. Post jobs, evaluate candidates, and hire instructional designers faster with smart ATS workflows.",
    url: "/employer",
  },
  twitter: {
    title: "Hire Verified Instructional Designers & L&D Talent | India",
    description:
      "Discover skill-validated L&D professionals with AI-powered hiring intelligence. Post jobs, evaluate candidates, and hire instructional designers faster with smart ATS workflows.",
  },
};

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

const employerFaqs = [
  {
    question: "Who should use the employer marketplace?",
    answer:
      "The employer flow is built for organizations hiring instructional designers, eLearning developers, corporate trainers, learning consultants, and L&D leaders.",
  },
  {
    question: "What makes this different from a general job board?",
    answer:
      "LXD Guild focuses on learning talent, skill validation, and ATS-aware candidate review so your team can evaluate L&D specialists with more context.",
  },
  {
    question: "Can I post jobs and review candidates in one place?",
    answer:
      "Yes. The employer workflow is designed to support posting, screening, shortlist review, and interview coordination inside one connected process.",
  },
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
  const employerJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Recruitment and Hiring Platform",
    name: "LXD Guild Employer Hiring Services",
    description:
      "AI-powered hiring platform for recruiting verified Learning & Development professionals including instructional designers, eLearning developers, and L&D specialists.",
    provider: {
      "@type": "Organization",
      name: "LXD Guild",
      url: "https://lxdguild.com",
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    audience: {
      "@type": "Audience",
      audienceType: "Employers and Recruiters",
    },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      url: "https://lxdmarketplace.lxdguild.com/employer",
    },
  };
  const employerFaqJsonLd = buildFaqJsonLd(employerFaqs);

  return (
    <div className="marketing-page">
      <main className="pt-22 sm:pt-24">
        <script type="application/ld+json" dangerouslySetInnerHTML={toJsonLdScriptProps(employerJsonLd)} />
        <script type="application/ld+json" dangerouslySetInnerHTML={toJsonLdScriptProps(employerFaqJsonLd)} />
        <section className="marketing-section pb-16 pt-3">
          <div className="marketing-container">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#7a8773]">
                  Verified hiring intelligence
                </div>
                <h1 className="marketing-title max-w-2xl text-[3rem] leading-[0.96] sm:text-[4.2rem]">
                  {isSignedInEmployer
                    ? `Hire verified instructional designers and L&D professionals in India${profileName ? `, ${profileName}` : ""}.`
                    : "Hire verified instructional designers and L&D professionals in India."}
                </h1>
                <p className="marketing-copy max-w-2xl text-base leading-8">
                  Recruit L&amp;D professionals, find eLearning developers, and hire learning experience designers
                  through an AI-powered recruitment platform built specifically for modern learning teams.
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
                    alt="Employer dashboard showing AI-matched instructional designer candidates"
                    fill
                    sizes="(max-width: 1024px) 100vw, 430px"
                    className="object-cover object-center"
                    priority
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,20,14,0.06),rgba(10,20,14,0.42))]" />
                  <div className="absolute inset-x-4 bottom-4 rounded-[1.15rem] bg-[#38d62a] px-4 py-3 text-[#092012] shadow-[0_14px_28px_rgba(56,214,42,0.24)]">
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
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">Why Top Companies Choose LXD Guild for L&amp;D Hiring</h2>
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
            <article className="rounded-[2rem] border border-[#f1d8b4] bg-[linear-gradient(180deg,#fffaf3_0%,#fffdf8_100%)] p-6 shadow-[0_20px_50px_rgba(87,108,67,0.08)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b8775]">ATS candidate evaluation</p>
              <div className="mt-5 rounded-[1.5rem] border border-[#e7dfd1] bg-white p-5 shadow-[0_10px_24px_rgba(87,108,67,0.05)]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-[#e4eadf] bg-[linear-gradient(180deg,#f5f8ef_0%,#eef4e7_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8775]">Lead instructional designer</p>
                    <p className="mt-2 text-sm font-medium text-[#111827]">Aarav Mehta</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-[#e4eadf] bg-[linear-gradient(180deg,#f5f8ef_0%,#eef4e7_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8775]">Match score</p>
                    <p className="mt-2 text-sm font-medium text-[#16921d]">92% match</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-[#ead9c2] bg-[linear-gradient(180deg,#fffdfa_0%,#fff7ee_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7b8775]">Competencies</p>
                    <p className="mt-2 text-sm font-medium text-[#111827]">9 / 10 core skills</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-[#ead9c2] bg-[linear-gradient(180deg,#fffdfa_0%,#fff7ee_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
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
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">AI-Powered Candidate Evaluation</h2>
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
              <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight">Access skill-validated L&amp;D professionals</h2>
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
                    ? "border-[#dfe8d8] bg-[linear-gradient(180deg,#ffffff_0%,#f6faef_100%)]"
                    : "border-[#f1d8b4] bg-[linear-gradient(180deg,#fffaf3_0%,#fffdf8_100%)]"
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

        <section className="marketing-section pb-16">
          <div className="marketing-container grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <article className="rounded-[2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbf2_100%)] p-6 shadow-[0_20px_50px_rgba(87,108,67,0.08)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b8775]">Hiring comparison</p>
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">Traditional Hiring vs LXD Guild Hiring</h2>
              <div className="mt-8 overflow-hidden rounded-[1.4rem] border border-[#dbe6d6]">
                <div className="grid grid-cols-3 bg-[#eef6ea] text-sm font-semibold text-[#111827]">
                  <div className="p-4">Focus area</div>
                  <div className="p-4">Traditional boards</div>
                  <div className="p-4">LXD Guild</div>
                </div>
                {[
                  ["Role relevance", "Broad, mixed candidate pools", "L&D-specific talent discovery"],
                  ["Signal depth", "Resume-only screening", "ATS context and validation-led review"],
                  ["Workflow", "Fragmented handoffs", "Connected employer hiring flow"],
                ].map(([label, oldWay, guildWay]) => (
                  <div key={label} className="grid grid-cols-3 border-t border-[#dbe6d6] bg-white text-sm text-[#5a6656]">
                    <div className="p-4 font-semibold text-[#111827]">{label}</div>
                    <div className="p-4">{oldWay}</div>
                    <div className="p-4">{guildWay}</div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-[#dbe6d6] bg-white p-6 shadow-[0_20px_50px_rgba(87,108,67,0.08)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b8775]">Typical roles</p>
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">Roles employers hire for on the platform</h2>
              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  "Instructional Designer",
                  "eLearning Developer",
                  "Learning Experience Designer",
                  "Curriculum Developer",
                  "Corporate Trainer",
                  "Learning Consultant",
                ].map((role) => (
                  <Link
                    key={role}
                    href={`/jobs?category=${encodeURIComponent(role)}`}
                    rel="nofollow"
                    className="rounded-full border border-[#dbe6d6] bg-[#f8fbf5] px-4 py-2 text-sm font-medium text-[#2c3d29] transition hover:border-[#179720] hover:text-[#179720]"
                  >
                    {role}
                  </Link>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="marketing-section pb-16">
          <div className="marketing-container">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7b8775]">Employer FAQs</p>
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">Answers for hiring teams</h2>
            </div>
            <div className="mt-8 grid gap-4">
              {employerFaqs.map((item) => (
                <details key={item.question} className="rounded-[1.5rem] border border-[#dbe6d6] bg-white p-5 shadow-[0_12px_30px_rgba(87,108,67,0.06)]">
                  <summary className="cursor-pointer list-none text-lg font-semibold text-[#111827]">{item.question}</summary>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5a6656]">{item.answer}</p>
                </details>
              ))}
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
