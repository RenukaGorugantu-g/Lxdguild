import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { buildPublicJobHref, getJobPostedDate, getPublicJobs } from "@/lib/public-jobs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const jobs = await getPublicJobs();

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

  return [...staticEntries, ...jobEntries];
}
