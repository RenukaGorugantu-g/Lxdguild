import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getJobBoardAccessForUser } from '@/lib/job-board-access'
import { notifyUser, notifyAdmins } from '@/lib/notifications'

export async function POST(req: Request) {
  const body = await req.json();
  const { jobId, resumeUrl } = body;

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { canAccessJobBoard } = await getJobBoardAccessForUser(supabase, user.id);
  if (!canAccessJobBoard) {
    return NextResponse.json(
      { error: 'Job applications require MVP status or an approved course certificate.' },
      { status: 403 }
    );
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, company, apply_url, user_id')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const { error: insertError } = await supabase.from('job_applications').insert({
    job_id: jobId,
    user_id: user.id,
    resume_url: resumeUrl || null,
    status: 'applied',
  });

  if (insertError && insertError.code !== '23505') {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const candidateMessage = `We saved your application intent for ${job.title} at ${job.company}. Complete the application on the employer's official page to finish applying.`;
  await notifyUser(user.id, 'job_application', 'Application submitted', candidateMessage, {
    job_id: jobId,
    company: job.company,
    title: job.title,
    apply_url: job.apply_url,
  });

  if (job.user_id) {
    await notifyUser(job.user_id, 'job_application_received', 'New candidate applied', `A candidate has applied for ${job.title} at ${job.company}.`, {
      job_id: jobId,
      applicant_id: user.id,
    });
  }

  await notifyAdmins(
    'job_application_admin',
    'Candidate applied for job',
    `Candidate ${user.email || user.id} applied for ${job.title} at ${job.company}.`,
    {
      job_id: jobId,
      applicant_id: user.id,
    }
  );

  return NextResponse.json({
    success: true,
    applyUrl: job.apply_url,
    alreadyApplied: insertError?.code === '23505',
  });
}
