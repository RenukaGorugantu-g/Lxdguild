import type { Metadata } from "next";
import Link from "next/link";
import LandingVideoWall from "@/components/LandingVideoWall";
import { buildPublicJobHref } from "@/lib/public-jobs";
import { filterMarketplaceRelevantJobs } from "@/lib/marketplace-job-filter";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { formatCount, getMarketplaceVisibilityCounts, toJsonLdScriptProps } from "@/lib/seo";
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

export const metadata: Metadata = {
  title: "L&D Jobs in India",
  description:
    "AI-powered L&D marketplace for instructional designers, eLearning developers, and employers hiring across India.",
  keywords: [
    "L&D job marketplace India",
    "Learning and development jobs India",
    "Instructional designer jobs marketplace",
    "eLearning developer platform",
    "Verified L&D professionals",
    "Learning experience designer careers",
    "L&D talent marketplace",
    "Skill-validated instructional designers",
    "AI-powered L&D job board",
    "Corporate training jobs India",
    "LXD Guild marketplace",
    "Learning professional community",
    "EdTech job platform India",
    "L&D recruitment platform",
    "Training and development careers",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "L&D Jobs in India",
    description:
      "AI-powered L&D marketplace for instructional designers, eLearning developers, and employers hiring across India.",
    url: "/",
  },
  twitter: {
    title: "L&D Jobs in India",
    description:
      "AI-powered L&D marketplace for instructional designers, eLearning developers, and employers hiring across India.",
  },
};

const heroVideos = [
  {
    id: 1,
    src: "https://oldlxd.lxdguild.com/wp-content/uploads/2025/11/WhatsApp-Video-2025-11-04-at-10.54.40-AM.mp4",
  },
  {
    id: 2,
    src: "https://oldlxd.lxdguild.com/wp-content/uploads/2025/11/WhatsApp-Video-2025-11-04-at-10.54.41-AM.mp4",
  },
  {
    id: 3,
    src: "https://oldlxd.lxdguild.com/wp-content/uploads/2025/11/WhatsApp-Video-2025-11-04-at-10.54.42-AM.mp4",
  },
  {
    id: 4,
    src: "https://oldlxd.lxdguild.com/wp-content/uploads/2025/11/WhatsApp-Video-2025-11-04-at-10.54.45-AM.mp4",
  },
  {
    id: 5,
    src: "https://oldlxd.lxdguild.com/wp-content/uploads/2025/11/WhatsApp-Video-2025-11-04-at-10.54.46-AM.mp4",
  },
  {
    id: 6,
    src: "https://oldlxd.lxdguild.com/wp-content/uploads/2025/11/WhatsApp-Video-2025-11-04-at-10.54.35-AM.mp4",
  },
  {
    id: 7,
    src: "https://oldlxd.lxdguild.com/wp-content/uploads/2025/11/WhatsApp-Video-2025-11-04-at-10.54.38-AM.mp4",
  },
  {
    id: 8,
    src: "https://oldlxd.lxdguild.com/wp-content/uploads/2025/11/WhatsApp-Video-2025-11-04-at-10.54.38-AM-1.mp4",
  },
  {
    id: 9,
    src: "https://oldlxd.lxdguild.com/wp-content/uploads/2025/11/WhatsApp-Video-2025-09-29-at-5.27.56-PM.mp4",
  },
  {
    id: 10,
    src: "https://oldlxd.lxdguild.com/wp-content/uploads/2025/11/WhatsApp-Video-2025-10-15-at-1.08.12-PM.mp4",
  },
  {
    id: 11,
    src: "https://oldlxd.lxdguild.com/wp-content/uploads/2025/11/InShot_20251021_120021667.mp4",
  },
  {
    id: 12,
    src: "https://oldlxd.lxdguild.com/wp-content/uploads/2025/11/WhatsApp-Video-2025-11-04-at-12.14.40-PM.mp4",
  },
] as const;

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

const popularCategories = [
  "Instructional Designer",
  "eLearning Developer",
  "Learning Experience Designer",
  "Corporate Trainer",
  "L&D Manager",
  "Curriculum Developer",
] as const;

const marketplaceCities = ["Bangalore", "Hyderabad", "Mumbai", "Delhi", "Pune"] as const;

const ecosystemBenefits = [
  {
    heading: "For Instructional Designers & eLearning Developers",
    copy:
      "Create a stronger professional signal with a verified profile, ATS-aware resume support, and job discovery built around L&D careers in India.",
  },
  {
    heading: "For Learning & Development Employers",
    copy:
      "Reach instructional designers, eLearning developers, and learning experience designers through a hiring flow made for L&D roles instead of generic job board noise.",
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
  const primaryHref = user ? "/dashboard/candidate" : "/candidate";
  const secondaryHref = user ? "/dashboard/employer" : "/employer";
  const jobsCtaHref = user ? "/dashboard/jobs" : "/jobs";

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

  const ldJobs = dedupeJobs(filterMarketplaceRelevantJobs(jobPreviewPool));
  const liveJobs = ldJobs.slice(0, 3);
  const visibilityCounts = await getMarketplaceVisibilityCounts();
  const formattedPublicJobs = formatCount(visibilityCounts.publicJobCount);
  const formattedUnlockedJobs = formatCount(visibilityCounts.unlockedJobCount);
  const homeJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LXD Guild Marketplace",
    alternateName: "LXD Marketplace",
    url: "https://lxdmarketplace.lxdguild.com/",
    description:
      "India's verified marketplace for Learning & Development professionals. Skill-validated instructional designers, eLearning developers, and L&D talent.",
    publisher: {
      "@type": "Organization",
      name: "LXD Guild",
      url: "https://lxdmarketplace.lxdguild.com",
      logo: {
        "@type": "ImageObject",
        url: "https://lxdmarketplace.lxdguild.com/icon.png",
      },
      sameAs: [
        "https://in.linkedin.com/company/lxd-guild",
        "https://www.youtube.com/@lxdguild",
        "https://www.instagram.com/lxd_guild/",
        "https://x.com/GuildLxd20077",
        "https://www.facebook.com/100648556092707/",
      ],
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://lxdmarketplace.lxdguild.com/jobs?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="marketing-page">
      <main className="pt-22 sm:pt-24">
        <script type="application/ld+json" dangerouslySetInnerHTML={toJsonLdScriptProps(homeJsonLd)} />
        <section className="landing-hero-shell marketing-section flex min-h-[min(calc(100vh-6.25rem),35rem)] items-center pb-8 pt-2 sm:pb-10 sm:pt-3">
          <div className="marketing-container">
            <div className="grid items-center gap-8 lg:grid-cols-[1.06fr_0.94fr]">
              <div className="space-y-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d9e6d2] bg-[#eef6ff] px-4 py-2 text-[11px] font-semibold text-[#2f62b8] shadow-[0_10px_24px_rgba(47,98,184,0.08)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Verified L&amp;D talent, premium resources, and live hiring momentum in one place
                </div>
                <div className="space-y-5">
                  <h1 className="marketing-title max-w-3xl text-[3.2rem] leading-[0.95] sm:text-[4.25rem]">
                    L&amp;D job marketplace India for verified learning professionals.
                  </h1>
                  <p className="marketing-copy max-w-2xl text-base leading-8">
                    LXD Guild is an AI-powered L&amp;D job board for instructional designers, eLearning developers,
                    learning experience designers, and employers hiring across India.
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
                    <span>{formattedPublicJobs} L&amp;D roles publicly visible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#179720]" />
                    <span>{formattedUnlockedJobs} unlocked with free membership</span>
                  </div>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[390px] sm:max-w-[500px]">
                <div className="landing-hero-panel relative overflow-hidden rounded-[2rem] shadow-[0_18px_54px_rgba(7,19,31,0.12)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(83,201,112,0.12),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.08))]" />

                  <div className="relative p-3 sm:p-4">
                    <LandingVideoWall videos={heroVideos} />
                  </div>
                </div>
              </div>
            </div>

            {liveJobs.length > 0 ? (
              <div className="mt-8 rounded-[2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#f6f3ea_0%,#f3f1e7_100%)] p-5 shadow-[0_20px_50px_rgba(87,108,67,0.06)]">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#7a7d70]">
                  Live jobs from verified employers
                </p>
                <h2 className="text-3xl font-semibold text-[#111827]">Featured L&amp;D Roles Available Now</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5b6757]">
                  Preview instructional designer jobs, eLearning developer openings, and learning experience designer
                  roles now visible on the marketplace.
                </p>
                <div className="grid gap-4 lg:grid-cols-3">
                  {liveJobs.map((job) => {
                    const href = user ? `/dashboard/jobs/${job.id}` : buildPublicJobHref(job);
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

        <section className="marketing-section pb-16">
          <div className="marketing-container">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6e7c68]">Marketplace flow</p>
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">How Our L&amp;D Marketplace Works</h2>
              <p className="mt-4 text-base leading-8 text-[#5a6656]">
                The platform connects career growth and hiring in one L&amp;D recruitment platform, so candidates and
                employers both work from clearer proof, better matching signals, and a shared language for learning talent.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {ecosystemBenefits.map((item) => (
                <article
                  key={item.heading}
                  className="rounded-[2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbf2_100%)] p-6 shadow-[0_20px_50px_rgba(87,108,67,0.08)]"
                >
                  <h3 className="text-2xl font-semibold text-[#111827]">{item.heading}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#5a6656]">{item.copy}</p>
                </article>
              ))}
            </div>
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
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">Three Ways to Accelerate Your L&amp;D Career</h2>
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
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6e7c68]">Why LXD Guild</p>
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">Why Learning Professionals Choose LXD Guild</h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#5a6656]">
                Our intelligence engine goes beyond simple keyword matching. It understands the nuances of instructional
                design, learning experience design, performance consulting, and corporate training careers to help both
                sides of the marketplace make better decisions.
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
          <div className="marketing-container grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[2rem] border border-[#dbe6d6] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbf2_100%)] p-6 shadow-[0_20px_50px_rgba(87,108,67,0.08)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6e7c68]">Candidate vs employer value</p>
              <h2 className="mt-4 text-4xl font-semibold text-[#111827]">Why LXD Guild vs Traditional Job Boards</h2>
              <div className="mt-8 overflow-hidden rounded-[1.4rem] border border-[#dbe6d6]">
                <div className="grid grid-cols-3 bg-[#eef6ea] text-sm font-semibold text-[#111827]">
                  <div className="p-4">What matters</div>
                  <div className="p-4">Candidates</div>
                  <div className="p-4">Employers</div>
                </div>
                {[
                  ["Signal quality", "Verified profiles and ATS-aware tools", "Role-aware candidate evaluation"],
                  ["Career fit", "Instructional design and L&D job relevance", "Hiring flow tailored to L&D roles"],
                  ["Marketplace focus", "India and remote learning careers", "Access to niche L&D talent"],
                ].map(([label, candidate, employer]) => (
                  <div key={label} className="grid grid-cols-3 border-t border-[#dbe6d6] bg-white text-sm text-[#5a6656]">
                    <div className="p-4 font-semibold text-[#111827]">{label}</div>
                    <div className="p-4">{candidate}</div>
                    <div className="p-4">{employer}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#dbe6d6] bg-white p-6 shadow-[0_20px_50px_rgba(87,108,67,0.08)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6e7c68]">Popular categories</p>
              <h2 className="mt-4 text-3xl font-semibold text-[#111827]">Popular L&amp;D Job Categories</h2>
              <div className="mt-6 flex flex-wrap gap-3">
                {popularCategories.map((category) => (
                  <Link
                    key={category}
                    href={`/jobs?category=${encodeURIComponent(category)}`}
                    rel="nofollow"
                    className="rounded-full border border-[#dbe6d6] bg-[#f8fbf5] px-4 py-2 text-sm font-medium text-[#2c3d29] transition hover:border-[#179720] hover:text-[#179720]"
                  >
                    {category}
                  </Link>
                ))}
              </div>
              <p className="mt-6 text-sm leading-7 text-[#5a6656]">
                Explore L&amp;D opportunities across {marketplaceCities.join(", ")}, plus remote learning and development
                jobs for instructional designers, eLearning developers, and training specialists.
              </p>
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
              <Link href="/jobs" className="marketing-primary rounded-full px-7">
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
