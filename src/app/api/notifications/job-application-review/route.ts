import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { notifyAdmins, notifyUser } from '@/lib/notifications'
import { getSiteUrl } from '@/lib/site-url'

function isMissingColumnError(message?: string | null) {
  const normalized = message || ''
  return (
    normalized.includes('Could not find') ||
    normalized.includes('does not exist') ||
    normalized.includes('schema cache')
  )
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === 'string' ? message : null
  }

  return null
}

async function updateApplicationReviewStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  applicationId: string,
  action: 'shortlisted' | 'rejected'
) {
  const timestampField = action === 'shortlisted' ? 'shortlisted_at' : 'rejected_at'
  const timestamp = new Date().toISOString()

  const fullUpdate = await supabase
    .from('job_applications')
    .update({
      status: action,
      reviewed_at: timestamp,
      [timestampField]: timestamp,
    })
    .eq('id', applicationId)
    .select('id')

  if (!fullUpdate.error) {
    return fullUpdate
  }

  if (fullUpdate.error.code !== '42703' && !isMissingColumnError(fullUpdate.error.message)) {
    return fullUpdate
  }

  const statusOnlyUpdate = await supabase
    .from('job_applications')
    .update({
      status: action,
    })
    .eq('id', applicationId)
    .select('id')

  return statusOnlyUpdate
}

async function updateApplicationReviewStatusWithAdmin(
  applicationId: string,
  action: 'shortlisted' | 'rejected'
) {
  const admin = createAdminClient()

  if (!admin) {
    return {
      data: null,
      error: new Error('Admin Supabase client is not configured.'),
    }
  }

  const timestampField = action === 'shortlisted' ? 'shortlisted_at' : 'rejected_at'
  const timestamp = new Date().toISOString()

  const fullUpdate = await admin
    .from('job_applications')
    .update({
      status: action,
      reviewed_at: timestamp,
      [timestampField]: timestamp,
    })
    .eq('id', applicationId)
    .select('id')

  if (!fullUpdate.error) {
    return fullUpdate
  }

  if (fullUpdate.error.code !== '42703' && !isMissingColumnError(fullUpdate.error.message)) {
    return fullUpdate
  }

  return admin
    .from('job_applications')
    .update({
      status: action,
    })
    .eq('id', applicationId)
    .select('id')
}

export async function POST(req: Request) {
  const body = await req.json()
  const { applicationId, action } = body

  if (!applicationId || !['shortlisted', 'rejected'].includes(action)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: viewerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  let application = null
  let appError = null
  const applicationWithResumeLink = await supabase
    .from('job_applications')
    .select('id, user_id, job_id, status, resume_id, resume_url, jobs(user_id, title, company, description, location)')
    .eq('id', applicationId)
    .single()

  application = applicationWithResumeLink.data
  appError = applicationWithResumeLink.error

  if (appError?.code === '42703' || appError?.message?.includes('resume_id')) {
    const legacyApplicationQuery = await supabase
      .from('job_applications')
      .select('id, user_id, job_id, status, resume_url, jobs(user_id, title, company, description, location)')
      .eq('id', applicationId)
      .single()

    appError = legacyApplicationQuery.error
    application = legacyApplicationQuery.data ? { ...legacyApplicationQuery.data, resume_id: null } : null
  }

  if (appError || !application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs
  const isAdmin = viewerProfile?.role === 'admin'
  const isJobOwner = job?.user_id === user.id
  const jobUrl = `${getSiteUrl()}/dashboard/jobs/${application.job_id}`

  if (!isAdmin && !isJobOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (application.status === 'shortlisted' || application.status === 'rejected') {
    return NextResponse.json({ error: 'Final decision already recorded for this application.' }, { status: 409 })
  }

  let { data: updatedRows, error: updateError } = await updateApplicationReviewStatus(
    supabase,
    applicationId,
    action
  )
  let updateErrorMessage: string | null = getErrorMessage(updateError)

  if (!updateError && (!updatedRows || updatedRows.length === 0)) {
    const adminUpdateResult = await updateApplicationReviewStatusWithAdmin(applicationId, action)
    updatedRows = adminUpdateResult.data
    updateError = adminUpdateResult.error as typeof updateError
    updateErrorMessage = getErrorMessage(adminUpdateResult.error)
  }

  if (updateError || updateErrorMessage) {
    return NextResponse.json({ error: updateErrorMessage || updateError?.message || 'Application update failed.' }, { status: 500 })
  }
  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json(
      { error: 'Application status could not be updated. Check job_applications update policy.' },
      { status: 403 }
    )
  }

  const candidateTitle =
    action === 'shortlisted' ? 'Your application was accepted' : 'Your application was updated'
  const candidateMessage =
    action === 'shortlisted'
      ? `Your application for ${job?.title || 'the role'} at ${job?.company || 'the company'} was accepted for the next hiring step.`
      : `Your application for ${job?.title || 'the role'} at ${job?.company || 'the company'} was rejected by the employer.`

  const notificationResults = await Promise.allSettled([
    notifyUser(
      application.user_id,
      'job_application_reviewed',
      candidateTitle,
      candidateMessage,
      {
        application_id: applicationId,
        job_id: application.job_id,
        title: job?.title || '',
        company: job?.company || '',
        job_url: jobUrl,
        status: action,
      }
    ),
    notifyAdmins(
      'job_application_reviewed_admin',
      action === 'shortlisted' ? 'Candidate accepted by employer' : 'Candidate rejected by employer',
      action === 'shortlisted'
        ? `Employer moved a candidate forward for ${job?.title || 'the role'} at ${job?.company || 'the company'}.`
        : `Employer rejected a candidate for ${job?.title || 'the role'} at ${job?.company || 'the company'}.`,
      {
        application_id: applicationId,
        applicant_id: application.user_id,
        job_id: application.job_id,
        title: job?.title || '',
        company: job?.company || '',
        job_url: jobUrl,
        status: action,
        reviewer_id: user.id,
      }
    ),
  ])

  const rejectedNotifications = notificationResults
    .map((result, index) => ({ result, index }))
    .filter((entry): entry is { result: PromiseRejectedResult; index: number } => entry.result.status === 'rejected')

  if (rejectedNotifications.length > 0) {
    console.error('[job-application-review] notification delivery failed', {
      applicationId,
      rejectedNotifications: rejectedNotifications.map(({ index, result }) => ({
        index,
        reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
      })),
    })
  }

  return NextResponse.json({ success: true, status: action })
}
