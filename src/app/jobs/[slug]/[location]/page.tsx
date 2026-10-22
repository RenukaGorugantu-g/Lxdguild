import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RoleLandingContent from "../RoleLandingContent";
import { getPublicJobs } from "@/lib/public-jobs";
import {
  getJobRoleLanding,
  getJobsForRoleLocation,
  JOB_LOCATION_LANDINGS,
  MIN_INDEXABLE_LANDING_JOBS,
} from "@/lib/job-seo-landings";

type PageParams = Promise<{ slug: string; location: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { slug, location: locationSlug } = await params;
  const landing = getJobRoleLanding(slug);
  const location = JOB_LOCATION_LANDINGS.find((item) => item.slug === locationSlug);
  if (!landing || !location) {
    return { title: "Job Search Not Found", robots: { index: false, follow: false } };
  }

  const matchingJobs = getJobsForRoleLocation(await getPublicJobs(), landing, location.slug);
  const title = `${landing.role} Jobs in ${location.name}`;
  const description = `Browse current ${landing.role.toLowerCase()} opportunities in ${location.name}, India. Compare active roles and open each listing for full requirements and application details.`;
  const indexable = matchingJobs.length >= MIN_INDEXABLE_LANDING_JOBS;

  return {
    title,
    description,
    keywords: [`${landing.role} jobs in ${location.name}`, `${landing.role} jobs`, "L&D jobs India"],
    alternates: { canonical: `/jobs/${landing.slug}/${location.slug}` },
    robots: {
      index: indexable,
      follow: true,
      googleBot: { index: indexable, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    openGraph: { title, description, url: `/jobs/${landing.slug}/${location.slug}`, type: "website" },
    twitter: { title, description },
  };
}

export default async function RoleLocationJobsPage({ params }: { params: PageParams }) {
  const { slug, location: locationSlug } = await params;
  const landing = getJobRoleLanding(slug);
  const location = JOB_LOCATION_LANDINGS.find((item) => item.slug === locationSlug);
  if (!landing || !location) notFound();

  const jobs = getJobsForRoleLocation(await getPublicJobs(), landing, location.slug);
  return (
    <RoleLandingContent
      landing={{
        ...landing,
        slug: `${landing.slug}/${location.slug}`,
        title: `${landing.role} Jobs in ${location.name}`,
        description: `Browse current ${landing.role.toLowerCase()} opportunities in ${location.name}, India. Compare active roles and open each listing for full requirements and application details.`,
      }}
      jobs={jobs}
    />
  );
}
