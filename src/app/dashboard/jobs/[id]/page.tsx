import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getJobBoardAccessForUser } from "@/lib/job-board-access";
import { deriveRoleKeyword, scoreSimilarJob } from "@/lib/job-preferences";
import { ensureUserProfile } from "@/lib/ensure-user-profile";
import { loadProfile } from "@/lib/load-profile";
import { getEmployerPlan, isAdminRole } from "@/lib/profile-role";
import { buildPublicJobHref, buildPublicJobUrl } from "@/lib/public-jobs";
import { decideApplicationStatus, downloadResumeBuffer } from "@/lib/resume-analysis";
import { getSiteUrl } from "@/lib/site-url";
import { toJsonLdScriptProps } from "@/lib/seo";
import { extractKeywords, extractSkills, parseResumeFile, scoreCandidate } from "../../../../../ats-module";
import { notFound, redirect } from "next/navigation";
import { MapPin, Building, Calendar, ArrowLeft, CheckCircle, Clock3 } from "lucide-react";
import Link from "next/link";
import ApplyButtonWithModal from "./ApplyButtonWithModal";
import ApplicationReviewActions from "./ApplicationReviewActions";
import ApplicationInterviewScheduleCard from "./ApplicationInterviewScheduleCard";
import EmployerPipelineBoard from "./EmployerPipelineBoard";
import { cache } from "react";

type ApplicantRow = {
  id: string;
  status: string;
  resume_id?: string | null;
  resume_url: string | null;
  created_at: string;
  user_id: string;
  ats_score?: number | string | null;
  ats_summary?: string | null;
  ats_auto_decision?: string | null;
};

type LiveAtsResult = {
  score: number;
  summary: string;
  autoDecision: string;
};

type InterviewScheduleSummary = {
  roundLabel?: string | null;
  startAt?: string | null;
  durationMinutes?: number | null;
  meetingProvider?: string | null;
  schedulingUrl?: string | null;
  notes?: string | null;
};

type CachedLiveAtsResult = LiveAtsResult & {
  cachedAt: number;
};

const LIVE_ATS_CACHE_TTL_MS = 10 * 60 * 1000;
const liveAtsCache = new Map<string, CachedLiveAtsResult>();

const getSeoJobRecord = cache(async (id: string) => {
  const supabase = await createClient();
  const adminSupabaseClient = createAdminClient();
  const jobsReader = adminSupabaseClient ?? supabase;

  const primaryQuery = await jobsReader
    .from("jobs")
    .select("id, title, description, company, location, external_posted_at, imported_at, created_at, expires_at, is_active, deleted_at")
    .eq("id", id)
    .single();

  if (!primaryQuery.error) {
    return primaryQuery.data as Pick<
      JobDetailRecord,
      "id" | "title" | "description" | "company" | "location" | "external_posted_at" | "imported_at" | "created_at" | "expires_at" | "is_active" | "deleted_at"
    > | null;
  }

  if (primaryQuery.error.code === "42703") {
    const fallbackQuery = await jobsReader
      .from("jobs")
      .select("id, title, description, company, location, created_at")
      .eq("id", id)
      .single();

    return fallbackQuery.data
      ? {
          ...fallbackQuery.data,
          external_posted_at: null,
          imported_at: fallbackQuery.data.created_at,
          expires_at: null,
          is_active: true,
          deleted_at: null,
        }
      : null;
  }

  return null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getSeoJobRecord(id);

  if (!job) {
    return {
      title: "Job Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const siteUrl = getSiteUrl();
  const title = `${job.title} at ${job.company || "LXD Guild Employer"} | L&D Jobs India`;
  const descriptionSource = stripHtml(job.description);
  const description = descriptionSource
    ? descriptionSource.length > 160
      ? `${descriptionSource.slice(0, 157).trim()}...`
      : descriptionSource
    : `Apply for ${job.title} at ${job.company || "a verified employer"} on LXD Guild Marketplace.`;
  const publicCanonical = buildPublicJobHref(job);

  return {
    title,
    description,
    alternates: {
      canonical: publicCanonical,
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
      title,
      description,
      url: publicCanonical,
      type: "article",
      images: [
        {
          url: `${siteUrl}/opengraph-image`,
          alt: `${job.title} on LXD Guild Marketplace`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}/twitter-image`],
    },
  };
}

function toNumericScore(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function stripHtml(value: string | null | undefined) {
  return (value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function legacyFormatJobDescriptionHtml(value: string | null | undefined) {
  const raw = (value || "").trim();
  if (!raw) {
    return "<p>No job description provided yet.</p>";
  }

  const withoutScripts = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const hasHtmlBlocks = /<(p|ul|ol|li|br|h1|h2|h3|h4|h5|h6|div)\b/i.test(withoutScripts);
  if (hasHtmlBlocks) {
    return withoutScripts
      .replace(/<section>/gi, '<section class="job-detail-section">')
      .replace(/<h4>/gi, '<h4 class="job-detail-heading">')
      .replace(/<p>/gi, '<p class="job-detail-copy">')
      .replace(/<ul>/gi, '<ul class="job-detail-list">')
      .replace(/<li>/gi, '<li class="job-detail-list-item">');
  }

  const normalized = withoutScripts
    .replace(/^job description[:\s-]*/i, "")
    .replace(/\r/g, "")
    .replace(/•/g, "\n• ")
    .replace(
      /\b(Description Summary|Overview|Responsibilities|Key Responsibilities|Requirements|Qualifications|Minimum Qualifications|Preferred Qualifications|Nice to Have|Skills Required|Benefits|About the Role|What You'll Do|Who You Are|What We're Looking For|Compensation|Location)\s*:/gi,
      "\n\n$1:"
    )
    .replace(/\s+\n/g, "\n")
    .trim();

  const sections = normalized
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);

  const renderedSections = sections.map((section) => {
    const lines = section
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return "";
    }

    const bulletLines = lines.filter((line) => /^[-*•]\s+/.test(line));
    if (bulletLines.length === lines.length) {
      return `<ul>${bulletLines
        .map((line) => `<li>${escapeHtml(line.replace(/^[-*•]\s+/, ""))}</li>`)
        .join("")}</ul>`;
    }

    const headingMatch = lines[0].match(
      /^(Description Summary|Overview|Responsibilities|Key Responsibilities|Requirements|Qualifications|Minimum Qualifications|Preferred Qualifications|Nice to Have|Skills Required|Benefits|About the Role|What You'll Do|Who You Are|What We're Looking For|Compensation|Location)\s*:\s*(.*)$/i
    );

    if (headingMatch) {
      const heading = headingMatch[1];
      const firstLineBody = headingMatch[2]?.trim();
      const remainingLines = lines.slice(1);
      const contentLines = [firstLineBody, ...remainingLines].filter(Boolean) as string[];
      const contentBullets = contentLines.filter((line) => /^[-*•]\s+/.test(line));

      if (contentBullets.length === contentLines.length && contentBullets.length > 0) {
        return `<section><h4>${escapeHtml(heading)}</h4><ul>${contentBullets
          .map((line) => `<li>${escapeHtml(line.replace(/^[-*•]\s+/, ""))}</li>`)
          .join("")}</ul></section>`;
      }

      return `<section><h4>${escapeHtml(heading)}</h4>${splitIntoReadableParagraphs(contentLines.join(" "))
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("")}</section>`;
    }

    return splitIntoReadableParagraphs(lines.join(" "))
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");
  });

  return renderedSections.join("");
}

function splitIntoReadableParagraphs(text: string) {
  return [text.trim()];
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizePlainTextDescription(value: string) {
  return decodeHtmlEntities(value)
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/â€¢/g, "•")
    .replace(/\s+•\s+/g, "\n• ")
    .replace(/\s+[·▪◦]\s+/g, "\n• ")
    .replace(/\s+�{1,}\s+/g, "\n• ")
    .replace(
      /\b(Description Summary|Overview|Responsibilities|Key Responsibilities|Requirements|Qualifications|Minimum Qualifications|Preferred Qualifications|Nice to Have|Skills Required|Benefits|About the Role|What You'll Do|Who You Are|What We're Looking For|Compensation|Location|Job Overview|About the Job)\s*:/gi,
      "\n\n$1:"
    )
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function renderDescriptionBlocks(lines: string[]) {
  const blocks: string[] = [];
  const paragraphLines: string[] = [];
  const bulletLines: string[] = [];

  const flushParagraphs = () => {
    if (paragraphLines.length === 0) return;
    blocks.push(
      ...paragraphLines.map((line) => `<p>${escapeHtml(line.replace(/\s+/g, " ").trim())}</p>`)
    );
    paragraphLines.length = 0;
  };

  const flushBullets = () => {
    if (bulletLines.length === 0) return;
    blocks.push(
      `<ul>${bulletLines
        .map((line) => `<li>${escapeHtml(line.replace(/^[-*•]\s+/, "").replace(/\s+/g, " ").trim())}</li>`)
        .join("")}</ul>`
    );
    bulletLines.length = 0;
  };

  for (const line of lines) {
    if (/^[-*•]\s+/.test(line)) {
      flushParagraphs();
      bulletLines.push(line);
      continue;
    }

    flushBullets();
    paragraphLines.push(line);
  }

  flushParagraphs();
  flushBullets();

  return blocks.join("");
}

function formatJobDescriptionHtml(value: string | null | undefined) {
  const raw = (value || "").trim();
  if (!raw) {
    return "<p>No job description provided yet.</p>";
  }

  const withoutScripts = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const hasHtmlBlocks = /<(p|ul|ol|li|br|h1|h2|h3|h4|h5|h6|div)\b/i.test(withoutScripts);
  if (hasHtmlBlocks) {
    return withoutScripts
      .replace(/<section>/gi, '<section class="job-detail-section">')
      .replace(/<h4>/gi, '<h4 class="job-detail-heading">')
      .replace(/<p>/gi, '<p class="job-detail-copy">')
      .replace(/<ul>/gi, '<ul class="job-detail-list">')
      .replace(/<li>/gi, '<li class="job-detail-list-item">');
  }

  const normalized = normalizePlainTextDescription(
    withoutScripts.replace(/^job description[:\s-]*/i, "")
  );

  const sections = normalized
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);

  const renderedSections = sections.map((section) => {
    const lines = section
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return "";
    }

    const bulletLines = lines.filter((line) => /^[-*•]\s+/.test(line));
    if (bulletLines.length === lines.length) {
      return `<ul>${bulletLines
        .map((line) => `<li>${escapeHtml(line.replace(/^[-*•]\s+/, ""))}</li>`)
        .join("")}</ul>`;
    }

    const headingMatch = lines[0].match(
      /^(Description Summary|Overview|Responsibilities|Key Responsibilities|Requirements|Qualifications|Minimum Qualifications|Preferred Qualifications|Nice to Have|Skills Required|Benefits|About the Role|What You'll Do|Who You Are|What We're Looking For|Compensation|Location|Job Overview|About the Job)\s*:\s*(.*)$/i
    );

    if (headingMatch) {
      const heading = headingMatch[1];
      const firstLineBody = headingMatch[2]?.trim();
      const remainingLines = lines.slice(1);
      const contentLines = [firstLineBody, ...remainingLines].filter(Boolean) as string[];
      const contentBullets = contentLines.filter((line) => /^[-*•]\s+/.test(line));

      if (contentBullets.length === contentLines.length && contentBullets.length > 0) {
        return `<section><h4>${escapeHtml(heading)}</h4><ul>${contentBullets
          .map((line) => `<li>${escapeHtml(line.replace(/^[-*•]\s+/, ""))}</li>`)
          .join("")}</ul></section>`;
      }

      return `<section><h4>${escapeHtml(heading)}</h4>${renderDescriptionBlocks(contentLines)}</section>`;
    }

    return renderDescriptionBlocks(lines);
  });

  return renderedSections.join("");
}

function extractMinimumYearsOfExperience(description: string) {
  const normalized = description.toLowerCase();
  const patterns = [
    /(\d{1,2})\+?\s+years? of experience/g,
    /minimum of\s+(\d{1,2})\+?\s+years?/g,
    /at least\s+(\d{1,2})\+?\s+years?/g,
    /(\d{1,2})\+?\s+years? experience/g,
  ];
  const matches: number[] = [];

  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      matches.push(Number(match[1]));
    }
  }

  return matches.length ? Math.max(...matches) : 0;
}

function buildAtsSummary({
  score,
  skillMatch,
  experienceMatch,
  keywordMatch,
  roleAlignment,
  missingSkills,
}: {
  score: number;
  skillMatch: number;
  experienceMatch: number;
  keywordMatch: number;
  roleAlignment: number;
  missingSkills: string[];
}) {
  const summaryParts = [
    `ATS score ${score}%`,
    `skill match ${skillMatch}%`,
    `experience match ${experienceMatch}%`,
    `keyword relevance ${keywordMatch}%`,
    `role alignment ${roleAlignment}%`,
  ];

  if (missingSkills.length > 0) {
    summaryParts.push(`missing skills: ${missingSkills.slice(0, 5).join(", ")}`);
  }

  return `${summaryParts.join(" | ")}.`;
}

async function computeLiveAtsResultForApplicant({
  job,
  applicant,
}: {
  job: JobDetailRecord;
  applicant: ApplicantRow;
}): Promise<LiveAtsResult | null> {
  const cacheKey = `${applicant.id}:${applicant.resume_url || "no-resume"}:${job.id}`;
  const cachedEntry = liveAtsCache.get(cacheKey);

  if (cachedEntry && Date.now() - cachedEntry.cachedAt < LIVE_ATS_CACHE_TTL_MS) {
    return {
      score: cachedEntry.score,
      summary: cachedEntry.summary,
      autoDecision: cachedEntry.autoDecision,
    };
  }

  if (!applicant.resume_url) {
    return null;
  }

  try {
    const jobDescription = stripHtml(job.description);
    const scoringSource = `${job.title} ${jobDescription}`.trim();
    const requiredSkills = extractSkills(scoringSource);
    const keywords = extractKeywords(scoringSource, requiredSkills);
    const minimumYearsOfExperience = extractMinimumYearsOfExperience(jobDescription);

    const resumeFile = await downloadResumeBuffer({
      fileUrl: applicant.resume_url,
      fileName: `resume-${applicant.id}.pdf`,
    });

    const parsedResume = await parseResumeFile({
      fileName: resumeFile.fileName,
      mimeType: resumeFile.mimeType || undefined,
      buffer: resumeFile.buffer,
    });

    const scoringResult = scoreCandidate({
      job: {
        title: job.title,
        description: jobDescription,
        requiredSkills,
        preferredSkills: [],
        minimumYearsOfExperience,
        keywords,
      },
      resume: parsedResume,
    });

    const liveAtsResult = {
      score: scoringResult.score,
      summary: buildAtsSummary(scoringResult),
      autoDecision: decideApplicationStatus(scoringResult.score).autoDecision,
    };

    liveAtsCache.set(cacheKey, {
      ...liveAtsResult,
      cachedAt: Date.now(),
    });

    return liveAtsResult;
  } catch (error) {
    console.error("[job-detail] live ATS fallback failed", {
      applicationId: applicant.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

type ApplicantProfile = {
  id: string;
  name: string | null;
  headline: string | null;
  email: string | null;
  role?: string | null;
  portfolio_url?: string | null;
};

type ViewerProfile = {
  id: string;
  role?: string | null;
  name?: string | null;
  headline?: string | null;
  email?: string | null;
  skills?: string[] | null;
};

type SuggestedJob = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  expires_at: string | null;
};

type JobDetailRecord = {
  id: string;
  title: string;
  description: string | null;
  company: string | null;
  location: string | null;
  apply_url?: string | null;
  user_id?: string | null;
  external_posted_at?: string | null;
  imported_at?: string | null;
  created_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean | null;
  deletion_request_status?: string | null;
  deleted_at?: string | null;
  featured_rank?: number | null;
};

function isMissingColumnError(message?: string | null) {
  const normalized = message || "";
  return (
    normalized.includes("Could not find") ||
    normalized.includes("does not exist") ||
    normalized.includes("schema cache")
  );
}

async function getApplicantsForJob(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string
) {
  const fullQuery = await supabase
    .from("job_applications")
    .select("id, status, resume_id, resume_url, created_at, user_id, ats_score, ats_summary, ats_auto_decision")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (!fullQuery.error) {
    return fullQuery;
  }

  if (fullQuery.error.code !== "42703" && !isMissingColumnError(fullQuery.error.message)) {
    return fullQuery;
  }

  const legacyQuery = await supabase
    .from("job_applications")
    .select("id, status, resume_url, created_at, user_id")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  return {
    ...legacyQuery,
    data: (legacyQuery.data || []).map((application) => ({
      ...application,
      resume_id: null,
      ats_score: null,
      ats_summary: null,
      ats_auto_decision: null,
    })),
  };
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string; view?: string; remote?: string; schedule?: string; page?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const adminSupabaseClient = createAdminClient();
  const jobsReader = adminSupabaseClient ?? supabase;
  const { id } = await params;
  const { category, view, remote, schedule, page, q } = await searchParams;
  
  const { data: { user } } = await supabase.auth.getUser();
  const isGuestViewer = !user;

  let profile: ViewerProfile | null = null;

  if (user) {
    profile = await loadProfile<ViewerProfile>(
      supabase,
      user.id,
      "id, role, name, headline, email, skills"
    );

    if (!profile) {
      const ensuredProfile = await ensureUserProfile(user);
      if (ensuredProfile) {
        profile = await loadProfile<ViewerProfile>(
          supabase,
          user.id,
          "id, role, name, headline, email, skills"
        );
      }
    }

    if (!profile) {
      redirect("/dashboard");
    }
  }

  const jobQuery = await jobsReader
    .from("jobs")
    .select("id, title, description, company, location, apply_url, user_id, external_posted_at, imported_at, created_at, expires_at, is_active, deletion_request_status, deleted_at, featured_rank")
    .eq("id", id)
    .single();
  let job = jobQuery.data as JobDetailRecord | null;

  if (jobQuery.error?.code === "42703") {
    const fallbackJobQuery = await jobsReader
      .from("jobs")
      .select("id, title, description, company, location, apply_url, user_id, created_at")
      .eq("id", id)
      .single();

    job = fallbackJobQuery.data
      ? {
          ...fallbackJobQuery.data,
          external_posted_at: null,
          imported_at: fallbackJobQuery.data.created_at,
          expires_at: null,
          is_active: true,
          deletion_request_status: "none",
          deleted_at: null,
        }
      : null;
  }

  if (!job) notFound();

  const isJobOwner = Boolean(user?.id) && user?.id === job.user_id;
  const isAdminViewer = isAdminRole(profile?.role);
  const canReviewApplicantPipeline = isJobOwner || isAdminViewer;
  let canApplyToJobs = false;
  let featuredJobsOnly = false;
  let isFreeAccessCandidate = false;
  let freeApplicationsRemaining = 0;
  let lockReason = "Sign in to apply and unlock the full job board.";

  if (user && profile) {
    const access = await getJobBoardAccessForUser(supabase, user.id, profile);
    canApplyToJobs = access.canApplyToJobs;
    featuredJobsOnly = access.featuredJobsOnly;
    isFreeAccessCandidate = access.isFreeAccessCandidate;
    freeApplicationsRemaining = access.freeApplicationsRemaining;
    lockReason = access.lockReason || lockReason;
  }

  if (job.deleted_at && profile?.role !== "admin" && !isJobOwner) {
    notFound();
  }

  const isMvpCandidate = profile?.role === "candidate_mvp";
  const isCandidateViewer = profile?.role?.startsWith("candidate");
  const employerPlan = getEmployerPlan(profile?.role);
  const isPaidEmployer = isAdminRole(profile?.role) || employerPlan === "pro" || employerPlan === "premium";
  const canApplyToJob =
    !isGuestViewer &&
    isCandidateViewer &&
    !isJobOwner &&
    canApplyToJobs &&
    (!featuredJobsOnly || job.featured_rank != null);
  const applyLockReason =
    featuredJobsOnly && job.featured_rank == null
      ? "Only featured jobs are available until your assessment track is assigned."
      : lockReason;
  const roleKeyword = deriveRoleKeyword(job.title);

  const resumes = user
    ? (await supabase
        .from("resumes")
        .select("id, file_url, file_name")
        .eq("user_id", user.id)).data
    : [];

  const application = user
    ? (await supabase
        .from("job_applications")
        .select("id")
        .eq("job_id", id)
        .eq("user_id", user.id)
        .maybeSingle()).data
    : null;

  const savedCompanyQuery = user && !isJobOwner && job.company
    ? await supabase
        .from("saved_companies")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_name", job.company)
        .maybeSingle()
    : { data: null, error: null };
  const savedCompany = savedCompanyQuery.error?.code === "42P01" ? null : savedCompanyQuery.data;

  const followedRoleQuery = user && !isJobOwner
    ? await supabase
        .from("followed_job_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("keyword", roleKeyword)
        .maybeSingle()
    : { data: null, error: null };
  const followedRole = followedRoleQuery.error?.code === "42P01" ? null : followedRoleQuery.data;

  const { data: applicants } = canReviewApplicantPipeline
    ? await getApplicantsForJob(supabase, id)
    : { data: null };
  const liveAtsByApplicationId = new Map<string, LiveAtsResult>();
  const interviewSchedulesByApplicationId = new Map<string, InterviewScheduleSummary>();

  const applicantUserIds = ((applicants || []) as ApplicantRow[]).map((app) => app.user_id).filter(Boolean);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminSupabase =
    serviceRoleKey && supabaseUrl
      ? createSupabaseClient(supabaseUrl, serviceRoleKey)
      : null;
  const profileReader = canReviewApplicantPipeline && adminSupabase ? adminSupabase : supabase;
  let applicantProfiles: ApplicantProfile[] = [];
  if (applicantUserIds.length) {
    const fullProfileQuery = await profileReader
      .from("profiles")
      .select("id, name, headline, email, role, portfolio_url")
      .in("id", applicantUserIds);

    if (!fullProfileQuery.error) {
      applicantProfiles = (fullProfileQuery.data || []) as ApplicantProfile[];
    } else if (fullProfileQuery.error.code === "42703" || isMissingColumnError(fullProfileQuery.error.message)) {
      const fallbackProfileQuery = await profileReader
        .from("profiles")
        .select("id, name, headline, email, role")
        .in("id", applicantUserIds);

      applicantProfiles = (fallbackProfileQuery.data || []) as ApplicantProfile[];
    }
  }

  const applicantProfilesById = new Map(applicantProfiles.map((p) => [p.id, p]));
  if (canReviewApplicantPipeline && applicantUserIds.length && adminSupabase) {
    const interviewNotificationsQuery = await adminSupabase
      .from("notifications")
      .select("id, user_id, type, data, created_at")
      .in("user_id", applicantUserIds)
      .eq("type", "job_interview_scheduled")
      .order("created_at", { ascending: false })
      .limit(200);

    for (const notification of interviewNotificationsQuery.data || []) {
      const data = notification.data as Record<string, unknown> | null;
      const applicationId = typeof data?.application_id === "string" ? data.application_id : null;

      if (!applicationId || interviewSchedulesByApplicationId.has(applicationId)) {
        continue;
      }

      interviewSchedulesByApplicationId.set(applicationId, {
        roundLabel: typeof data?.round_label === "string" ? data.round_label : null,
        startAt: typeof data?.start_at === "string" ? data.start_at : null,
        durationMinutes:
          typeof data?.duration_minutes === "number"
            ? data.duration_minutes
            : typeof data?.duration_minutes === "string"
              ? Number(data.duration_minutes)
              : null,
        meetingProvider: typeof data?.meeting_provider === "string" ? data.meeting_provider : null,
        schedulingUrl: typeof data?.scheduling_url === "string" ? data.scheduling_url : null,
        notes: typeof data?.notes === "string" ? data.notes : null,
      });
    }
  }

  if (canReviewApplicantPipeline && applicants?.length) {
    const liveAtsEntries = await Promise.all(
      (applicants as ApplicantRow[]).map(async (applicant) => {
        if (toNumericScore(applicant.ats_score) !== null || applicant.ats_summary || applicant.ats_auto_decision) {
          return null;
        }

        const liveAts = await computeLiveAtsResultForApplicant({ job, applicant });
        return liveAts ? [applicant.id, liveAts] as const : null;
      })
    );

    for (const entry of liveAtsEntries) {
      if (entry) {
        liveAtsByApplicationId.set(entry[0], entry[1]);
      }
    }
  }
  const visibleApplicantRows =
    canReviewApplicantPipeline && !isPaidEmployer
      ? (((applicants as ApplicantRow[] | null) || []).slice(0, 5))
      : (((applicants as ApplicantRow[] | null) || []));
  const hiddenApplicantCount =
    canReviewApplicantPipeline && !isPaidEmployer && applicants?.length
      ? Math.max((applicants.length || 0) - visibleApplicantRows.length, 0)
      : 0;
  const recommendationQuery = supabase
    .from("jobs")
    .select("id, title, company, location, expires_at, created_at, is_active")
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .neq("id", id)
    .order("external_posted_at", { ascending: false, nullsFirst: false })
    .order("imported_at", { ascending: false })
    .limit(40);
  const recommendationResult = await recommendationQuery;
  let recommendationPool: SuggestedJob[] | null = recommendationResult.data as SuggestedJob[] | null;
  const recommendationError = recommendationResult.error;

  if (recommendationError?.code === "42703") {
    const fallbackRecommendations = await supabase
      .from("jobs")
      .select("id, title, company, location, created_at")
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(40);

    recommendationPool = (fallbackRecommendations.data || []).map((item) => ({
      ...item,
      expires_at: null,
    })) as SuggestedJob[];
  }

  const similarJobs = (recommendationPool || [])
    .map((item) => ({
      ...item,
      score: scoreSimilarJob(job.title, item.title, item.company === job.company),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const postedDateSource = job.external_posted_at || job.imported_at || job.created_at || new Date().toISOString();
  const postedDate = new Date(postedDateSource).toLocaleDateString();
  const expiryDate = job.expires_at ? new Date(job.expires_at).toLocaleDateString() : null;
  const isDeactivated = job.is_active === false;
  const hasPendingDeletion = job.deletion_request_status === "pending";
  const siteUrl = getSiteUrl();
  const jobJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: stripHtml(job.description),
    datePosted: job.external_posted_at || job.imported_at || job.created_at || undefined,
    validThrough: job.expires_at || undefined,
    employmentType: undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company || "LXD Guild employer",
      sameAs: siteUrl,
      logo: `${siteUrl}/icon.png`,
    },
    jobLocation: {
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
  const returnParams = new URLSearchParams();
  if (q) returnParams.set("q", q);
  if (category) returnParams.set("category", category);
  if (view) returnParams.set("view", view);
  if (remote) returnParams.set("remote", remote);
  if (schedule) returnParams.set("schedule", schedule);
  if (page && page !== "1") returnParams.set("page", page);
  const backToJobsHref = `/dashboard/jobs${returnParams.toString() ? `?${returnParams.toString()}` : ""}`;

  return (
    <div className="min-h-screen bg-zinc-50 pt-28 pb-16 px-4 sm:px-6">
      <div className={`${isJobOwner ? "max-w-7xl" : "max-w-4xl"} mx-auto`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={toJsonLdScriptProps(jobJsonLd)} />
        <Link href={backToJobsHref} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-brand-600 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Job Board
        </Link>

        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex h-32 items-end border-b border-zinc-100 bg-gradient-to-r from-brand-600/10 to-accent-600/10 p-8">
             <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-white -mb-12 shadow-md">
                <Building className="w-8 h-8 text-brand-600" />
             </div>
          </div>

          <div className="p-8 pt-16">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4">
                {job.featured_rank != null && (
                  <div className="inline-flex items-center rounded-full border border-[#d8edd5] bg-[#eef9ea] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#179720]">
                    Featured role
                  </div>
                )}
                <h1 className="text-4xl font-bold tracking-tight">{job.title}</h1>
                {isDeactivated && (
                  <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
                    This job is deactivated
                  </div>
                )}
                {hasPendingDeletion && (isJobOwner || profile?.role === "admin") && (
                  <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-800">
                    Delete request pending admin review
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-6 text-zinc-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-brand-600" /> {job.company}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-600" /> {job.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-600" /> {postedDate}
                  </div>
                </div>
              </div>

              {isGuestViewer ? (
                <div className="w-full rounded-2xl border border-[#dbe6d6] bg-[#f8fcf5] p-4 sm:min-w-[240px] sm:w-auto">
                  <p className="text-sm font-semibold text-[#11203b]">Guest preview</p>
                  <p className="mt-1 text-xs leading-6 text-[#5b6757]">
                    You can review the role details now. Sign in to upload a resume, unlock ATS guidance, and apply.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link href="/candidate" className="marketing-primary justify-center text-sm">
                      Sign in to apply
                    </Link>
                    <Link href="/candidate" className="marketing-secondary justify-center text-sm">
                      Explore candidate flow
                    </Link>
                  </div>
                </div>
              ) : isCandidateViewer && profile ? (
                <div className="flex w-full flex-col gap-3 sm:min-w-[200px] sm:w-auto">
                  <ApplyButtonWithModal
                    job={job}
                    profile={profile}
                    resumes={resumes || []}
                    alreadyApplied={!!application}
                    canApply={canApplyToJob}
                    roleKeyword={roleKeyword}
                    similarJobs={similarJobs}
                    isCompanySaved={!!savedCompany}
                    isRoleFollowed={!!followedRole}
                    lockReason={
                      applyLockReason ||
                      "Write the assessment to unlock job applications."
                    }
                    backToJobsHref={backToJobsHref}
                  />
                  <p className="text-[10px] text-center text-zinc-400 uppercase tracking-widest font-bold">
                    {isFreeAccessCandidate && freeApplicationsRemaining > 0
                      ? `${freeApplicationsRemaining} free application${freeApplicationsRemaining === 1 ? "" : "s"} remaining`
                      : "We track your application here, then send you to the official apply page"}
                  </p>
                </div>
              ) : (
                <div className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:min-w-[220px] sm:w-auto">
                  <p className="text-sm font-semibold text-zinc-700">{profile?.role === "admin" ? "Admin view" : "Employer view"}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {profile?.role === "admin"
                      ? "You can edit this role directly or review the applicants below."
                      : "Application controls are available in the applicants list below."}
                  </p>
                  {(isJobOwner || profile?.role === "admin") && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/employer/jobs/${job.id}/edit`}
                        className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Edit Job
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-12">
               <div className="md:col-span-2 space-y-8">
                  <section>
                    <h3 className="text-xl font-bold mb-4">Job Description</h3>
                    <div 
                      className="space-y-4 text-[1.02rem] leading-8 text-zinc-700 [&_h4]:mt-6 [&_h4]:text-base [&_h4]:font-bold [&_h4]:uppercase [&_h4]:tracking-[0.08em] [&_h4]:text-[#11203b] [&_p]:mb-4 [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:pl-1"
                      dangerouslySetInnerHTML={{ __html: formatJobDescriptionHtml(job.description) }}
                    />
                  </section>
               </div>

               <div className="space-y-6">
                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
                     <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-zinc-400">Hiring Process</h4>
                     <ul className="space-y-4">
                        <li className="flex gap-3 text-sm">
                           <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-600">1</div>
                           <span>LXD Guild Skill Validation</span>
                        </li>
                        <li className="flex gap-3 text-sm">
                           <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-600">2</div>
                           <span>Internal Portfolio Review</span>
                        </li>
                        <li className="flex gap-3 text-sm">
                           <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-500">3</div>
                           <span className="text-zinc-400">Direct Interview with {job.company}</span>
                        </li>
                     </ul>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-zinc-100 bg-white p-6">
                     <h4 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Listing Freshness</h4>
                     <div className="flex items-center gap-2 text-sm text-zinc-600">
                       <Clock3 className="w-4 h-4 text-brand-600" />
                       <span>Posted or refreshed on {postedDate}</span>
                     </div>
                     {expiryDate && (
                       <div className="flex items-center gap-2 text-sm text-amber-700">
                         <Clock3 className="w-4 h-4" />
                         <span>Expected to expire on {expiryDate}</span>
                       </div>
                     )}
                  </div>

                  <div className="p-6 bg-brand-600 text-white rounded-2xl shadow-lg relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CheckCircle className="w-16 h-16" />
                     </div>
                     <p className="text-sm font-bold mb-1">Verified access</p>
                     <p className="text-xs opacity-90 leading-relaxed">
                       {isJobOwner
                         ? "You posted this listing. Review applicants below."
                         : profile?.role === "admin"
                           ? "You are browsing with admin access."
                           : isMvpCandidate
                             ? "Your MVP status gives you priority access to this role."
                      : isFreeAccessCandidate
                        ? freeApplicationsRemaining > 0
                          ? `You have ${freeApplicationsRemaining} free application${freeApplicationsRemaining === 1 ? "" : "s"} left before verification is required.`
                          : "Your free job access is complete. Verify your profile to keep applying."
                              : isGuestViewer
                                ? "Preview is open. Sign in to apply, track your status, and unlock ATS-backed application support."
                                : "Browse now and complete the assessment to unlock applications for this role."}
                     </p>
                  </div>
               </div>
            </div>

            {canReviewApplicantPipeline && (
              <section className="mt-12 space-y-6 rounded-[2rem] border border-zinc-200 bg-[#fbfdfc] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Applicants</p>
                    <h3 className="mt-2 text-2xl font-bold text-zinc-900">Review the full hiring pipeline in one place.</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                      Track movement, inspect ATS results, and jump into interviews or profile review without squeezing the hiring flow into the job description column.
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm">
                    {applicants?.length ?? 0} total applicants
                  </span>
                </div>

                {applicants?.length ? (
                  <>
                    <EmployerPipelineBoard
                      applicants={visibleApplicantRows.map((app) => {
                        const applicantProfile = applicantProfilesById.get(app.user_id);
                        const liveAts = liveAtsByApplicationId.get(app.id);
                        const interviewSchedule = interviewSchedulesByApplicationId.get(app.id) || null;
                        const atsScore = toNumericScore(app.ats_score) ?? liveAts?.score ?? null;
                        const atsSummary = app.ats_summary || liveAts?.summary || null;
                        const atsAutoDecision = app.ats_auto_decision || liveAts?.autoDecision || null;
                        const isLockedMvp = !isPaidEmployer && applicantProfile?.role === "candidate_mvp";

                        return {
                          id: app.id,
                          name: isLockedMvp ? "MVP candidate" : applicantProfile?.name || "Candidate",
                          headline: isLockedMvp
                            ? "Upgrade to Premium to view this MVP candidate profile."
                            : applicantProfile?.headline || applicantProfile?.email || "Candidate application",
                          status: app.status,
                          appliedAt: app.created_at,
                          atsScore,
                          atsSummary,
                          atsAutoDecision,
                          interviewSchedule,
                          resumeHref: isLockedMvp ? null : app.resume_id ? `/api/resumes/${app.resume_id}/download` : app.resume_url || null,
                          portfolioUrl: isLockedMvp ? null : applicantProfile?.portfolio_url || null,
                          profileHref:
                            !isLockedMvp && applicantProfile?.role === "candidate_mvp"
                              ? `/dashboard/employer/candidates/${app.user_id}`
                              : null,
                          isMvp: applicantProfile?.role === "candidate_mvp",
                          lockedMessage: isLockedMvp ? "MVP candidate can't be viewed on the current employer plan." : null,
                          jobTitle: job.title,
                        };
                      })}
                      isPaidEmployer={isPaidEmployer}
                      hiddenApplicantsCount={hiddenApplicantCount}
                    />
                  </>
                ) : (
                  <div className="rounded-3xl border border-dashed border-zinc-200 p-6 text-zinc-500">
                    No applications have been submitted for this job yet.
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusPillClasses(status: string) {
  if (status === "accepted" || status === "shortlisted") return "bg-green-50 text-green-700 border-green-200";
  if (status === "on_hold") return "bg-amber-50 text-amber-800 border-amber-200";
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}
