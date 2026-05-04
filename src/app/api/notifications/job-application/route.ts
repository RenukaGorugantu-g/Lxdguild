import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getJobBoardAccessForUser } from '@/lib/job-board-access'
import { notifyUser, notifyAdmins } from '@/lib/notifications'
import { isInternalApplyValue, normalizeExternalApplyUrl } from '@/lib/job-apply'
import { ensureUserProfile } from '@/lib/ensure-user-profile'
import { getSiteUrl } from '@/lib/site-url'

export const runtime = 'nodejs'

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
  payload: {
    job_id: string;
    user_id: string;
    resume_id: string | null;
    resume_url: string | null;
    status: string;
    reviewed_at: string | null;
    shortlisted_at: string | null;
    rejected_at: string | null;
  }
) {
  const fullInsert = await supabase.from('job_applications').insert(payload)
  if (!fullInsert.error) {
    return fullInsert.error
  }

  if (fullInsert.error.code !== '42703' && !isMissingColumnError(fullInsert.error.message)) {
    return fullInsert.error
  }

  const mediumInsert = await supabase.from('job_applications').insert({
    job_id: payload.job_id,
    user_id: payload.user_id,
    resume_id: payload.resume_id,
    resume_url: payload.resume_url,
    status: payload.status,
    reviewed_at: payload.reviewed_at,
    shortlisted_at: payload.shortlisted_at,
    rejected_at: payload.rejected_at,
  })

  if (!mediumInsert.error) {
    return mediumInsert.error
  }

  if (mediumInsert.error.code !== '42703' && !isMissingColumnError(mediumInsert.error.message)) {
    return mediumInsert.error
  }

  const legacyInsert = await supabase.from('job_applications').insert({
    job_id: payload.job_id,
    user_id: payload.user_id,
    resume_url: payload.resume_url,
    status: payload.status,
  })

  return legacyInsert.error
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

  const insertError = await insertJobApplication(supabase, {
    job_id: jobId,
    user_id: user.id,
    resume_id: resumeId || null,
    resume_url: normalizedResumeUrl,
    status: applicationStatus,
    reviewed_at: null,
    shortlisted_at: null,
    rejected_at: null,
  })

  if (insertError && insertError.code !== '23505') {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

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
    applicationStatus,
    alreadyApplied: insertError?.code === '23505',
    freeAccessRemaining:
      isFreeAccessCandidate && insertError?.code !== '23505'
        ? Math.max(0, freeApplicationsRemaining - 1)
        : freeApplicationsRemaining,
  })
}
