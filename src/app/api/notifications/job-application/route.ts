import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getJobBoardAccessForUser } from '@/lib/job-board-access'
import { notifyUser, notifyAdmins } from '@/lib/notifications'
import { isInternalApplyValue, normalizeExternalApplyUrl } from '@/lib/job-apply'
import { ensureUserProfile } from '@/lib/ensure-user-profile'
import { getSiteUrl } from '@/lib/site-url'
import {
  decideApplicationStatus,
  downloadResumeBuffer,
  scoreResumeWithMlService,
} from '@/lib/resume-analysis'

export const runtime = 'nodejs'

function isMissingColumnError(message?: string | null) {
  const normalized = message || '';
  return (
    normalized.includes('Could not find') ||
    normalized.includes('does not exist') ||
    normalized.includes('schema cache')
  );
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
    ats_score: number | null;
    ats_summary: string | null;
    ats_recommendations: string[];
    ats_matched_keywords: string[];
    ats_missing_keywords: string[];
    ats_analysis_status: string;
    ats_analysis_error: string | null;
    ats_last_analyzed_at: string | null;
    ats_auto_decision: string | null;
    ats_auto_decision_reason: string | null;
  }
) {
  const fullInsert = await supabase.from('job_applications').insert(payload);
  if (!fullInsert.error) {
    return fullInsert.error;
  }

  if (fullInsert.error.code !== '42703' && !isMissingColumnError(fullInsert.error.message)) {
    return fullInsert.error;
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
    ats_score: payload.ats_score,
    ats_summary: payload.ats_summary,
  });

  if (!mediumInsert.error) {
    return mediumInsert.error;
  }

  if (mediumInsert.error.code !== '42703' && !isMissingColumnError(mediumInsert.error.message)) {
    return mediumInsert.error;
  }

  const legacyInsert = await supabase.from('job_applications').insert({
    job_id: payload.job_id,
    user_id: payload.user_id,
    resume_url: payload.resume_url,
    status: payload.status,
  });

  return legacyInsert.error;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { jobId, resumeUrl, resumeId } = body;

  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient() ?? supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureUserProfile(user);

  const { canApplyToJobs, isFreeAccessCandidate, freeApplicationsRemaining, lockReason } = await getJobBoardAccessForUser(
    supabase,
    user.id
  );
  if (!canApplyToJobs) {
    return NextResponse.json(
      {
        error:
          lockReason ||
          "Job applications require MVP status or an approved course certificate.",
      },
      { status: 403 }
    );
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, company, description, location, apply_url, user_id')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const normalizedResumeUrl = resumeUrl || null;
  const jobUrl = `${getSiteUrl()}/dashboard/jobs/${jobId}`;
  const { data: applicantProfile } = await supabase
    .from('profiles')
    .select('name, skills')
    .eq('id', user.id)
    .single();
  let applicationStatus = 'applied';
  let reviewedAt: string | null = null;
  let shortlistedAt: string | null = null;
  let rejectedAt: string | null = null;
  let atsAnalysisStatus = 'pending';
  let atsAnalysisError: string | null = null;
  let atsSummary: string | null = null;
  let atsRecommendations: string[] = [];
  let atsMatchedKeywords: string[] = [];
  let atsMissingKeywords: string[] = [];
  let atsAutoDecision: string | null = null;
  let atsAutoDecisionReason: string | null = null;
  let atsScore: number | null = null;
  let atsLastAnalyzedAt: string | null = null;

  if (resumeId) {
    try {
      const [{ data: resume }, { data: profile }] = await Promise.all([
        supabase
          .from('resumes')
          .select('id, user_id, file_url, file_path, file_name, mime_type')
          .eq('id', resumeId)
          .single(),
        Promise.resolve({ data: applicantProfile }),
      ]);

      if (resume && resume.user_id === user.id) {
        atsAnalysisStatus = 'processing';
        const downloadedResume = await downloadResumeBuffer({
          filePath: resume.file_path,
          fileUrl: resume.file_url,
          fileName: resume.file_name,
          mimeType: resume.mime_type,
        });

        const analysis = await scoreResumeWithMlService({
          buffer: downloadedResume.buffer,
          fileName: downloadedResume.fileName,
          mimeType: downloadedResume.mimeType,
          jobDescription: [job.title, job.company, job.location, job.description].filter(Boolean).join('\n'),
          candidateSkills: Array.isArray(profile?.skills) ? profile.skills.map(String) : [],
        });

        const decision = decideApplicationStatus(analysis.score);
        atsScore = analysis.score;
        atsSummary = analysis.summary;
        atsRecommendations = analysis.recommendations;
        atsMatchedKeywords = analysis.matched_keywords;
        atsMissingKeywords = analysis.missing_keywords;
        atsAutoDecision = decision.autoDecision;
        atsAutoDecisionReason = decision.reason;
        atsAnalysisStatus = 'completed';
        atsLastAnalyzedAt = new Date().toISOString();
        applicationStatus = decision.applicationStatus;

        if (applicationStatus === 'shortlisted' || applicationStatus === 'rejected') {
          reviewedAt = atsLastAnalyzedAt;
        }
        if (applicationStatus === 'shortlisted') {
          shortlistedAt = atsLastAnalyzedAt;
        }
        if (applicationStatus === 'rejected') {
          rejectedAt = atsLastAnalyzedAt;
        }

        await adminSupabase
          .from('resumes')
          .update({
            file_path: resume.file_path || downloadedResume.sourcePath,
            mime_type: resume.mime_type || downloadedResume.mimeType,
            ats_score: analysis.score,
            ats_summary: analysis.summary,
            ats_recommendations: analysis.recommendations,
            ats_highlights: analysis.highlights,
            ats_missing_skills: analysis.missing_keywords,
            ats_analysis_status: 'completed',
            ats_analysis_error: null,
            ats_last_analyzed_at: atsLastAnalyzedAt,
          })
          .eq('id', resumeId);
      }
    } catch (analysisError: unknown) {
      atsAnalysisStatus = 'failed';
      atsAnalysisError = analysisError instanceof Error ? analysisError.message : 'ATS analysis failed.';
      atsAutoDecision = 'manual_review';
      atsAutoDecisionReason = 'ATS analysis could not complete, so the application was left for manual review.';
      atsLastAnalyzedAt = new Date().toISOString();
    }
  }

  const insertError = await insertJobApplication(supabase, {
    job_id: jobId,
    user_id: user.id,
    resume_id: resumeId || null,
    resume_url: normalizedResumeUrl,
    status: applicationStatus,
    reviewed_at: reviewedAt,
    shortlisted_at: shortlistedAt,
    rejected_at: rejectedAt,
    ats_score: atsScore,
    ats_summary: atsSummary,
    ats_recommendations: atsRecommendations,
    ats_matched_keywords: atsMatchedKeywords,
    ats_missing_keywords: atsMissingKeywords,
    ats_analysis_status: atsAnalysisStatus,
    ats_analysis_error: atsAnalysisError,
    ats_last_analyzed_at: atsLastAnalyzedAt,
    ats_auto_decision: atsAutoDecision,
    ats_auto_decision_reason: atsAutoDecisionReason,
  });

  if (insertError && insertError.code !== '23505') {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const isInternalApply = !job.apply_url || isInternalApplyValue(job.apply_url);
  const externalApplyUrl = normalizeExternalApplyUrl(job.apply_url);
  const candidateMessage = applicationStatus === 'shortlisted'
    ? `Your application for ${job.title} at ${job.company} was submitted and auto-shortlisted based on ATS fit.`
    : applicationStatus === 'rejected'
      ? `Your application for ${job.title} at ${job.company} was submitted, but ATS screening flagged it as a weak match for this job description.`
      : isInternalApply
        ? `Your application for ${job.title} at ${job.company} was submitted inside LXD Guild. The employer can now review your profile here.`
        : `We saved your application intent for ${job.title} at ${job.company}. Complete the application on the employer's official page to finish applying.`;
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
      ats_score: atsScore,
      ats_auto_decision: atsAutoDecision,
    }),
    ...(job.user_id
      ? [
          notifyUser(job.user_id, 'job_application_received', 'New candidate applied', `A candidate has applied for ${job.title} at ${job.company}. ATS score: ${atsScore ?? 'n/a'}.`, {
            job_id: jobId,
            applicant_id: user.id,
            candidate_name: typeof applicantProfile?.name === 'string' ? applicantProfile.name : '',
            candidate_email: user.email || '',
            company: job.company,
            title: job.title,
            job_url: jobUrl,
            employer_job_url: jobUrl,
            ats_score: atsScore,
            ats_auto_decision: atsAutoDecision,
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
        ats_score: atsScore,
        ats_auto_decision: atsAutoDecision,
      }
    ),
  ]);

  const rejectedNotifications = notificationResults
    .map((result, index) => ({ result, index }))
    .filter((entry): entry is { result: PromiseRejectedResult; index: number } => entry.result.status === 'rejected');

  if (rejectedNotifications.length > 0) {
    console.error('[job-application] notification delivery failed', {
      jobId,
      userId: user.id,
      rejectedNotifications: rejectedNotifications.map(({ index, result }) => ({
        index,
        reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
      })),
    });
  }

  return NextResponse.json({
    success: true,
    applyUrl: externalApplyUrl,
    applicationMode: isInternalApply ? 'internal' : 'external',
    applicationStatus,
    atsScore,
    atsAutoDecision,
    atsSummary,
    alreadyApplied: insertError?.code === '23505',
    freeAccessRemaining:
      isFreeAccessCandidate && insertError?.code !== '23505'
        ? Math.max(0, freeApplicationsRemaining - 1)
        : freeApplicationsRemaining,
  });
}
