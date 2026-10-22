import Link from "next/link";
import { BriefcaseBusiness, Building, MapPin } from "lucide-react";
import { buildPublicJobHref, getEmploymentTypeLabel, getWorkModeLabel, stripJobHtml, type PublicJobRecord } from "@/lib/public-jobs";
import { getSiteUrl } from "@/lib/site-url";
import { toJsonLdScriptProps } from "@/lib/seo";
import {
  JOB_LOCATION_LANDINGS,
  JOB_ROLE_LANDINGS,
  type JobRoleLanding,
} from "@/lib/job-seo-landings";

export default function RoleLandingContent({
  landing,
  jobs,
}: {
  landing: Omit<JobRoleLanding, "slug" | "title" | "description"> & {
    slug: string;
    title: string;
    description: string;
  };
  jobs: PublicJobRecord[];
}) {
  const visibleJobs = jobs.slice(0, 30);
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/jobs/${landing.slug}`;
  const [roleSlug, locationSlug] = landing.slug.split("/");
  const location = JOB_LOCATION_LANDINGS.find((item) => item.slug === locationSlug);
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: landing.title,
    description: landing.description,
    url: canonicalUrl,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "L&D Jobs in India", item: `${siteUrl}/jobs` },
        {
          "@type": "ListItem",
          position: 3,
          name: landing.role,
          item: location ? `${siteUrl}/jobs/${roleSlug}` : canonicalUrl,
        },
        ...(location
          ? [{ "@type": "ListItem", position: 4, name: location.name, item: canonicalUrl }]
          : []),
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: jobs.length,
      itemListElement: jobs.slice(0, 20).map((job, index) => ({
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
          <div className="marketing-container space-y-8">
            <nav aria-label="Breadcrumb" className="text-sm text-[#5f6d5b]">
              <Link href="/jobs" className="hover:text-[#138d1a]">L&amp;D jobs in India</Link>
              <span aria-hidden="true"> / </span>
              {location ? (
                <>
                  <Link href={`/jobs/${roleSlug}`} className="hover:text-[#138d1a]">{landing.role}</Link>
                  <span aria-hidden="true"> / </span>
                  <span>{location.name}</span>
                </>
              ) : <span>{landing.role}</span>}
            </nav>
            <header className="max-w-4xl">
              <p className="marketing-kicker"><BriefcaseBusiness className="h-4 w-4" /> Curated job search</p>
              <h1 className="marketing-title mt-3 text-4xl">{landing.title}</h1>
              <p className="marketing-copy mt-3 text-base leading-7">{landing.description}</p>
            </header>

            <section aria-labelledby="role-openings">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 id="role-openings" className="text-2xl font-semibold text-[#111827]">
                  {jobs.length} current {landing.role} {jobs.length === 1 ? "opening" : "openings"}
                </h2>
                <Link href="/candidate" className="marketing-primary">Create a candidate profile</Link>
              </div>
              {jobs.length ? (
                <div className="grid gap-4">
                  {visibleJobs.map((job) => (
                    <article key={job.id} className="marketing-grid-card p-5">
                      <h3 className="text-xl font-semibold text-[#111827]">
                        <Link href={buildPublicJobHref(job)} className="hover:text-[#138d1a]">{job.title}</Link>
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#5b6757]">
                        <span className="inline-flex items-center gap-1.5"><Building className="h-4 w-4" />{job.company || "Verified employer"}</span>
                        <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{getWorkModeLabel(job.work_mode, job.location)}</span>
                        <span>{getEmploymentTypeLabel(job.employment_type)}</span>
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#667085]">
                        {stripJobHtml(job.description) || "Open this role to review the complete job details."}
                      </p>
                      <Link href={buildPublicJobHref(job)} className="mt-4 inline-flex text-sm font-semibold text-[#138d1a]">
                        View job and application details
                      </Link>
                    </article>
                  ))}
                </div>
              ) : null}
              {jobs.length > visibleJobs.length ? (
                <p className="mt-4 text-sm text-[#5b6757]">
                  Showing 30 of {jobs.length} current openings.{" "}
                  <Link href={`/jobs?category=${encodeURIComponent(landing.role)}`} className="font-semibold text-[#138d1a] hover:underline">
                    Browse the full job board
                  </Link>
                </p>
              ) : null}
              {jobs.length === 0 ? (
                <div className="marketing-grid-card p-8 text-center">
                  <p className="font-semibold text-[#111827]">No current openings matched this role.</p>
                  <p className="mt-2 text-sm text-[#5b6757]">Browse the complete L&amp;D job board or check back for new roles.</p>
                  <Link href="/jobs" className="marketing-primary mt-4">Browse all jobs</Link>
                </div>
              ) : null}
            </section>

            {!location && landing.slug !== "remote-ld" ? (
              <nav aria-label="Location job searches" className="flex flex-wrap gap-3 border-t border-[#dce6d7] pt-6">
                <span className="w-full text-sm font-semibold text-[#111827]">Explore this role by location</span>
                {JOB_LOCATION_LANDINGS.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/jobs/${landing.slug}/${city.slug}`}
                    className="text-sm font-medium text-[#138d1a] hover:underline"
                  >
                    {landing.role} jobs in {city.name}
                  </Link>
                ))}
              </nav>
            ) : null}

            <nav aria-label="Related role searches" className="flex flex-wrap gap-3 border-t border-[#dce6d7] pt-6">
              {JOB_ROLE_LANDINGS.filter((item) => item.slug !== landing.slug).map((item) => (
                <Link key={item.slug} href={`/jobs/${item.slug}`} className="text-sm font-medium text-[#138d1a] hover:underline">
                  {item.role} jobs
                </Link>
              ))}
            </nav>
          </div>
        </section>
      </main>
    </div>
  );
}
