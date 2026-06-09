import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Building, Calendar, Clock3, MapPin } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getBaseRole, isCandidateRole, isVerifiedCandidateRole } from "@/lib/profile-role";
import { getSiteUrl } from "@/lib/site-url";
import { toJsonLdScriptProps } from "@/lib/seo";
import {
  buildPublicJobHref,
  buildPublicJobUrl,
  getEmploymentTypeLabel,
  getJobPostedDate,
  getPublicJobById,
  getWorkModeLabel,
  parseJobIdFromSlug,
  stripJobHtml,
} from "@/lib/public-jobs";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPublicJobDescriptionHtml(value: string | null | undefined) {
  const raw = (value || "").trim();
  if (!raw) {
    return "<p>No job description provided yet.</p>";
  }

  const normalized = raw
    .replace(/\r/g, "")
    .replace(/^job description[:\s-]*/i, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const headingLabels = [
    "Role Overview",
    "Job Overview",
    "Overview",
    "Key Responsibilities",
    "Responsibilities",
    "Requirements",
    "Required Qualifications",
    "Qualifications",
    "Preferred Skills",
    "Preferred Qualifications",
    "Key Competencies",
    "Nice to Have",
    "Why Join Us",
    "Benefits",
    "Stipend",
    "Job Type",
  ];

  const headingSet = new Set(headingLabels.map((label) => label.toLowerCase()));
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const blocks: string[] = [];
  let paragraphBuffer: string[] = [];
  let bulletBuffer: string[] = [];

  const flushParagraphs = () => {
    if (paragraphBuffer.length === 0) return;
    blocks.push(`<p>${escapeHtml(paragraphBuffer.join(" "))}</p>`);
    paragraphBuffer = [];
  };

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    blocks.push(`<ul>${bulletBuffer.map((line) => `<li>${escapeHtml(line.replace(/^[-*•]\s+/, ""))}</li>`).join("")}</ul>`);
    bulletBuffer = [];
  };

  for (const line of lines) {
    if (/^[-*•]\s+/.test(line)) {
      flushParagraphs();
      bulletBuffer.push(line);
      continue;
    }

    const normalizedLine = line.replace(/:$/, "").toLowerCase();
    if (headingSet.has(normalizedLine)) {
      flushParagraphs();
      flushBullets();
      blocks.push(`<h3>${escapeHtml(line.replace(/:$/, ""))}</h3>`);
      continue;
    }

    flushBullets();
    paragraphBuffer.push(line);
  }

  flushParagraphs();
  flushBullets();

  return blocks.join("");
}

function toEmploymentSchemaValue(value?: string | null) {
  if (value === "part_time") return "PART_TIME";
  if (value === "contract") return "CONTRACTOR";
  return "FULL_TIME";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const jobId = parseJobIdFromSlug(slug);
  if (!jobId) {
    return {
      title: "Job Not Found",
      robots: { index: false, follow: false },
    };
  }

  const job = await getPublicJobById(jobId);
  if (!job) {
    return {
      title: "Job Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${job.title} at ${job.company || "LXD Guild Employer"} | L&D Jobs India`;
  const descriptionSource = stripJobHtml(job.description);
  const description = descriptionSource
    ? descriptionSource.length > 160
      ? `${descriptionSource.slice(0, 157).trim()}...`
      : descriptionSource
    : `Apply for ${job.title} at ${job.company || "a verified employer"} on LXD Guild Marketplace.`;

  return {
    title,
    description,
    alternates: {
      canonical: buildPublicJobHref(job),
    },
    openGraph: {
      title,
      description,
      url: buildPublicJobHref(job),
      type: "article",
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function PublicJobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const jobId = parseJobIdFromSlug(slug);
  if (!jobId) notFound();

  const job = await getPublicJobById(jobId);
  if (!job) notFound();

  const canonicalHref = buildPublicJobHref(job);
  if (slug !== canonicalHref.split("/").pop()) {
    permanentRedirect(canonicalHref);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let applyHref = "/candidate";
  let applyLabel = "Sign in to apply";

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const baseRole = getBaseRole(profile);
    if (baseRole === "candidate" || isVerifiedCandidateRole(profile?.role) || isCandidateRole(profile?.role)) {
      applyHref = `/dashboard/jobs/${job.id}`;
      applyLabel = "Apply through marketplace";
    } else if (baseRole === "employer" || baseRole === "admin") {
      applyHref = `/dashboard/jobs/${job.id}`;
      applyLabel = "Open internal view";
    }
  }

  const siteUrl = getSiteUrl();
  const postedDate = new Date(getJobPostedDate(job)).toLocaleDateString();
  const expiryDate = job.expires_at ? new Date(job.expires_at).toLocaleDateString() : null;
  const descriptionText = stripJobHtml(job.description);
  const descriptionHtml = formatPublicJobDescriptionHtml(job.description);
  const jobJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: descriptionText,
    datePosted: getJobPostedDate(job),
    validThrough: job.expires_at || undefined,
    employmentType: toEmploymentSchemaValue(job.employment_type),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company || "LXD Guild employer",
      sameAs: siteUrl,
      logo: `${siteUrl}/icon.png`,
    },
    jobLocationType: job.work_mode === "remote" ? "TELECOMMUTE" : undefined,
    jobLocation:
      job.work_mode === "remote"
        ? undefined
        : {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: job.location || "India",
              addressCountry: "IN",
            },
          },
    applicantLocationRequirements: {
      "@type": "Country",
      name: "India",
    },
    directApply: false,
    url: buildPublicJobUrl(job),
  };

  return (
    <div className="marketing-page">
      <main className="pt-22 sm:pt-24">
        <section className="marketing-section pb-14 pt-3">
          <div className="marketing-container">
            <script type="application/ld+json" dangerouslySetInnerHTML={toJsonLdScriptProps(jobJsonLd)} />
            <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-[#5f6d6b] transition hover:text-[#138d1a]">
              Back to jobs
            </Link>

            <div className="mt-6 overflow-hidden rounded-3xl border border-[#dce6d7] bg-white shadow-[0_16px_40px_rgba(87,108,67,0.07)]">
              <div className="border-b border-[#e7eee2] bg-[linear-gradient(180deg,#f8fcf5_0%,#f4faef_100%)] p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    {job.featured_rank != null ? (
                      <span className="inline-flex rounded-full bg-[#e9f8e3] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#179720]">
                        Featured role
                      </span>
                    ) : null}
                    <h1 className="text-4xl font-bold tracking-tight text-[#111827]">{job.title}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#5b6757]">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-4 w-4" />
                        {job.company || "Verified employer"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {getWorkModeLabel(job.work_mode, job.location)}
                      </div>
                      <div className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                        {getEmploymentTypeLabel(job.employment_type)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Posted {postedDate}
                      </div>
                      {expiryDate ? (
                        <div className="flex items-center gap-1.5 text-amber-700">
                          <Clock3 className="h-4 w-4" />
                          Expires {expiryDate}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="w-full rounded-2xl border border-[#dbe6d6] bg-[#f8fcf5] p-4 sm:min-w-[260px] sm:w-auto">
                    <p className="text-sm font-semibold text-[#11203b]">Ready to apply?</p>
                    <p className="mt-1 text-xs leading-6 text-[#5b6757]">
                      Sign in through LXD Guild to unlock ATS-backed profile support, resume matching, and the guided application flow.
                    </p>
                    <div className="mt-4 flex flex-col gap-2">
                      <Link href={applyHref} className="marketing-primary justify-center text-sm">
                        {applyLabel}
                      </Link>
                      <Link href="/candidate" className="marketing-secondary justify-center text-sm">
                        Explore candidate flow
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-8 p-8 lg:grid-cols-[minmax(0,1fr)_300px]">
                <section className="space-y-5">
                  <h2 className="text-2xl font-semibold text-[#111827]">Job description</h2>
                  <div
                    className="rounded-2xl bg-[#f8fbf5] p-6 text-[1rem] leading-8 text-[#5b6757] [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-[0.08em] [&_h3]:text-[#11203b] [&_p]:mb-4 [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:pl-1"
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                  >
                  </div>
                </section>

                <aside className="space-y-5">
                  <div className="rounded-2xl border border-[#dce6d7] bg-white p-5">
                    <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#6d7d68]">Role snapshot</h3>
                    <div className="mt-4 space-y-3 text-sm text-[#5b6757]">
                      <p>
                        <strong className="text-[#111827]">Company:</strong> {job.company || "Verified employer"}
                      </p>
                      <p>
                        <strong className="text-[#111827]">Location:</strong> {job.location || "India"}
                      </p>
                      <p>
                        <strong className="text-[#111827]">Work mode:</strong> {getWorkModeLabel(job.work_mode, job.location)}
                      </p>
                      <p>
                        <strong className="text-[#111827]">Employment type:</strong> {getEmploymentTypeLabel(job.employment_type)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#111827] p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
                    <p className="text-sm font-semibold">Why apply with LXD Guild?</p>
                    <p className="mt-2 text-sm leading-7 text-white/72">
                      Candidates get guided application support, stronger profile visibility, and access to an L&amp;D-focused hiring ecosystem instead of a generic job board.
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
