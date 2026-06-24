import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Building, Clock3, MapPin, Search, Sparkles } from "lucide-react";
import {
  buildPublicJobHref,
  getEmploymentTypeLabel,
  getJobPostedDate,
  getPublicFeaturedJobs,
  getPublicJobs,
  getWorkModeLabel,
  stripJobHtml,
  type PublicJobRecord,
} from "@/lib/public-jobs";
import { formatCount, getMarketplaceVisibilityCounts, toJsonLdScriptProps } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";

type JobsSearchParams = {
  category?: string;
  q?: string;
};

const publicCategories = [
  "Instructional Designer",
  "eLearning Developer",
  "Learning Experience Designer",
  "Corporate Trainer",
  "L&D Manager",
  "Curriculum Developer",
] as const;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<JobsSearchParams>;
}): Promise<Metadata> {
  const { category, q } = await searchParams;
  const hasFilters = Boolean(category || q);
  const title = category
    ? `${category} Jobs in India`
    : "L&D Jobs in India | Instructional Design & eLearning Roles";
  const description = category
    ? `Browse ${category} jobs in India, including verified L&D, eLearning, and learning experience opportunities.`
    : "Browse verified instructional designer jobs, eLearning developer roles, and learning & development careers across India.";

  return {
    title,
    description,
    alternates: {
      canonical: "/jobs",
    },
    robots: hasFilters
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        }
      : undefined,
    openGraph: {
      title,
      description,
      url: "/jobs",
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function PublicJobsPage({
  searchParams,
}: {
  searchParams: Promise<JobsSearchParams>;
}) {
  const { category, q } = await searchParams;
  const jobs = await getPublicJobs();
  const normalizedQuery = q?.trim().toLowerCase() || "";
  const featuredJobs = (await getPublicFeaturedJobs()).filter((job) => matchesJob(job, category, normalizedQuery));
  const filteredJobs = jobs.filter((job) => matchesJob(job, category, normalizedQuery));
  const featuredJobIds = new Set(featuredJobs.map((job) => job.id));
  const jobsToRender = filteredJobs.filter((job) => !featuredJobIds.has(job.id)).slice(0, 36);
  const visibilityCounts = await getMarketplaceVisibilityCounts();
  const visibleJobCountLabel = formatCount(filteredJobs.length);
  const unlockedJobCountLabel = formatCount(visibilityCounts.unlockedJobCount);
  const siteUrl = getSiteUrl();
  const jobsJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "L&D Jobs in India",
    description:
      "Browse instructional designer jobs, eLearning developer roles, and learning & development opportunities across India.",
    url: `${siteUrl}/jobs`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: filteredJobs.length,
      itemListElement: jobsToRender.slice(0, 10).map((job, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}${buildPublicJobHref(job)}`,
        name: job.title,
      })),
    },
  };

  return (
    <div className="marketing-page">
      <main className="pt-22 sm:pt-24">
        <script type="application/ld+json" dangerouslySetInnerHTML={toJsonLdScriptProps(jobsJsonLd)} />
        <section className="marketing-section pb-10 pt-3">
          <div className="marketing-container space-y-8">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <div className="marketing-kicker">
                  <Sparkles className="h-3.5 w-3.5" />
                  Public job board
                </div>
                <h1 className="marketing-title mt-4 max-w-3xl text-5xl">
                  L&amp;D jobs in India for instructional designers, eLearning developers, and learning teams.
                </h1>
                <p className="marketing-copy mt-4 max-w-3xl text-base leading-8">
                  Explore verified learning and development roles, from instructional design and learning experience design
                  to eLearning development and corporate training.
                </p>
              </div>

              <div className="marketing-panel p-5">
                <div className="rounded-[1.35rem] border border-[#dbe6d6] bg-[#f8fbf5] p-4">
                  <p className="text-sm font-semibold text-[#111827]">
                    Showing {visibleJobCountLabel} L&amp;D roles - register free to unlock full access
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[#5b6757]">
                    {unlockedJobCountLabel} active roles are currently available across the marketplace, while this page shows the public L&amp;D selection.
                  </p>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <StatCard label="Featured roles" value={formatCount(featuredJobs.length)} />
                  <StatCard label="Focus" value="India" />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {publicCategories.map((item) => (
                    <Link
                      key={item}
                      href={`/jobs?category=${encodeURIComponent(item)}`}
                      className="rounded-full border border-[#dbe6d6] bg-[#f8fbf5] px-4 py-2 text-sm font-medium text-[#2c3d29] transition hover:border-[#179720] hover:text-[#179720]"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {featuredJobs.length > 0 ? (
              <section className="marketing-grid-card border-[#d7ead2] bg-[linear-gradient(180deg,#fbfff8_0%,#f3fbef_100%)] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                  <BriefcaseBusiness className="h-4 w-4 text-[#23b61f]" />
                  Featured L&amp;D Roles
                </div>
                <p className="mt-2 text-sm text-[#5b6757]">
                  Priority openings curated for the marketplace and visible to candidates searching for high-intent L&amp;D roles.
                </p>
                <div className="mt-4 grid gap-3">
                  {featuredJobs.slice(0, 6).map((job) => (
                    <PublicJobCard key={job.id} job={job} featured />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-3xl font-semibold text-[#111827]">
                  {category ? `${category} jobs` : "Latest L&D job openings"}
                </h2>
                {(category || normalizedQuery) && (
                  <Link href="/jobs" className="marketing-secondary w-fit">
                    Clear filters
                  </Link>
                )}
              </div>

              <div className="grid gap-4">
                {jobsToRender.map((job) => (
                  <PublicJobCard key={job.id} job={job} />
                ))}

                {jobsToRender.length === 0 && (
                  <div className="marketing-grid-card py-20 text-center">
                    <Search className="mx-auto mb-4 h-12 w-12 text-[#d2d9ce]" />
                    <p className="font-semibold text-[#111827]">No public jobs matched that search right now.</p>
                    <p className="mt-2 text-[#6d7d68]">
                      Try a broader keyword like instructional designer, eLearning, learning, or remote.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

function matchesJob(job: PublicJobRecord, category?: string, query?: string) {
  const normalizedCategory = category?.trim().toLowerCase();
  const normalizedQuery = query?.trim().toLowerCase();
  const haystack = `${job.title} ${job.company || ""} ${job.location || ""} ${stripJobHtml(job.description)}`.toLowerCase();

  if (normalizedCategory && !haystack.includes(normalizedCategory)) {
    return false;
  }

  if (normalizedQuery && !haystack.includes(normalizedQuery)) {
    return false;
  }

  return true;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="marketing-soft-card p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">{label}</p>
      <p className="mt-3 text-4xl font-bold text-[#111827]">{value}</p>
    </div>
  );
}

function PublicJobCard({ job, featured = false }: { job: PublicJobRecord; featured?: boolean }) {
  const postedDate = new Date(getJobPostedDate(job)).toLocaleDateString();
  const expiryDate = job.expires_at ? new Date(job.expires_at).toLocaleDateString() : null;
  const preview = stripJobHtml(job.description);

  return (
    <article
      className={`marketing-grid-card p-6 transition-shadow hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)] ${
        featured ? "border-[#cfe6c8] bg-[linear-gradient(180deg,#ffffff_0%,#f7fcf4_100%)]" : ""
      }`}
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0 space-y-3">
          <div className="space-y-3">
            <h2 className="break-words text-xl leading-tight font-bold text-[#111827]">{job.title}</h2>
            {featured ? (
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#e9f8e3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#179720]">
                  Featured
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-start gap-4 text-sm text-[#5b6757]">
            <div className="flex items-start gap-1.5">
              <Building className="mt-0.5 h-4 w-4 shrink-0" />
              {job.company || "Verified employer"}
            </div>
            <div className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {getWorkModeLabel(job.work_mode, job.location)}
            </div>
            <div className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
              {getEmploymentTypeLabel(job.employment_type)}
            </div>
            <div className="flex items-start gap-1.5">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
              Posted {postedDate}
            </div>
            {expiryDate ? (
              <div className="flex items-start gap-1.5 text-amber-700">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                Expires {expiryDate}
              </div>
            ) : null}
          </div>
          <p className="line-clamp-3 text-sm leading-relaxed text-[#5b6757]">
            {preview || "Open the role to review the full responsibilities, skills, and application guidance."}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <Link href={buildPublicJobHref(job)} className="marketing-secondary whitespace-nowrap">
            View role
          </Link>
        </div>
      </div>
    </article>
  );
}
