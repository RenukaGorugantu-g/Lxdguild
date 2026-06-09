import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getJobBoardAccessForUser } from "@/lib/job-board-access";
import { syncJobFeedIfStale } from "@/lib/job-feed";
import { filterMarketplaceRelevantJobs, shouldSurfaceMarketplaceJob } from "@/lib/marketplace-job-filter";
import { buildVisibleJobDedupKey } from "@/lib/job-dedupe";
import { isAdminRole } from "@/lib/profile-role";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { formatCount, getMarketplaceSeoCounts, toJsonLdScriptProps } from "@/lib/seo";
import { redirect } from "next/navigation";
import {
  BriefcaseBusiness,
  Building,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Lock,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import JobSidebar from "./JobSidebar";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; view?: string; remote?: string; schedule?: string; page?: string; q?: string }>;
}): Promise<Metadata> {
  const { activeJobs } = await getMarketplaceSeoCounts();
  const formattedJobs = formatCount(activeJobs || 31780);
  await searchParams;

  return {
    title: `${formattedJobs}+ Instructional Designer Jobs India | L&D Job Board`,
    description:
      "Browse verified instructional design, eLearning development, and L&D jobs in India. Full-time, remote, and freelance opportunities. Apply to exclusive L&D roles today.",
    keywords: [
      "Instructional designer jobs India",
      "eLearning developer jobs",
      "Learning experience designer openings",
      "L&D manager positions",
      "Curriculum developer careers",
      "Instructional design jobs remote",
      "Corporate trainer jobs",
      "Learning consultant opportunities",
      "Articulate Storyline developer jobs",
      "LMS administrator jobs",
      "Training specialist positions",
      "EdTech jobs India",
      "Full-time instructional design roles",
      "Freelance eLearning developer work",
      "L&D job board India",
    ],
    alternates: {
      canonical: "/jobs",
    },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: `${formattedJobs}+ Instructional Designer Jobs India | L&D Job Board`,
      description:
        "Browse verified instructional design, eLearning development, and L&D jobs in India. Full-time, remote, and freelance opportunities.",
      url: "/jobs",
    },
    twitter: {
      title: `${formattedJobs}+ Instructional Designer Jobs India | L&D Job Board`,
      description:
        "Browse verified instructional design, eLearning development, and L&D jobs in India. Full-time, remote, and freelance opportunities.",
    },
  };
}

type JobListItem = {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  location: string | null;
  work_mode?: string | null;
  employment_type?: string | null;
  expires_at: string | null;
  external_posted_at: string | null;
  imported_at: string | null;
  created_at?: string | null;
  is_active?: boolean | null;
  source?: string | null;
  job_kind?: string | null;
  featured_rank?: number | null;
  user_id?: string | null;
};

type JobSearchFilters = {
  category?: string;
  view?: string;
  remote?: string;
  schedule?: string;
  normalizedQuery: string;
};

type FilterableJobQuery = any;

const JOB_SELECT =
  "id, title, description, company, location, work_mode, employment_type, expires_at, external_posted_at, imported_at, created_at, is_active, source, job_kind, featured_rank, user_id";

const JOB_SELECT_FALLBACK =
  "id, title, description, company, location, work_mode, employment_type, expires_at, external_posted_at, imported_at, created_at, is_active, source, job_kind, user_id";

function stripHtmlPreview(value: string | null | undefined) {
  return decodeHtmlEntities((value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanFeaturedTitle(value: string) {
  return value
    .replace(/\s*-\s*T&O-?\s*\(S&C GN\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatJobCardHtml(value: string | null | undefined) {
  const raw = (value || "").trim();
  if (!raw) return "";

  return raw
    .replace(/<section>/gi, '<section class="job-card-section">')
    .replace(/<h4>/gi, '<h4 class="job-card-heading">')
    .replace(/<p>/gi, '<p class="job-card-copy">')
    .replace(/<ul>/gi, '<ul class="job-card-list">')
    .replace(/<li>/gi, '<li class="job-card-list-item">');
}

function extractOverviewPreview(value: string | null | undefined) {
  const raw = value || "";
  const titleMatch = raw.match(/<strong>\s*Job Title:\s*<\/strong>\s*([^<]+)/i);
  const experienceMatch = raw.match(/<strong>\s*Experience:\s*<\/strong>\s*([^<]+)/i);
  const locationMatch = raw.match(/<strong>\s*Location:\s*<\/strong>\s*([^<]+)/i);
  const skillsMatch = raw.match(/<strong>\s*Must have skills:\s*<\/strong>\s*([^<]+)/i);

  const title = cleanFeaturedTitle(stripHtmlPreview(titleMatch?.[1]));
  const experience = stripHtmlPreview(experienceMatch?.[1]);
  const location = stripHtmlPreview(locationMatch?.[1]);
  const skills = stripHtmlPreview(skillsMatch?.[1]);

  const overviewParts = [
    title || null,
    experience ? `Experience: ${experience}` : null,
    skills ? `Skills: ${skills}` : null,
  ].filter(Boolean);

  const overviewText = overviewParts.join(" | ");
  if (overviewText) {
    return overviewText.length > 165 ? `${overviewText.slice(0, 162).trim()}...` : overviewText;
  }

  const summaryMatch = raw.match(/<h4[^>]*>\s*Job Summary\s*<\/h4>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
  const summaryText = summaryMatch ? stripHtmlPreview(summaryMatch[1]) : stripHtmlPreview(raw);
  if (!summaryText) {
    return "Open the role to read the full description.";
  }

  return summaryText.length > 165 ? `${summaryText.slice(0, 162).trim()}...` : summaryText;
}

function dedupeFeaturedJobs(jobs: JobListItem[]) {
  const seen = new Set<string>();

  return jobs.filter((job) => {
    const key = `${job.title}|${job.company}|${job.location}`.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeJobListings(jobs: JobListItem[]) {
  const seen = new Set<string>();

  return jobs.filter((job) => {
    const key = buildVisibleJobDedupKey(job);

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildJobDetailHref(
  jobId: string,
  filters: {
    category?: string;
    view?: string;
    remote?: string;
    schedule?: string;
    normalizedQuery?: string;
    page?: number;
  }
) {
  const params = new URLSearchParams();
  if (filters.normalizedQuery) params.set("q", filters.normalizedQuery);
  if (filters.category) params.set("category", filters.category);
  if (filters.view && filters.view !== "all") params.set("view", filters.view);
  if (filters.remote && filters.remote !== "all") params.set("remote", filters.remote);
  if (filters.schedule && filters.schedule !== "all") params.set("schedule", filters.schedule);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  return `/dashboard/jobs/${jobId}${params.toString() ? `?${params.toString()}` : ""}`;
}

function normalizeJobText(...values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

function matchesRemoteFilter(job: JobListItem, remote?: string) {
  if (remote !== "remote") return true;
  if (job.work_mode) return job.work_mode === "remote";
  const text = normalizeJobText(job.location, job.title, job.description);
  return text.includes("remote") || text.includes("work from home") || text.includes("wfh");
}

function matchesScheduleFilter(job: JobListItem, schedule?: string) {
  if (!schedule || schedule === "all") return true;
  if (schedule === "full-time" && job.employment_type) return job.employment_type === "full_time";
  if (schedule === "part-time" && job.employment_type) return job.employment_type === "part_time";

  const text = normalizeJobText(job.title, job.description, job.location);

  if (schedule === "full-time") {
    return text.includes("full time") || text.includes("full-time") || text.includes("fulltime");
  }

  if (schedule === "part-time") {
    return text.includes("part time") || text.includes("part-time") || text.includes("parttime");
  }

  return true;
}

function applyJobFilters(query: FilterableJobQuery, filters: JobSearchFilters) {
  let nextQuery = query;

  if (filters.category) nextQuery = nextQuery.ilike("title", `%${filters.category}%`);
  if (filters.normalizedQuery) {
    nextQuery = nextQuery.or(
      `title.ilike.%${filters.normalizedQuery}%,company.ilike.%${filters.normalizedQuery}%,location.ilike.%${filters.normalizedQuery}%,description.ilike.%${filters.normalizedQuery}%`
    );
  }
  if (filters.view === "freelance" || filters.view === "standard") nextQuery = nextQuery.eq("job_kind", filters.view);
  if (filters.remote === "remote") nextQuery = nextQuery.eq("work_mode", "remote");
  if (filters.schedule === "full-time") nextQuery = nextQuery.eq("employment_type", "full_time");
  if (filters.schedule === "part-time") nextQuery = nextQuery.eq("employment_type", "part_time");

  return nextQuery;
}

async function getAdminUserIds(jobsReader: any) {
  const { data, error } = await jobsReader.from("profiles").select("id").eq("role", "admin");
  if (error) return new Set<string>();
  return new Set<string>((data || []).map((profile: { id: string }) => profile.id));
}

async function fetchJobsPage(
  jobsReader: any,
  adminUserIds: ReadonlySet<string>,
  filters: JobSearchFilters,
  currentPage: number,
  pageSize: number,
  excludeFeatured = false
) {
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let primaryQuery = applyJobFilters(
    jobsReader
      .from("jobs")
      .select(JOB_SELECT, { count: "exact" })
      .order("featured_rank", { ascending: true, nullsFirst: false })
      .order("external_posted_at", { ascending: false, nullsFirst: false })
      .order("imported_at", { ascending: false }),
    filters
  );

  if (excludeFeatured) {
    primaryQuery = primaryQuery.is("featured_rank", null);
  }

  primaryQuery = primaryQuery.range(from, to);

  const primaryResult = await primaryQuery;

  if (primaryResult.error?.code !== "42703") {
    return {
      data: filterMarketplaceRelevantJobs(
        (primaryResult.data || []).filter((job: JobListItem) => job.is_active !== false),
        { adminUserIds }
      ),
      count: primaryResult.count || 0,
      error: primaryResult.error,
    };
  }

  const fallbackQuery = applyJobFilters(
    jobsReader
      .from("jobs")
      .select(JOB_SELECT_FALLBACK, { count: "exact" })
      .order("created_at", { ascending: false }),
    filters
  ).range(from, to);

  const fallbackResult = await fallbackQuery;

  return {
    data: filterMarketplaceRelevantJobs(
      (fallbackResult.data || []).filter((job: JobListItem) => job.is_active !== false),
      { adminUserIds }
    ),
    count: fallbackResult.count || 0,
    error: fallbackResult.error,
  };
}

async function fetchFeaturedFreelanceJobs(
  jobsReader: any,
  adminUserIds: ReadonlySet<string>,
  filters: JobSearchFilters
): Promise<JobListItem[]> {
  const freelanceFilters: JobSearchFilters = {
    ...filters,
    view: "freelance",
  };

  const primaryQuery = applyJobFilters(
    jobsReader
      .from("jobs")
      .select(JOB_SELECT)
      .order("featured_rank", { ascending: true, nullsFirst: false })
      .order("external_posted_at", { ascending: false, nullsFirst: false })
      .order("imported_at", { ascending: false }),
    freelanceFilters
  ).limit(4);

  const primaryResult = await primaryQuery;

  if (primaryResult.error?.code !== "42703") {
    return filterMarketplaceRelevantJobs(
      (primaryResult.data || []).filter((job: JobListItem) => job.is_active !== false),
      { adminUserIds }
    );
  }

  const fallbackQuery = applyJobFilters(
    jobsReader
      .from("jobs")
      .select(JOB_SELECT_FALLBACK)
      .order("created_at", { ascending: false }),
    freelanceFilters
  ).limit(4);

  const fallbackResult = await fallbackQuery;
  return filterMarketplaceRelevantJobs(
    (fallbackResult.data || []).filter((job: JobListItem) => job.is_active !== false),
    { adminUserIds }
  );
}

async function fetchFeaturedJobs(jobsReader: any, adminUserIds: ReadonlySet<string>): Promise<JobListItem[]> {
  const primaryQuery = await jobsReader
    .from("jobs")
    .select(JOB_SELECT)
    .eq("is_active", true)
    .not("featured_rank", "is", null)
    .order("featured_rank", { ascending: true })
    .order("external_posted_at", { ascending: false, nullsFirst: false })
    .order("imported_at", { ascending: false })
    .limit(6);

  if (primaryQuery.error?.code !== "42703") {
    return dedupeFeaturedJobs(
      filterMarketplaceRelevantJobs(
        (primaryQuery.data || []).filter((job: JobListItem) => job.is_active !== false),
        { adminUserIds }
      )
    ).slice(0, 6);
  }

  return [] as JobListItem[];
}

export default async function JobsDashboard({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; view?: string; remote?: string; schedule?: string; page?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const jobsReader = adminSupabase ?? supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminUserIds = await getAdminUserIds(jobsReader);
  const { category, view, remote, schedule, page, q } = await searchParams;
  const isGuestViewer = !user;
  let profile: { role?: string | null } | null = null;
  let canApplyToJobs = false;
  let featuredJobsOnly = false;
  let isFreeAccessCandidate = false;
  let freeApplicationLimit = 0;
  let freeApplicationsUsed = 0;
  let freeApplicationsRemaining = 0;
  let lockReason = "Sign in to apply and unlock the full job board.";

  if (user) {
    const profileResult = await supabase.from("profiles").select("role").eq("id", user.id).single();
    profile = profileResult.data;

    if (!profile) {
      const ensuredProfile = await ensureUserProfile(user);
      if (!ensuredProfile) {
        redirect("/login");
      }
      profile = ensuredProfile;
    }

    const roleStr = String(profile.role || "").toLowerCase();
    if (!roleStr || (!roleStr.startsWith("candidate") && roleStr !== "admin")) {
      const ensuredProfile = await ensureUserProfile(user);
      if (ensuredProfile) {
        profile = ensuredProfile;
      }
    }

    const access = await getJobBoardAccessForUser(supabase, user.id, profile);
    if (!access.canViewJobBoard) {
      redirect("/dashboard");
    }

    canApplyToJobs = access.canApplyToJobs;
    featuredJobsOnly = access.featuredJobsOnly;
    isFreeAccessCandidate = access.isFreeAccessCandidate;
    freeApplicationLimit = access.freeApplicationLimit;
    freeApplicationsUsed = access.freeApplicationsUsed;
    freeApplicationsRemaining = access.freeApplicationsRemaining;
    lockReason = access.lockReason || lockReason;
  }

  const pageSize = isGuestViewer ? 10 : 12;
  const normalizedQuery = q?.trim() || "";
  const parsedPage = Number(page || "1");
  const requestedPage = Number.isFinite(parsedPage) ? Math.max(1, Math.trunc(parsedPage)) : 1;
  const filters: JobSearchFilters = { category, view, remote, schedule, normalizedQuery };

  const shouldSplitFeaturedJobs = view !== "freelance";
  let jobsPageResult = await fetchJobsPage(jobsReader, adminUserIds, filters, requestedPage, pageSize, shouldSplitFeaturedJobs);

  if ((jobsPageResult.count === 0 || jobsPageResult.data.length === 0) && !jobsPageResult.error) {
    await syncJobFeedIfStale();
    jobsPageResult = await fetchJobsPage(jobsReader, adminUserIds, filters, requestedPage, pageSize, shouldSplitFeaturedJobs);
  }

  let jobsList: JobListItem[] = dedupeJobListings((jobsPageResult.data as JobListItem[])
    .filter((job: JobListItem) => shouldSurfaceMarketplaceJob(job, { adminUserIds }))
    .filter((job: JobListItem) => matchesRemoteFilter(job, remote)));
  jobsList = jobsList.filter((job: JobListItem) => matchesScheduleFilter(job, schedule));

  const categories = ["Instructional Designer", "eLearning Developer", "Learning Experience Designer", "L&D Manager", "Curriculum Developer"];
  const featuredJobs: JobListItem[] = view === "freelance" ? [] : dedupeJobListings(await fetchFeaturedJobs(jobsReader, adminUserIds));
  const freelanceJobs: JobListItem[] = view === "freelance" ? [] : dedupeJobListings(await fetchFeaturedFreelanceJobs(jobsReader, adminUserIds, filters));
  const featuredFreelanceIds = new Set(freelanceJobs.map((job: JobListItem) => job.id));
  const totalJobs = jobsPageResult.count;
  const totalPages = Math.max(1, Math.ceil(totalJobs / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);

  if (requestedPage !== currentPage && totalJobs > 0) {
    jobsPageResult = await fetchJobsPage(jobsReader, adminUserIds, filters, currentPage, pageSize, shouldSplitFeaturedJobs);
    jobsList = dedupeJobListings((jobsPageResult.data as JobListItem[])
      .filter((job: JobListItem) => shouldSurfaceMarketplaceJob(job, { adminUserIds }))
      .filter((job: JobListItem) => matchesRemoteFilter(job, remote)));
    jobsList = jobsList.filter((job: JobListItem) => matchesScheduleFilter(job, schedule));
  }

  const jobsToRender = view === "freelance" ? jobsList : dedupeJobListings(jobsList.filter((job: JobListItem) => !featuredFreelanceIds.has(job.id)));
  const paginatedJobs = jobsToRender;
  const formattedTotalJobs = formatCount(totalJobs);
  const topCompanies = Array.from(
    new Set(
      [...featuredJobs, ...freelanceJobs, ...paginatedJobs]
        .map((job: JobListItem) => job.company?.trim())
        .filter((company): company is string => Boolean(company))
    )
  ).slice(0, 6);
  const schemaLeadJob = featuredJobs[0] || paginatedJobs[0] || freelanceJobs[0] || null;
  const pageTitle =
    view === "freelance"
      ? "Remote & Freelance eLearning Developer Jobs"
      : view === "standard"
        ? "Full-Time L&D Jobs in India"
        : `Browse ${formattedTotalJobs}+ Instructional Designer & L&D Jobs in India`;
  const pageDescription =
    view === "freelance"
      ? "Discover freelance eLearning developer work, contract instructional design roles, and remote L&D projects."
      : isGuestViewer
        ? "Browse instructional designer jobs in India, remote eLearning developer roles, and curated L&D opportunities before you sign in."
        : "Browse verified instructional design, eLearning development, and L&D jobs across India with full application access.";
  const activeFilterChips = [
    normalizedQuery ? `Search: ${normalizedQuery}` : null,
    remote === "remote" ? "Remote" : null,
    schedule === "full-time" ? "Full-time" : null,
    schedule === "part-time" ? "Part-time" : null,
  ].filter(Boolean);
  const jobsJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "L&D Job Board",
    description: "Browse instructional design jobs, eLearning developer positions, and L&D career opportunities across India.",
    url: "https://lxdmarketplace.lxdguild.com/jobs",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://lxdmarketplace.lxdguild.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Job Board",
          item: "https://lxdmarketplace.lxdguild.com/jobs",
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalJobs,
      itemListElement: schemaLeadJob
        ? [
            {
              "@type": "JobPosting",
              title: schemaLeadJob.title,
              hiringOrganization: {
                "@type": "Organization",
                name: schemaLeadJob.company || "LXD Guild employer",
              },
              jobLocation: {
                "@type": "Place",
                address: {
                  "@type": "PostalAddress",
                  addressLocality: schemaLeadJob.location || "India",
                  addressCountry: "IN",
                },
              },
              datePosted: schemaLeadJob.external_posted_at || schemaLeadJob.imported_at || schemaLeadJob.created_at || undefined,
              validThrough: schemaLeadJob.expires_at || undefined,
              employmentType: schemaLeadJob.employment_type?.toUpperCase() || "FULL_TIME",
              description: stripHtmlPreview(schemaLeadJob.description),
            },
          ]
        : [],
    },
  };

  const buildJobsHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (normalizedQuery) params.set("q", normalizedQuery);
    if (category) params.set("category", category);
    if (view && view !== "all") params.set("view", view);
    if (remote && remote !== "all") params.set("remote", remote);
    if (schedule && schedule !== "all") params.set("schedule", schedule);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/dashboard/jobs${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="marketing-page min-h-screen">
      <div className="marketing-section pt-32 pb-16">
        <div className="marketing-container space-y-8">
          <script type="application/ld+json" dangerouslySetInnerHTML={toJsonLdScriptProps(jobsJsonLd)} />
          <div className="lg:hidden">
            <JobSidebar categories={categories} />
          </div>

          <section className="grid items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="marketing-kicker">Curated opportunities</div>
              <div>
                <h1 className="marketing-title max-w-2xl text-5xl">{pageTitle}</h1>
                <p className="marketing-copy mt-4 max-w-2xl text-base leading-8">{pageDescription}</p>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5b6757]">
                  Explore instructional designer jobs in India, remote eLearning developer opportunities, curriculum
                  developer careers, and learning experience designer openings from one focused L&amp;D job board.
                </p>
              </div>
              {activeFilterChips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeFilterChips.map((chip) => (
                    <span key={chip} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#4f5b4b] shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>

              <div className="marketing-panel p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="marketing-soft-card p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Visible Roles</p>
                  <p className="mt-3 text-4xl font-bold text-[#17a21c]">{totalJobs}</p>
                  <div className="mt-3 h-1.5 rounded-full bg-[#e2ecd8]">
                    <div className="h-1.5 w-[82%] rounded-full bg-[#23b61f]" />
                  </div>
                </div>
                  <div className="marketing-soft-card p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Application Access</p>
                    <p className="mt-3 text-4xl font-bold text-[#111827]">
                    {isGuestViewer ? "Preview" : canApplyToJobs ? (isFreeAccessCandidate ? "Free" : "Open") : "Locked"}
                    </p>
                    <p className="mt-4 text-xs text-[#1da326]">
                    {isGuestViewer
                      ? "10 roles are visible before sign-in. Apply access unlocks after login."
                      : canApplyToJobs
                        ? featuredJobsOnly
                          ? "Only featured jobs are open until your assessment track is assigned"
                          : isFreeAccessCandidate
                            ? `${freeApplicationsRemaining} of ${freeApplicationLimit} free applications left`
                            : "Verified candidates can apply"
                        : lockReason || "Assessment required first"}
                    </p>
                  </div>
                </div>
              <div className="marketing-soft-card mt-4 p-4">
                <p className="text-sm font-semibold text-[#111827]">Marketplace Flow</p>
                <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {[34, 46, 28, 62, 44].map((height, index) => (
                    <div key={index} className={`${index === 3 ? "bg-[#35d421]" : "bg-[#dff5d8]"} rounded-t-xl`} style={{ height: `${height + 18}px` }} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="marketing-grid-card p-5">
              <h2 className="text-2xl font-semibold text-[#111827]">Top Instructional Design Companies Hiring Now</h2>
              <p className="mt-3 text-sm leading-7 text-[#5b6757]">
                These employers appear most often in the current marketplace mix for instructional design, eLearning
                development, and broader learning and development roles.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {topCompanies.length > 0 ? (
                  topCompanies.map((company) => (
                    <span key={company} className="rounded-full border border-[#dbe6d6] bg-[#f8fbf5] px-4 py-2 text-sm font-medium text-[#2c3d29]">
                      {company}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-[#dbe6d6] bg-[#f8fbf5] px-4 py-2 text-sm font-medium text-[#2c3d29]">
                    Verified employers
                  </span>
                )}
              </div>
            </div>

            <div className="marketing-grid-card p-5">
              <h2 className="text-2xl font-semibold text-[#111827]">Popular L&amp;D Job Categories</h2>
              <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#6d7d68]">
                Filter by Role Type, Location &amp; Schedule
              </h3>
              <div className="mt-5 flex flex-wrap gap-3">
                {categories.map((categoryName) => (
                  <Link
                    key={categoryName}
                    href={`/dashboard/jobs?category=${encodeURIComponent(categoryName)}`}
                    rel="nofollow"
                    className="rounded-full border border-[#dbe6d6] bg-[#f8fbf5] px-4 py-2 text-sm font-medium text-[#2c3d29] transition hover:border-[#23b61f] hover:text-[#179720]"
                  >
                    {categoryName}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-8 lg:flex-row">
            <div className="hidden lg:block">
              <JobSidebar categories={categories} />
            </div>

            <div className="flex-1 space-y-4">
              {view !== "freelance" && featuredJobs.length > 0 && (
                <div className="marketing-grid-card border-[#d7ead2] bg-[linear-gradient(180deg,#fbfff8_0%,#f3fbef_100%)] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                        <BriefcaseBusiness className="h-4 w-4 text-[#23b61f]" />
                        Featured Roles
                      </div>
                      <p className="mt-1 text-sm text-[#5b6757]">
                        Priority roles curated for the marketplace. These stay pinned at the top as you add more featured jobs.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {(isGuestViewer ? featuredJobs.slice(0, 2) : featuredJobs).map((job: JobListItem) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        canApplyToJobs={canApplyToJobs}
                        lockReason={lockReason}
                        detailHref={buildJobDetailHref(job.id, { category, view, remote, schedule, normalizedQuery, page: currentPage })}
                        featured
                      />
                    ))}
                  </div>
                </div>
              )}

              {view !== "freelance" && freelanceJobs.length > 0 && (
                <div className="marketing-grid-card p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                        <BriefcaseBusiness className="h-4 w-4 text-[#23b61f]" />
                        Freelance Jobs
                      </div>
                      <p className="mt-1 text-sm text-[#5b6757]">
                        Contract and consulting work sourced separately for freelance-focused members.
                      </p>
                    </div>
                    <Link href="/dashboard/jobs?view=freelance" rel="nofollow" className="marketing-secondary">
                      View all freelance jobs
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {(isGuestViewer ? freelanceJobs.slice(0, 2) : freelanceJobs).map((job: JobListItem) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        canApplyToJobs={canApplyToJobs}
                        compact
                        lockReason={lockReason}
                        detailHref={buildJobDetailHref(job.id, { category, view, remote, schedule, normalizedQuery, page: currentPage })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isFreeAccessCandidate && freeApplicationsRemaining > 0 && (
                <div className="marketing-grid-card flex flex-col items-start gap-4 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <BriefcaseBusiness className="h-4 w-4 text-emerald-700" />
                    {featuredJobsOnly
                      ? `You can apply only to featured jobs right now. ${freeApplicationsUsed} used, ${freeApplicationsRemaining} remaining.`
                      : `You are on free marketplace access. ${freeApplicationsUsed} used, ${freeApplicationsRemaining} remaining.`}
                  </div>
                  <Link href="/dashboard/candidate/profile" className="marketing-secondary px-4 py-2 text-sm">
                    Strengthen Profile
                  </Link>
                </div>
              )}

              {!canApplyToJobs && (
                <div className="marketing-grid-card flex flex-col items-start gap-4 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Lock className="h-4 w-4 text-amber-700" />
                    {lockReason || "Jobs are visible, but applying is locked. Complete the assessment to unlock applications."}
                  </div>
                  <Link
                    href={isGuestViewer ? "/candidate" : isFreeAccessCandidate ? "/dashboard/candidate/profile" : "/dashboard/candidate/exam"}
                    className="marketing-primary px-4 py-2 text-sm"
                  >
                    {isGuestViewer ? "Sign in to apply" : isFreeAccessCandidate ? "Get Verified" : "Write Assessment"}
                  </Link>
                </div>
              )}

              {(!jobsList || jobsList.length <= 3) && isAdminRole(profile?.role) && (
                <div className="marketing-grid-card flex flex-col items-start gap-4 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-[#335769]">
                    <RefreshCw className="h-4 w-4 text-[#23b61f]" />
                    Job board looks a bit empty. Want to sync fresh roles?
                  </div>
                  <Link href="/api/jobs/import" className="marketing-primary px-4 py-2 text-sm">
                    Sync Now
                  </Link>
                </div>
              )}

              <div className="grid gap-4">
                {paginatedJobs.map((job: JobListItem) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    canApplyToJobs={canApplyToJobs}
                    lockReason={lockReason}
                    detailHref={buildJobDetailHref(job.id, { category, view, remote, schedule, normalizedQuery, page: currentPage })}
                  />
                ))}

                {jobsList.length === 0 && (
                  <div className="marketing-grid-card py-20 text-center">
                    <Search className="mx-auto mb-4 h-12 w-12 text-[#d2d9ce]" />
                    <p className="font-semibold text-[#111827]">
                      {normalizedQuery ? `No jobs matched "${normalizedQuery}".` : "No jobs found right now."}
                    </p>
                    <p className="mt-2 text-[#6d7d68]">
                      {normalizedQuery ? "Try a broader keyword like designer, remote, curriculum, or learning." : "Check back soon for new opportunities."}
                    </p>
                  </div>
                )}
              </div>

              {totalJobs > 0 && totalPages > 1 && (
                <div className="marketing-grid-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-[#6d7d68]">
                    Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalJobs)} of {totalJobs} jobs
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentPage > 1 ? (
                      <Link href={buildJobsHref(currentPage - 1)} className="marketing-secondary gap-2">
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-[#dbe3d5] px-4 py-2 text-sm font-medium text-[#a4aca1]">
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </span>
                    )}

                    <span className="rounded-xl bg-[#111827] px-4 py-2 text-sm font-semibold text-white">
                      Page {currentPage} of {totalPages}
                    </span>

                    {currentPage < totalPages ? (
                      <Link href={buildJobsHref(currentPage + 1)} className="marketing-secondary gap-2">
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-[#dbe3d5] px-4 py-2 text-sm font-medium text-[#a4aca1]">
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function JobCard({
  job,
  canApplyToJobs,
  compact = false,
  lockReason,
  detailHref,
  featured = false,
}: {
  job: JobListItem;
  canApplyToJobs: boolean;
  compact?: boolean;
  lockReason?: string | null;
  detailHref: string;
  featured?: boolean;
}) {
  const expiryDate = job.expires_at ? new Date(job.expires_at).toLocaleDateString() : null;
  const freshnessDate = new Date(job.external_posted_at || job.imported_at || job.created_at || new Date().toISOString()).toLocaleDateString();
  const descriptionPreview = featured ? extractOverviewPreview(job.description) : stripHtmlPreview(job.description);
  const formattedDescription = formatJobCardHtml(job.description);

  return (
    <div
      className={`marketing-grid-card ${compact ? "p-4" : "p-6"} transition-shadow hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)] ${
        featured ? "border-[#cfe6c8] bg-[linear-gradient(180deg,#ffffff_0%,#f7fcf4_100%)]" : ""
      }`}
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className={`${compact ? "text-base" : "text-xl"} font-bold text-[#111827]`}>{job.title}</h2>
            {featured && (
              <span className="rounded-full bg-[#e9f8e3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#179720]">
                Featured
              </span>
            )}
            {job.featured_rank != null && (
              <span className="rounded-full bg-[#eef8e8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#138d1a]">
                Verified candidates preferred
              </span>
            )}
            {job.job_kind === "freelance" && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800">
                Freelance
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#5b6757]">
            <div className="flex items-center gap-1.5">
              <Building className="h-4 w-4" />
              {job.company}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {job.location}
            </div>
            {job.work_mode === "remote" && <div className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">Remote</div>}
            {job.employment_type === "full_time" && <div className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">Full-time</div>}
            {job.employment_type === "part_time" && <div className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">Part-time</div>}
            <div className="flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" />
              Posted {freshnessDate}
            </div>
            {expiryDate && (
              <div className="flex items-center gap-1.5 text-amber-700">
                <Clock3 className="h-4 w-4" />
                Expires {expiryDate}
              </div>
            )}
          </div>
          {!compact && (
            <>
              <details className="mt-2 group">
                <summary className="list-none cursor-pointer">
                  <div className="text-sm leading-relaxed text-[#5b6757] group-open:hidden">
                    <p className={featured ? "line-clamp-2" : "line-clamp-3"}>
                      {descriptionPreview}
                    </p>
                    <span className="mt-2 inline-flex text-xs font-semibold uppercase tracking-[0.14em] text-[#138d1a]">
                      Read more
                    </span>
                  </div>
                  <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-[#138d1a] group-open:inline-flex">
                    Show less
                  </span>
                </summary>
                <div
                  className="mt-3 text-sm leading-relaxed text-[#5b6757] [&_h4]:mt-4 [&_h4]:font-semibold [&_h4]:text-[#111827] [&_p]:mb-3 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: formattedDescription }}
                />
              </details>
            </>
          )}
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <Link href={detailHref} className="marketing-secondary whitespace-nowrap">
            {canApplyToJobs ? "View Details" : "View Role"}
          </Link>
          {!canApplyToJobs && (
          <div className="relative z-20 flex flex-col items-end gap-2">
            <p className="max-w-[220px] text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
              {lockReason || "Complete assessment to unlock"}
            </p>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
