import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Check,
  CircuitBoard,
  Crown,
  MapPin,
  Sparkles,
  ShieldCheck,
  Users,
} from "lucide-react";

const platformCards = [
  {
    title: "Candidates",
    eyebrow: "AI-guided careers",
    copy:
      "Build a verified profile, sharpen your resume, unlock ATS insights, and move toward stronger-fit learning and hiring paths.",
    href: "/candidate",
    cta: "Explore candidate flow",
    imageSrc: "/landing-candidate-human.png",
  },
  {
    title: "Employers",
    eyebrow: "Precision hiring",
    copy:
      "Post jobs, review applicants with ATS context, schedule interviews, and move faster through a cleaner hiring pipeline.",
    href: "/employer",
    cta: "Explore employer flow",
    imageSrc: "/landing-employer-human.png",
  },
  {
    title: "Membership",
    eyebrow: "Tools and resources",
    copy:
      "Access the academy, premium resources, guided growth tools, and the support layer that keeps the ecosystem moving.",
    href: "/membership",
    cta: "Join the Guild",
    imageSrc: "/landing-membership-human.png",
  },
] as const;

const journeySteps = [
  {
    step: "01",
    title: "Discovery",
    copy: "Tell us where you are now, what you want next, and how your experience maps to the market.",
  },
  {
    step: "02",
    title: "Validation",
    copy: "Use assessments, profile proof, and resume signals to create a stronger talent identity.",
  },
  {
    step: "03",
    title: "Momentum",
    copy: "Activate ATS insights, learning paths, and optimized materials that move you toward better fit.",
  },
  {
    step: "04",
    title: "Growth",
    copy: "Connect with jobs, employers, and continuous learning systems built for modern L&D careers.",
  },
] as const;

type HeroJobPreview = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  description?: string | null;
  work_mode?: string | null;
  employment_type?: string | null;
};

function isLdMarketplaceJob(job: HeroJobPreview) {
  const haystack = `${job.title || ""} ${job.company || ""} ${job.description || ""}`.toLowerCase();
  const includeMatch =
    /(learning|instructional|l&d|training|curriculum|elearning|e-learning|facilitation|designer|developer|capability|learning experience|course creator|content designer|learning consultant)/.test(
      haystack
    );
  const excludeMatch =
    /(registered nurse|nursing|clinical educator|physician|therapist|medical|hospital|healthcare assistant|bedside)/.test(
      haystack
    );

  return includeMatch && !excludeMatch;
}

function dedupeJobs(jobs: HeroJobPreview[]) {
  const seen = new Set<string>();

  return jobs.filter((job) => {
    const key = `${job.title}|${job.company}`.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function LandingPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const jobsReader = adminSupabase ?? supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const primaryHref = user ? "/dashboard/candidate" : "/register?role=candidate";
  const secondaryHref = user ? "/dashboard/employer" : "/employer";
  const jobsCtaHref = user ? "/dashboard/jobs" : "/register?role=candidate&intent=job-board";

  const jobPreviewQuery = await jobsReader
    .from("jobs")
    .select("id, title, company, location, description, work_mode, employment_type, is_active")
    .eq("is_active", true)
    .order("external_posted_at", { ascending: false, nullsFirst: false })
    .order("imported_at", { ascending: false })
    .limit(24);

  const jobPreviewPool = ((jobPreviewQuery.data || []) as Array<HeroJobPreview & { is_active?: boolean | null }>).filter(
    (job) => job.is_active !== false
  );

  const ldJobs = dedupeJobs(jobPreviewPool.filter(isLdMarketplaceJob));
  const liveJobs = ldJobs.slice(0, 3);

  return (
    <div className="marketing-page">
      <main className="pt-22 sm:pt-24">
        <section className="landing-hero-shell marketing-section flex min-h-[min(calc(100vh-6.25rem),41rem)] items-center pb-10 pt-2 sm:pb-14 sm:pt-3">
          <div className="marketing-container">
            <div className="grid items-center gap-8 lg:grid-cols-[1.06fr_0.94fr]">
              <div className="space-y-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d9e6d2] bg-[#eef6ff] px-4 py-2 text-[11px] font-semibold text-[#2f62b8] shadow-[0_10px_24px_rgba(47,98,184,0.08)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Verified L&amp;D talent, premium resources, and live hiring momentum in one place
                </div>
                <div className="space-y-5">
                  <h1 className="marketing-title max-w-3xl text-[3.2rem] leading-[0.95] sm:text-[4.25rem]">
                    India&apos;s verified marketplace for L&amp;D professionals.
                  </h1>
                  <p className="marketing-copy max-w-2xl text-base leading-8">
                    Get your instructional design and learning skills validated, get discovered by hiring teams, and
                    access premium L&amp;D resources all in one place.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link href={primaryHref} className="marketing-primary rounded-full px-6">
                    I&apos;m an L&amp;D professional
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={secondaryHref} className="marketing-secondary rounded-full px-6">
                    I&apos;m hiring L&amp;D talent
                  </Link>
                </div>

                <div className="grid gap-3 border-t border-[#dfe7d9] pt-5 text-sm text-[#2c3d29] sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#179720]" />
                    <span>Skill-validated profiles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#179720]" />
                    <span>500+ founding L&amp;D members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#179720]" />
                    <span>Backed by Maple Learning Solutions</span>
                  </div>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[390px] sm:max-w-[420px]">
                <div className="landing-hero-panel relative overflow-hidden rounded-[2.15rem] border border-[#10253d] shadow-[0_28px_80px_rgba(7,19,31,0.24)]">
                  <div className="absolute inset-0">
                    <Image
                      src="/landing-hero-human.png"
                      alt="L&D professional using AI-guided career tools"
                      fill
                      sizes="(max-width: 1024px) 100vw, 420px"
                      className="object-cover object-[center_28%]"
                      priority
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,14,20,0.08),rgba(5,14,20,0.58))]" />
                  </div>

                  <div className="relative flex min-h-[430px] flex-col justify-end p-4 sm:min-h-[480px] sm:p-5">
                    <div className="max-w-[270px] rounded-[1.35rem] border border-white/12 bg-[linear-gradient(180deg,rgba(8,17,24,0.34),rgba(8,17,24,0.56))] px-4 py-4 text-white shadow-[0_20px_50px_rgba(7,19,31,0.24)] backdrop-blur-md">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#b4f8b0]">
                            Ecosystem signal
                          </p>
                          <p className="mt-2 text-3xl font-semibold leading-none text-white">94%</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8ffe0]">
                          Live
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-[11px] text-white/78">
                            <span>Career alignment</span>
                            <span>91%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div className="h-2 w-[91%] rounded-full bg-[linear-gradient(90deg,#64da53,#1ba51b)]" />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between text-[11px] text-white/78">
                            <span>Hiring clarity</span>
                            <span>87%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div className="h-2 w-[87%] rounded-full bg-[linear-gradient(90deg,#7be86b,#34cd2f)]" />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between text-[11px] text-white/78">
                            <span>Learning momentum</span>
                            <span>89%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div className="h-2 w-[89%] rounded-full bg-[linear-gradient(90deg,#9bf38f,#42d53e)]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {liveJobs.length > 0 ? (
              <div className="mt-8 rounded-[2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#f6f3ea_0%,#f3f1e7_100%)] p-5 shadow-[0_20px_50px_rgba(87,108,67,0.06)]">
                <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#7a7d70]">
                  Live jobs from verified employers
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  {liveJobs.map((job) => {
                    const href = user ? `/dashboard/jobs/${job.id}` : "/register?role=candidate&intent=job-board";
                    const modeLabel =
                      job.work_mode === "remote"
                        ? "Remote"
                        : job.work_mode === "hybrid"
                          ? "Hybrid"
                          : job.employment_type === "contract"
                            ? "Contract"
                            : "Verified role";

                    return (
                      <Link
                        key={job.id}
                        href={href}
                        className="group relative overflow-hidden rounded-[1.4rem] border border-[#dbddd3] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)]"
                      >
                        <div className={`${user ? "" : "blur-[2px] opacity-85"} transition duration-200`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xl font-semibold leading-7 text-[#111827]">{job.title}</p>
                              <div className="mt-2 flex items-center gap-2 text-sm text-[#4f5b4b]">
                                <BriefcaseBusiness className="h-4 w-4 text-[#179720]" />
                                <span>{job.company || "Verified employer"}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-sm text-[#4f5b4b]">
                                <MapPin className="h-4 w-4 text-[#179720]" />
                                <span>{job.location || "India"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-5 inline-flex rounded-full bg-[#eef6ea] px-3 py-1 text-xs font-semibold text-[#486246]">
                            {modeLabel}
                          </div>
                        </div>

                        {!user ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(244,239,232,0.14),rgba(244,239,232,0.82))] p-4">
                            <div className="rounded-[1.2rem] border border-[#d7e4d1] bg-white/96 px-5 py-4 text-center shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#179720]">
                                Locked preview
                              </div>
                              <div className="mt-2 text-sm font-semibold text-[#111827]">Join free to unlock this job</div>
                            </div>
                          </div>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
                {!user ? (
                  <div className="mt-5 flex flex-col gap-3 border-t border-[#e3e6db] pt-4 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
                    <p className="text-sm text-[#4f5b4b]">
                      Browse vetted L&amp;D roles, unlock the full job board, and start applying after registration.
                    </p>
                    <Link href={jobsCtaHref} className="marketing-secondary rounded-full px-5">
                      View full job board
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-[#151817] px-6 py-16 text-white">
          <div className="marketing-container grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="max-w-lg text-4xl font-semibold leading-tight">
                L&amp;D has evolved.
                <br />
                The platforms <span className="text-[#55df54]">haven&apos;t.</span>
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="md:col-span-3">
                <p className="max-w-2xl text-sm leading-7 text-white/72">
                  The modern learning specialist is not data scientist, recruiter, and designer all at once. Yet the
                  tools available for hiring and growth are still stuck in the past. LXD Guild reimagines the entire
                  lifecycle through the lens of AI-first cinematic intelligence.
                </p>
              </div>
              <DarkFeature
                icon={<Sparkles className="h-4 w-4" />}
                title="Fragmented data"
                copy="Disconnected platforms keep the true potential of talent hidden."
              />
              <DarkFeature
                icon={<Bot className="h-4 w-4" />}
                title="Slow velocity"
                copy="Traditional hiring and onboarding tools move too slowly for today’s market pace."
              />
              <DarkFeature
                icon={<CircuitBoard className="h-4 w-4" />}
                title="Human + AI"
                copy="We combine human growth pathways with machine-led precision and clarity."
              />
            </div>
          </div>
        </section>

        <section className="marketing-section py-18">
          <div className="marketing-container">
            <div className="mb-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6e7c68]">The three pillars</p>
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">A unified ecosystem</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {platformCards.map((card, index) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="landing-platform-card group rounded-[1.9rem] border border-[#0f1d28] bg-[linear-gradient(180deg,#0a151d_0%,#101e26_100%)] p-5 text-white shadow-[0_24px_60px_rgba(7,19,31,0.14)]"
                  style={{
                    backgroundImage: `linear-gradient(180deg,rgba(5,14,20,0.18),rgba(5,14,20,0.82)), url('${card.imageSrc}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="relative flex min-h-[320px] flex-col justify-end">
                    <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#9ad5b1]">{card.eyebrow}</div>
                    <h3 className="text-3xl font-semibold">{card.title}</h3>
                    <p className="mt-3 max-w-sm text-sm leading-7 text-white/74">{card.copy}</p>
                    <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#73ef70]">
                      {card.cta}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(95,213,255,0.16),transparent_60%)] blur-xl" />
                    {index === 2 ? (
                      <div className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2dd629,#7bf36b)] text-[#07131f] shadow-[0_12px_24px_rgba(45,214,41,0.24)]">
                        <Crown className="h-5 w-5" />
                      </div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section pb-18">
          <div className="marketing-container grid items-center gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="landing-analytics-card rounded-[2rem] border border-[#dde7d8] p-5 shadow-[0_20px_60px_rgba(87,108,67,0.08)]">
              <div className="rounded-[1.4rem] border border-[#e3e9dd] bg-[linear-gradient(180deg,#fbfdf8,#f4f9ef)] p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#eef8e9] px-3 py-1 text-[#138d1a]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#34cd2f] text-[10px] font-bold text-white">99</span>
                    Skill analytics
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#75816f]">Live engine</span>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    ["L&D design strategy", "84%"],
                    ["AI adoption", "81%"],
                    ["Data fluency", "76%"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f7b74]">
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#dfe9d9]">
                        <div
                          className="h-1.5 rounded-full bg-[linear-gradient(90deg,#33d61f,#138d1a)]"
                          style={{ width: value }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 rounded-[1.2rem] bg-white p-4 shadow-[0_10px_20px_rgba(87,108,67,0.05)]">
                  <div>
                    <p className="text-2xl font-semibold text-[#111827]">42</p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7f8a7b]">Matches</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-[#138d1a]">A+</p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7f8a7b]">Readiness</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6e7c68]">Core technology</p>
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">AI intelligence for the human element</h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#5a6656]">
                Our intelligence engine goes beyond simple keyword matching. It understands the nuances of learning
                experience design, instructional strategy, and performance consulting to provide deep insights for both
                sides of the marketplace.
              </p>

              <div className="mt-8 space-y-5">
                <FeatureBullet
                  title="ATS deep scanning"
                  copy="Automated tracking that understands L&D taxonomies and hidden credential signals."
                />
                <FeatureBullet
                  title="Skill benchmarking"
                  copy="Compare your organizational capability or career graph against live industry standards in real time."
                />
                <FeatureBullet
                  title="Connected growth"
                  copy="Join hiring, learning, resources, and recommendations in one continuous ecosystem."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-18">
          <div className="marketing-container">
            <div className="text-center">
              <h2 className="text-4xl font-semibold text-[#111827]">Your journey through LXD Guild</h2>
            </div>

            <div className="mt-12 overflow-hidden rounded-[2.2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#fbfdf8_0%,#f2f8ed_100%)] px-6 py-8 shadow-[0_18px_50px_rgba(87,108,67,0.08)] sm:px-8 sm:py-10">
              <div className="relative grid gap-8 lg:grid-cols-4">
                {journeySteps.map((item, index) => (
                  <article key={item.step} className="relative pl-14 lg:pl-0">
                    <div className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#42d53e,#178f18)] text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_12px_22px_rgba(45,214,41,0.2)] lg:relative lg:mx-auto">
                      {item.step}
                    </div>
                    {index < journeySteps.length - 1 ? (
                      <>
                        <div className="journey-arrow-mobile absolute left-4 top-14 flex h-12 w-5 items-center justify-center lg:hidden">
                          <span className="journey-arrow-mobile-line" />
                          <ArrowRight className="journey-arrow-mobile-icon h-4 w-4 rotate-90 text-[#34cd2f]" />
                        </div>
                        <div className="journey-arrow-desktop absolute left-[calc(100%-0.75rem)] top-5 hidden h-4 w-20 items-center lg:flex">
                          <span className="journey-arrow-desktop-line" />
                          <ArrowRight className="journey-arrow-desktop-icon h-4 w-4 text-[#34cd2f]" />
                        </div>
                      </>
                    ) : null}
                    <div className="lg:mt-5 lg:text-center">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7b8576]">Phase {item.step}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-[#111827]">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-[#67735f]">{item.copy}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-section pb-20">
          <div className="landing-cta-panel marketing-container overflow-hidden rounded-[2.2rem] border border-[#11212f] px-8 py-16 text-center text-white shadow-[0_28px_80px_rgba(7,19,31,0.16)]">
            <div className="absolute" />
            <h2 className="mx-auto max-w-3xl text-5xl font-semibold leading-tight">The future of L&amp;D starts here</h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/72">
              Join the ecosystem that redefines how the world learns, grows, and connects its people to the right
              opportunities.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/dashboard/jobs" className="marketing-primary rounded-full px-7">
                Join the marketplace
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-white/18 bg-white/10 px-7 py-3 text-sm font-semibold text-white">
                Contact Us
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

function DarkFeature({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div>
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/6 text-[#63f26b]">
        {icon}
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/62">{copy}</p>
    </div>
  );
}

function FeatureBullet({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ebf7e3] text-[#138d1a]">
        <Check className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="font-semibold text-[#111827]">{title}</p>
        <p className="mt-1 text-sm leading-7 text-[#67735f]">{copy}</p>
      </div>
    </div>
  );
}
