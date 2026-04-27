import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getJobBoardAccessForUser } from '@/lib/job-board-access'
import { notifyUser, notifyAdmins } from '@/lib/notifications'
import { isInternalApplyValue, normalizeExternalApplyUrl } from '@/lib/job-apply'
import {
  decideApplicationStatus,
  downloadResumeBuffer,
  scoreResumeWithMlService,
} from '@/lib/resume-analysis'

export const runtime = 'nodejs'

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
        supabase.from('profiles').select('skills').eq('id', user.id).single(),
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

  let insertError = null;
  const insertWithResumeLink = await supabase.from('job_applications').insert({
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

  insertError = insertWithResumeLink.error;

  if (insertError?.code === '42703' || insertError?.message?.includes('resume_id')) {
    const legacyInsert = await supabase.from('job_applications').insert({
      job_id: jobId,
      user_id: user.id,
      resume_url: normalizedResumeUrl,
      status: applicationStatus,
    });
    insertError = legacyInsert.error;
  }

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
  await notifyUser(user.id, 'job_application', 'Application submitted', candidateMessage, {
    job_id: jobId,
    company: job.company,
    title: job.title,
    apply_url: externalApplyUrl,
    application_mode: isInternalApply ? 'internal' : 'external',
    ats_score: atsScore,
    ats_auto_decision: atsAutoDecision,
  });

  if (job.user_id) {
    await notifyUser(job.user_id, 'job_application_received', 'New candidate applied', `A candidate has applied for ${job.title} at ${job.company}. ATS score: ${atsScore ?? 'n/a'}.`, {
      job_id: jobId,
      applicant_id: user.id,
      ats_score: atsScore,
      ats_auto_decision: atsAutoDecision,
    });
  }

  await notifyAdmins(
    'job_application_admin',
    'Candidate applied for job',
    `Candidate ${user.email || user.id} applied for ${job.title} at ${job.company}.`,
    {
      job_id: jobId,
      applicant_id: user.id,
      ats_score: atsScore,
      ats_auto_decision: atsAutoDecision,
    }
  );

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
