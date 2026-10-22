import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { buildPublicJobHref, getJobPostedDate, getPublicJobs } from "@/lib/public-jobs";
import {
  getJobsForRoleLanding,
  getJobsForRoleLocation,
  JOB_LOCATION_LANDINGS,
  JOB_ROLE_LANDINGS,
  MIN_INDEXABLE_LANDING_JOBS,
} from "@/lib/job-seo-landings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const jobs = await getPublicJobs();
  const roleLandingEntries: MetadataRoute.Sitemap = JOB_ROLE_LANDINGS.flatMap((landing) => {
    const matchingJobs = getJobsForRoleLanding(jobs, landing);
    if (matchingJobs.length < MIN_INDEXABLE_LANDING_JOBS) return [];

    return [{
      url: `${siteUrl}/jobs/${landing.slug}`,
      lastModified: new Date(
        Math.max(...matchingJobs.map((job) => new Date(getJobPostedDate(job)).getTime()))
      ),
      changeFrequency: "daily" as const,
      priority: 0.85,
    }];
  });
  const locationLandingEntries: MetadataRoute.Sitemap = JOB_ROLE_LANDINGS.flatMap((landing) =>
    JOB_LOCATION_LANDINGS.flatMap((location) => {
      const matchingJobs = getJobsForRoleLocation(jobs, landing, location.slug);
      if (matchingJobs.length < MIN_INDEXABLE_LANDING_JOBS) return [];

      return [{
        url: `${siteUrl}/jobs/${landing.slug}/${location.slug}`,
        lastModified: new Date(
          Math.max(...matchingJobs.map((job) => new Date(getJobPostedDate(job)).getTime()))
        ),
        changeFrequency: "daily" as const,
        priority: 0.8,
      }];
    })
  );

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/featuredjobs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/candidate`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/employer`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/membership`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${siteUrl}${buildPublicJobHref(job)}`,
    lastModified: new Date(getJobPostedDate(job)),
    changeFrequency: "daily",
    priority: job.featured_rank != null ? 0.9 : 0.8,
  }));

  return [...staticEntries, ...roleLandingEntries, ...locationLandingEntries, ...jobEntries];
}
