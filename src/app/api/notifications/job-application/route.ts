import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getJobBoardAccessForUser } from '@/lib/job-board-access'
import { notifyUser, notifyAdmins } from '@/lib/notifications'
import { isInternalApplyValue, normalizeExternalApplyUrl } from '@/lib/job-apply'
import { ensureUserProfile } from '@/lib/ensure-user-profile'
import { getSiteUrl } from '@/lib/site-url'
import { downloadResumeBuffer, decideApplicationStatus } from '@/lib/resume-analysis'
import { extractKeywords, extractSkills, parseResumeFile, scoreCandidate } from '../../../../../ats-module'

export const runtime = 'nodejs'

type JobApplicationInsertPayload = {
  job_id: string;
  user_id: string;
  resume_id: string | null;
  resume_url: string | null;
  status: string;
  reviewed_at: string | null;
  shortlisted_at: string | null;
  rejected_at: string | null;
  ats_score?: number | string | null;
  ats_summary?: string | null;
  ats_recommendations?: string[] | null;
  ats_matched_keywords?: string[] | null;
  ats_missing_keywords?: string[] | null;
  ats_analysis_status?: string | null;
  ats_analysis_error?: string | null;
  ats_last_analyzed_at?: string | null;
  ats_auto_decision?: string | null;
  ats_auto_decision_reason?: string | null;
}

type AtsAnalysisResult = {
  score: number;
  summary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  autoDecision: 'shortlisted' | 'rejected' | 'manual_review';
  applicationStatus: string;
  decisionReason: string;
}

type ApplicationSnapshot = {
  id: string;
  status: string;
  ats_score?: number | string | null;
  ats_summary?: string | null;
  ats_auto_decision?: string | null;
}

function toNumericScore(value: number | string | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function isMissingColumnError(message?: string | null) {
  const normalized = message || ''
  return (
    normalized.includes('Could not find') ||
    normalized.includes('does not exist') ||
    normalized.includes('schema cache')
  )
}

async function insertJobApplication(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: JobApplicationInsertPayload
) {
  const fullInsert = await supabase
    .from('job_applications')
    .insert(payload)
    .select('id, ats_score, ats_summary, ats_auto_decision, status')
    .single()

  if (!fullInsert.error) {
    return fullInsert
  }

  if (fullInsert.error.code !== '42703' && !isMissingColumnError(fullInsert.error.message)) {
    return fullInsert
  }

  const mediumInsert = await supabase
    .from('job_applications')
    .insert({
    job_id: payload.job_id,
    user_id: payload.user_id,
    resume_id: payload.resume_id,
    resume_url: payload.resume_url,
    status: payload.status,
    reviewed_at: payload.reviewed_at,
    shortlisted_at: payload.shortlisted_at,
    rejected_at: payload.rejected_at,
    ats_score: payload.ats_score,
    ats_summary: payload.ats_summary,
    ats_recommendations: payload.ats_recommendations,
    ats_matched_keywords: payload.ats_matched_keywords,
    ats_missing_keywords: payload.ats_missing_keywords,
    ats_analysis_status: payload.ats_analysis_status,
    ats_analysis_error: payload.ats_analysis_error,
    ats_last_analyzed_at: payload.ats_last_analyzed_at,
    ats_auto_decision: payload.ats_auto_decision,
    ats_auto_decision_reason: payload.ats_auto_decision_reason,
  })
    .select('id, ats_score, ats_summary, ats_auto_decision, status')
    .single()

  if (!mediumInsert.error) {
    return mediumInsert
  }

  if (mediumInsert.error.code !== '42703' && !isMissingColumnError(mediumInsert.error.message)) {
    return mediumInsert
  }

  const legacyInsert = await supabase
    .from('job_applications')
    .insert({
      job_id: payload.job_id,
      user_id: payload.user_id,
      resume_url: payload.resume_url,
      status: payload.status,
    })
    .select('id, status')
    .single()

  return legacyInsert
}

function extractMinimumYearsOfExperience(description: string) {
  const normalized = description.toLowerCase()
  const patterns = [
    /(\d{1,2})\+?\s+years? of experience/g,
    /minimum of\s+(\d{1,2})\+?\s+years?/g,
    /at least\s+(\d{1,2})\+?\s+years?/g,
    /(\d{1,2})\+?\s+years? experience/g,
  ]
  const matches: number[] = []

  for (const pattern of patterns) {
    for (const match of normalized.matchAll(pattern)) {
      matches.push(Number(match[1]))
    }
  }

  return matches.length ? Math.max(...matches) : 0
}

function stripHtml(value: string | null | undefined) {
  return (value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
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
  ]

  if (missingSkills.length > 0) {
    summaryParts.push(`missing skills: ${missingSkills.slice(0, 5).join(', ')}`)
  }

  return `${summaryParts.join(' | ')}.`
}

async function updateResumeAtsSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  resumeId: string,
  analysis: AtsAnalysisResult
) {
  const updateResult = await supabase
    .from('resumes')
    .update({
      ats_score: analysis.score,
      ats_summary: analysis.summary,
      ats_recommendations: analysis.strengths,
      ats_highlights: analysis.strengths,
      ats_missing_skills: analysis.missingKeywords,
      ats_analysis_status: 'completed',
      ats_analysis_error: null,
      ats_last_analyzed_at: new Date().toISOString(),
    })
    .eq('id', resumeId)

  if (updateResult.error && updateResult.error.code !== '42703' && !isMissingColumnError(updateResult.error.message)) {
    console.error('[job-application] resume ats snapshot update failed', {
      resumeId,
      error: updateResult.error.message,
    })
  }
}

async function analyzeResumeForJob({
  job,
  resumeRecord,
}: {
  job: {
    title: string | null;
    description: string | null;
  };
  resumeRecord: {
    id: string;
    file_url: string | null;
    file_name: string | null;
    file_path?: string | null;
    mime_type?: string | null;
  };
}): Promise<AtsAnalysisResult> {
  const jobDescription = stripHtml(job.description)
  const jobTitle = job.title || 'Untitled role'
  const scoringSource = `${jobTitle} ${jobDescription}`.trim()
  const requiredSkills = extractSkills(scoringSource)
  const keywordSeeds = extractKeywords(scoringSource, requiredSkills)
  const minimumYearsOfExperience = extractMinimumYearsOfExperience(jobDescription)
  const downloadedResume = await downloadResumeBuffer({
    filePath: resumeRecord.file_path,
    fileUrl: resumeRecord.file_url,
    fileName: resumeRecord.file_name,
    mimeType: resumeRecord.mime_type,
  })

  const parsedResume = await parseResumeFile({
    fileName: downloadedResume.fileName,
    mimeType: downloadedResume.mimeType || undefined,
    buffer: downloadedResume.buffer,
  })

  const scoringResult = scoreCandidate({
    job: {
      title: jobTitle,
      description: jobDescription,
      requiredSkills,
      preferredSkills: [],
      minimumYearsOfExperience,
      keywords: keywordSeeds,
    },
    resume: parsedResume,
  })

  const decision = decideApplicationStatus(scoringResult.score)
  const matchedKeywords = keywordSeeds.filter((keyword) => parsedResume.keywords.includes(keyword))
  const summary = buildAtsSummary(scoringResult)

  return {
    score: scoringResult.score,
    summary,
    matchedKeywords,
    missingKeywords: scoringResult.missingSkills,
    strengths: scoringResult.strengths,
    autoDecision: decision.autoDecision,
    applicationStatus: decision.applicationStatus,
    decisionReason: decision.reason,
  }
}

async function getResumeRecordForAnalysis(
  supabase: Awaited<ReturnType<typeof createClient>>,
  resumeId: string,
  userId: string
) {
  const fullQuery = await supabase
    .from('resumes')
    .select('id, file_url, file_name, file_path, mime_type')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!fullQuery.error) {
    return fullQuery.data
  }

  if (fullQuery.error.code !== '42703' && !isMissingColumnError(fullQuery.error.message)) {
    return null
  }

  const fallbackQuery = await supabase
    .from('resumes')
    .select('id, file_url, file_name')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .maybeSingle()

  return fallbackQuery.data
    ? {
        ...fallbackQuery.data,
        file_path: null,
        mime_type: null,
      }
    : null
}

async function getExistingApplicationSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  userId: string
): Promise<ApplicationSnapshot | null> {
  const applicationQuery = await supabase
    .from('job_applications')
    .select('id, status, ats_score, ats_summary, ats_auto_decision')
    .eq('job_id', jobId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!applicationQuery.error) {
    return applicationQuery.data as ApplicationSnapshot | null
  }

  if (applicationQuery.error.code !== '42703' && !isMissingColumnError(applicationQuery.error.message)) {
    return null
  }

  const fallbackQuery = await supabase
    .from('job_applications')
    .select('id, status')
    .eq('job_id', jobId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return fallbackQuery.data as ApplicationSnapshot | null
}

export async function POST(req: Request) {
  const body = await req.json()
  const { jobId, resumeUrl, resumeId } = body

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await ensureUserProfile(user)

  const { canApplyToJobs, isFreeAccessCandidate, freeApplicationsRemaining, lockReason } = await getJobBoardAccessForUser(
    supabase,
    user.id
  )
  if (!canApplyToJobs) {
    return NextResponse.json(
      {
        error:
          lockReason ||
          "Job applications require MVP status or an approved course certificate.",
      },
      { status: 403 }
    )
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, company, description, location, apply_url, user_id')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const normalizedResumeUrl = resumeUrl || null
  const jobUrl = `${getSiteUrl()}/dashboard/jobs/${jobId}`
  const { data: applicantProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const applicationStatus = 'applied'
  let atsAnalysis: AtsAnalysisResult | null = null

  if (resumeId) {
    const resumeRecord = await getResumeRecordForAnalysis(supabase, resumeId, user.id)

    if (resumeRecord) {
      try {
        atsAnalysis = await analyzeResumeForJob({
          job,
          resumeRecord,
        })
        await updateResumeAtsSnapshot(supabase, resumeRecord.id, atsAnalysis)
      } catch (analysisError) {
        console.error('[job-application] ats analysis failed', {
          jobId,
          userId: user.id,
          resumeId,
          error: analysisError instanceof Error ? analysisError.message : String(analysisError),
        })
      }
    }
  }

  const insertResult = await insertJobApplication(supabase, {
    job_id: jobId,
    user_id: user.id,
    resume_id: resumeId || null,
    resume_url: normalizedResumeUrl,
    status: applicationStatus,
    reviewed_at: atsAnalysis ? new Date().toISOString() : null,
    shortlisted_at: null,
    rejected_at: null,
    ats_score: atsAnalysis?.score ?? null,
    ats_summary: atsAnalysis?.summary ?? null,
    ats_recommendations: atsAnalysis?.strengths ?? null,
    ats_matched_keywords: atsAnalysis?.matchedKeywords ?? null,
    ats_missing_keywords: atsAnalysis?.missingKeywords ?? null,
    ats_analysis_status: atsAnalysis ? 'completed' : 'pending',
    ats_analysis_error: null,
    ats_last_analyzed_at: atsAnalysis ? new Date().toISOString() : null,
    ats_auto_decision: atsAnalysis?.autoDecision ?? null,
    ats_auto_decision_reason: atsAnalysis?.decisionReason ?? null,
  })

  if (insertResult.error && insertResult.error.code !== '23505') {
    return NextResponse.json({ error: insertResult.error.message }, { status: 500 })
  }

  const existingApplication: ApplicationSnapshot | null = insertResult.error?.code === '23505'
    ? await getExistingApplicationSnapshot(supabase, jobId, user.id)
    : (insertResult.data as ApplicationSnapshot | null)

  const isInternalApply = !job.apply_url || isInternalApplyValue(job.apply_url)
  const externalApplyUrl = normalizeExternalApplyUrl(job.apply_url)
  const candidateMessage = isInternalApply
    ? `Your application for ${job.title} at ${job.company} was submitted inside LXD Guild. The employer can now review your profile here.`
    : `We saved your application intent for ${job.title} at ${job.company}. Complete the application on the employer's official page to finish applying.`
  const notificationResults = await Promise.allSettled([
    notifyUser(user.id, 'job_application', 'Application submitted', candidateMessage, {
      job_id: jobId,
      company: job.company,
      title: job.title,
      job_url: jobUrl,
      apply_url: externalApplyUrl,
      application_mode: isInternalApply ? 'internal' : 'external',
      recipient_email: user.email || '',
      recipient_name: typeof applicantProfile?.name === 'string' ? applicantProfile.name : '',
    }),
    ...(job.user_id
      ? [
          notifyUser(job.user_id, 'job_application_received', 'New candidate applied', `A candidate has applied for ${job.title} at ${job.company}.`, {
            job_id: jobId,
            applicant_id: user.id,
            candidate_name: typeof applicantProfile?.name === 'string' ? applicantProfile.name : '',
            candidate_email: user.email || '',
            company: job.company,
            title: job.title,
            job_url: jobUrl,
            employer_job_url: jobUrl,
          }),
        ]
      : []),
    notifyAdmins(
      'job_application_admin',
      'Candidate applied for job',
      `Candidate ${user.email || user.id} applied for ${job.title} at ${job.company}.`,
      {
        job_id: jobId,
        applicant_id: user.id,
        candidate_name: typeof applicantProfile?.name === 'string' ? applicantProfile.name : '',
        candidate_email: user.email || '',
        company: job.company,
        title: job.title,
        job_url: jobUrl,
        employer_job_url: jobUrl,
      }
    ),
  ])

  const rejectedNotifications = notificationResults
    .map((result, index) => ({ result, index }))
    .filter((entry): entry is { result: PromiseRejectedResult; index: number } => entry.result.status === 'rejected')

  if (rejectedNotifications.length > 0) {
    console.error('[job-application] notification delivery failed', {
      jobId,
      userId: user.id,
      rejectedNotifications: rejectedNotifications.map(({ index, result }) => ({
        index,
        reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
      })),
    })
  }

  return NextResponse.json({
    success: true,
    applyUrl: externalApplyUrl,
    applicationMode: isInternalApply ? 'internal' : 'external',
    applicationStatus: existingApplication?.status || applicationStatus,
    alreadyApplied: insertResult.error?.code === '23505',
    atsScore: toNumericScore(existingApplication?.ats_score) ?? atsAnalysis?.score ?? null,
    atsAutoDecision: existingApplication?.ats_auto_decision || atsAnalysis?.autoDecision || null,
    atsSummary: existingApplication?.ats_summary || atsAnalysis?.summary || null,
    freeAccessRemaining:
      isFreeAccessCandidate && insertResult.error?.code !== '23505'
        ? Math.max(0, freeApplicationsRemaining - 1)
        : freeApplicationsRemaining,
  })
}
