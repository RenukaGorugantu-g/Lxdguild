import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Building, Clock3, MapPin } from "lucide-react";
import { formatDate } from "@/lib/date-format";
import {
  buildPublicJobHref,
  getEmploymentTypeLabel,
  getJobPostedDate,
  getPublicFeaturedJobs,
  getWorkModeLabel,
  stripJobHtml,
} from "@/lib/public-jobs";
import { getSiteUrl } from "@/lib/site-url";
import { toJsonLdScriptProps } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Featured L&D Jobs in India",
  description:
    "Browse all active featured instructional design, eLearning, and Learning & Development job opportunities.",
  alternates: { canonical: "/featuredjobs" },
  openGraph: {
    title: "Featured L&D Jobs in India",
    description: "Explore active roles selected by the L&D Guild team.",
    url: "/featuredjobs",
    type: "website",
  },
};

export default async function FeaturedJobsPage() {
  const jobs = await getPublicFeaturedJobs();
  const siteUrl = getSiteUrl();
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Featured L&D Jobs",
    description: "Active Learning and Development jobs selected by the L&D Guild team.",
    url: `${siteUrl}/featuredjobs`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: jobs.length,
      itemListElement: jobs.map((job, index) => ({
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
        <script type="application/ld+json" dangerouslySetInnerHTML={toJsonLdScriptProps(pageJsonLd)} />
        <section className="marketing-section pb-14 pt-3">
          <div className="marketing-container space-y-7">
            <header className="mx-auto w-full max-w-5xl">
              <p className="marketing-kicker"><BriefcaseBusiness className="h-3.5 w-3.5" /> Curated job board</p>
              <h1 className="marketing-title mt-3 text-4xl">Featured L&amp;D Jobs</h1>
              <p className="marketing-copy mt-3 max-w-2xl text-base leading-7">
                Browse every active role currently featured by the L&amp;D Guild team.
              </p>
              <p className="mt-3 text-sm text-[#5b6757]">
                {jobs.length} featured {jobs.length === 1 ? "job" : "jobs"}
              </p>
            </header>

            {jobs.length ? (
              <section aria-label="All featured jobs" className="mx-auto grid w-full max-w-5xl gap-4">
                {jobs.map((job) => (
                  <article key={job.id} className="marketing-grid-card min-w-0 overflow-hidden p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="break-words text-xl font-bold leading-tight text-[#111827]">
                          <Link href={buildPublicJobHref(job)} className="hover:text-[#138d1a]">
                            {job.title}
                          </Link>
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#5b6757]">
                          <span className="inline-flex items-center gap-1.5">
                            <Building className="h-4 w-4" /> {job.company || "Verified employer"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" /> {getWorkModeLabel(job.work_mode, job.location)}
                          </span>
                          <span>{getEmploymentTypeLabel(job.employment_type)}</span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-4 w-4" /> Posted {formatDate(getJobPostedDate(job))}
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#667085]">
                          {stripJobHtml(job.description) || "Open this role to review the full job details."}
                        </p>
                      </div>
                      <Link href={buildPublicJobHref(job)} className="marketing-secondary shrink-0 whitespace-nowrap">
                        View job
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            ) : (
              <div className="marketing-grid-card mx-auto w-full max-w-5xl p-8 text-center">
                <p className="font-semibold text-[#111827]">There are no active featured jobs right now.</p>
                <p className="mt-2 text-sm text-[#5b6757]">Check back soon or browse all current L&amp;D openings.</p>
                <Link href="/jobs" className="marketing-primary mt-5">Browse all jobs</Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
