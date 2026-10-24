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
import { formatDate } from "@/lib/date-format";

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

const seoJobLinks = [
  ["Instructional Design jobs", "/jobs/instructional-designer"],
  ["Learning Experience Design jobs", "/jobs/learning-experience-designer"],
  ["eLearning jobs", "/jobs/elearning-developer"],
  ["Learning Designer jobs", "/jobs/learning-designer"],
  ["LMS jobs", "/jobs/lms-administrator"],
  ["remote L&D jobs", "/jobs/remote-ld"],
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
    : "Instructional Designer Jobs in India | eLearning & L&D";
  const description = category
    ? `Explore current ${category.toLowerCase()} openings in India. Compare role details, work arrangements, and employer information before applying.`
    : "Find instructional designer, eLearning developer, and Learning & Development jobs in India. Explore current openings and available work arrangements.";

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
    name: "Instructional Designer and L&D Jobs in India",
    description:
      "Find current instructional designer, eLearning developer, and Learning & Development roles in India.",
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
          <div className="marketing-container space-y-7">
            <div className="grid gap-6 rounded-[1.75rem] border border-[#dce8d7] bg-white/80 p-5 shadow-[0_18px_50px_rgba(80,102,65,0.07)] sm:p-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <header>
                <div className="marketing-kicker">
                  <Sparkles className="h-3.5 w-3.5" />
                  Public job board
                </div>
                <h1 className="marketing-title mt-3 max-w-2xl text-4xl">
                  Instructional Designer &amp; L&amp;D Jobs in India
                </h1>
                <p className="marketing-copy mt-3 max-w-xl text-sm leading-6 sm:text-base">
                  Explore current instructional design, eLearning, and learning experience roles, with remote, hybrid, and on-site options where available.
                </p>
              </header>

              <form action="/jobs" method="get" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,0.65fr)_auto]">
                <label className="sr-only" htmlFor="job-search">Search jobs</label>
                <input
                  id="job-search"
                  name="q"
                  type="search"
                  defaultValue={q || ""}
                  placeholder="Role, skill, or location"
                  className="min-h-12 min-w-0 rounded-xl border border-[#d5e1d0] bg-white px-4 text-sm text-[#172116] outline-none transition placeholder:text-[#74816f] focus:border-[#179720] focus:ring-2 focus:ring-[#179720]/15"
                />
                <label className="sr-only" htmlFor="job-category">Filter by role</label>
                <select
                  id="job-category"
                  name="category"
                  defaultValue={category || ""}
                  className="min-h-12 min-w-0 rounded-xl border border-[#d5e1d0] bg-white px-4 text-sm text-[#2c3d29] outline-none focus:border-[#179720] focus:ring-2 focus:ring-[#179720]/15"
                >
                  <option value="">All L&amp;D roles</option>
                  {publicCategories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <button type="submit" className="marketing-primary min-h-12 rounded-xl px-5">
                  <Search className="h-4 w-4" />
                  Search
                </button>
                <p className="text-xs text-[#6d7d68] sm:col-span-3">
                  {visibleJobCountLabel} public roles · {unlockedJobCountLabel} active roles across the marketplace
                </p>
                {category || normalizedQuery ? (
                  <Link href="/jobs" className="text-sm font-semibold text-[#138d1a] hover:underline sm:col-span-3">
                    Clear search filters
                  </Link>
                ) : null}
              </form>
            </div>

            <nav aria-label="Browse job types" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className="font-semibold text-[#445340]">Browse roles:</span>
              {publicCategories.slice(0, 4).map((item) => (
                <Link
                  key={item}
                  href={`/jobs?category=${encodeURIComponent(item)}`}
                  className="text-[#138d1a] hover:underline"
                >
                  {item}
                </Link>
              ))}
            </nav>

            {featuredJobs.length > 0 ? (
              <section className="marketing-grid-card mx-auto w-full max-w-5xl min-w-0 border-[#d7ead2] bg-[linear-gradient(180deg,#fbfff8_0%,#f3fbef_100%)] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                  <BriefcaseBusiness className="h-4 w-4 text-[#23b61f]" />
                  Featured L&amp;D Roles
                </div>
                <p className="mt-2 text-sm text-[#5b6757]">
                  Selected openings from L&amp;D employers.
                </p>
                <div className="mt-4 grid gap-3">
                  {featuredJobs.slice(0, 5).map((job) => (
                    <PublicJobCard key={job.id} job={job} featured />
                  ))}
                </div>
                <div className="mt-4 text-right">
                  <Link href="/featuredjobs" className="marketing-secondary">
                    View more featured jobs
                  </Link>
                </div>
              </section>
            ) : null}

            <section className="mx-auto w-full max-w-5xl min-w-0 space-y-4">
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

              <div className="grid min-w-0 gap-4">
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

            <nav aria-label="More L&D job searches" className="border-t border-[#dce6d7] pt-5">
              <p className="text-sm font-semibold text-[#445340]">Explore more job searches</p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {seoJobLinks.map(([label, href]) => (
                  <Link key={label} href={href} className="text-[#138d1a] hover:underline">
                    {label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </section>
      </main>
    </div>
  );
}

function matchesJob(job: PublicJobRecord, category?: string, query?: string) {
  const normalizedCategory = category?.trim().toLowerCase();
  const normalizedQuery = query?.trim().toLowerCase();
  const haystack = `${job.title} ${job.company || ""} ${job.location || ""} ${job.work_mode || ""} ${job.employment_type || ""} ${stripJobHtml(job.description)}`.toLowerCase();

  if (normalizedCategory && !haystack.includes(normalizedCategory)) {
    return false;
  }

  if (normalizedQuery && !haystack.includes(normalizedQuery)) {
    return false;
  }

  return true;
}

function PublicJobCard({ job, featured = false }: { job: PublicJobRecord; featured?: boolean }) {
  const postedDate = formatDate(getJobPostedDate(job));
  const expiryDate = job.expires_at ? formatDate(job.expires_at) : null;
  const preview = stripJobHtml(job.description);

  return (
    <article
      className={`marketing-grid-card w-full max-w-full min-w-0 overflow-hidden p-5 transition-shadow sm:p-6 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)] ${
        featured ? "border-[#cfe6c8] bg-[linear-gradient(180deg,#ffffff_0%,#f7fcf4_100%)]" : ""
      }`}
    >
      <div className="flex w-full min-w-0 flex-col justify-between gap-4 md:flex-row md:items-start">
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

        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <Link href={buildPublicJobHref(job)} className="marketing-secondary min-w-28 whitespace-nowrap">
            View job
          </Link>
        </div>
      </div>
    </article>
  );
}
