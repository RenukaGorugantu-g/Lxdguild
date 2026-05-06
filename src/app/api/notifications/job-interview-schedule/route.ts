import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { notifyUser } from '@/lib/notifications'
import { getSiteUrl } from '@/lib/site-url'

type InterviewAction = 'schedule' | 'reschedule'
type InterviewProvider = 'meeting_link' | 'calendly' | 'google_calendar'

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

function formatInterviewDate(dateValue: string) {
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function buildGoogleCalendarUrl({
  title,
  details,
  startAt,
  durationMinutes,
  location,
}: {
  title: string
  details: string
  startAt: string
  durationMinutes: number
  location?: string | null
}) {
  const startDate = new Date(startAt)
  if (Number.isNaN(startDate.getTime())) {
    return null
  }

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)
  const formatCalendarDate = (value: Date) =>
    value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details,
    dates: `${formatCalendarDate(startDate)}/${formatCalendarDate(endDate)}`,
  })

  if (location) {
    params.set('location', location)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

async function updateApplicationToInterviewScheduled(
  supabase: Awaited<ReturnType<typeof createClient>>,
  applicationId: string
) {
  const fullUpdate = await supabase
    .from('job_applications')
    .update({
      status: 'interview_scheduled',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select('id')

  if (!fullUpdate.error) {
    return fullUpdate
  }

  if (fullUpdate.error.code !== '42703' && !isMissingColumnError(fullUpdate.error.message)) {
    return fullUpdate
  }

  return supabase
    .from('job_applications')
    .update({
      status: 'interview_scheduled',
    })
    .eq('id', applicationId)
    .select('id')
}

async function updateApplicationToInterviewScheduledWithAdmin(applicationId: string) {
  const admin = createAdminClient()

  if (!admin) {
    return {
      data: null,
      error: new Error('Admin Supabase client is not configured.'),
    }
  }

  const fullUpdate = await admin
    .from('job_applications')
    .update({
      status: 'interview_scheduled',
      reviewed_at: new Date().toISOString(),
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
      status: 'interview_scheduled',
    })
    .eq('id', applicationId)
    .select('id')
}

export async function POST(req: Request) {
  const body = await req.json()
  const {
    applicationId,
    roundLabel,
    startAt,
    durationMinutes,
    meetingProvider,
    schedulingUrl,
    notes,
    action = 'schedule',
  } = body as {
    applicationId?: string
    roundLabel?: string
    startAt?: string
    durationMinutes?: number
    meetingProvider?: InterviewProvider
    schedulingUrl?: string
    notes?: string
    action?: InterviewAction
  }

  if (
    !applicationId ||
    !roundLabel ||
    !startAt ||
    !durationMinutes ||
    !meetingProvider ||
    !['meeting_link', 'calendly', 'google_calendar'].includes(meetingProvider)
  ) {
    return NextResponse.json({ error: 'Missing required interview scheduling fields.' }, { status: 400 })
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
    .select('role, name, email')
    .eq('id', user.id)
    .single()

  let application = null
  let appError = null
  const fullApplicationQuery = await supabase
    .from('job_applications')
    .select('id, user_id, job_id, status, resume_id, resume_url, jobs(user_id, title, company, description, location)')
    .eq('id', applicationId)
    .single()

  application = fullApplicationQuery.data
  appError = fullApplicationQuery.error

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

  if (!isAdmin && !isJobOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (application.status === 'rejected') {
    return NextResponse.json({ error: 'Rejected applications cannot be scheduled for interviews.' }, { status: 409 })
  }

  let { data: updatedRows, error: updateError } = await updateApplicationToInterviewScheduled(
    supabase,
    applicationId
  )
  let updateErrorMessage = getErrorMessage(updateError)

  if (!updateError && (!updatedRows || updatedRows.length === 0)) {
    const adminUpdateResult = await updateApplicationToInterviewScheduledWithAdmin(applicationId)
    updatedRows = adminUpdateResult.data
    updateError = adminUpdateResult.error as typeof updateError
    updateErrorMessage = getErrorMessage(adminUpdateResult.error)
  }

  if (updateError || updateErrorMessage) {
    return NextResponse.json({ error: updateErrorMessage || 'Interview scheduling failed.' }, { status: 500 })
  }

  const jobUrl = `${getSiteUrl()}/dashboard/jobs/${application.job_id}`
  const formattedDate = formatInterviewDate(startAt)
  const interviewerName =
    typeof viewerProfile?.name === 'string' && viewerProfile.name.trim().length > 0
      ? viewerProfile.name
      : 'Hiring team'

  const googleCalendarUrl =
    meetingProvider === 'google_calendar'
      ? buildGoogleCalendarUrl({
          title: `${roundLabel} - ${job?.title || 'Interview'} at ${job?.company || 'LXD Guild'}`,
          details: [
            `Interview round: ${roundLabel}`,
            `Role: ${job?.title || 'Role'}`,
            `Company: ${job?.company || 'Company'}`,
            notes ? `Notes: ${notes}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
          startAt,
          durationMinutes,
          location: schedulingUrl || jobUrl,
        })
      : null

  const resolvedSchedulingUrl =
    meetingProvider === 'google_calendar' ? googleCalendarUrl : schedulingUrl || null

  const title = action === 'reschedule' ? 'Interview rescheduled' : 'Interview scheduled'
  const message = formattedDate
    ? `${interviewerName} scheduled ${roundLabel} for ${formattedDate}.`
    : `${interviewerName} scheduled ${roundLabel} for your application.`

  await notifyUser(
    application.user_id,
    'job_interview_scheduled',
    title,
    message,
    {
      application_id: applicationId,
      job_id: application.job_id,
      round_label: roundLabel,
      start_at: startAt,
      duration_minutes: durationMinutes,
      meeting_provider: meetingProvider,
      scheduling_url: resolvedSchedulingUrl,
      notes: notes || '',
      interviewer_name: interviewerName,
      title: job?.title || '',
      company: job?.company || '',
      job_url: jobUrl,
    }
  )

  return NextResponse.json({
    success: true,
    status: 'interview_scheduled',
    googleCalendarUrl,
    schedulingUrl: resolvedSchedulingUrl,
  })
}
