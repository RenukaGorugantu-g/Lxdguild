import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { notifyUser } from '@/lib/notifications'

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

  if (!isAdmin && !isJobOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (application.status === 'shortlisted' || application.status === 'rejected') {
    return NextResponse.json({ error: 'Final decision already recorded for this application.' }, { status: 409 })
  }

  const timestampField = action === 'shortlisted' ? 'shortlisted_at' : 'rejected_at'

  const { data: updatedRows, error: updateError } = await supabase
    .from('job_applications')
    .update({
      status: action,
      reviewed_at: new Date().toISOString(),
      [timestampField]: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select('id')

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }
  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json(
      { error: 'Application status could not be updated. Check job_applications update policy.' },
      { status: 403 }
    )
  }

  await notifyUser(
    application.user_id,
    'job_application_reviewed',
    action === 'shortlisted' ? 'You were shortlisted' : 'Application update',
    action === 'shortlisted'
      ? `Your application for ${job?.title || 'the role'} at ${job?.company || 'the company'} was shortlisted by the employer.`
      : `Your application for ${job?.title || 'the role'} at ${job?.company || 'the company'} was rejected by the employer.`,
    {
      application_id: applicationId,
      job_id: application.job_id,
      status: action,
    }
  )

  return NextResponse.json({ success: true, status: action })
}
