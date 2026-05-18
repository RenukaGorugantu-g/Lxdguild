import type { SupabaseClient } from '@supabase/supabase-js'
import { isMappedTargetRole } from "@/lib/assessment";
import { canAccessJobBoardRole, canViewJobBoardRole, isEmployerRole } from "@/lib/profile-role";

export const CANDIDATE_FREE_JOB_APPLICATION_LIMIT = 15;

type JobBoardAccess = {
  canAccessJobBoard: boolean;
  canViewJobBoard: boolean;
  canApplyToJobs: boolean;
  featuredJobsOnly: boolean;
  requiresAssessmentAssignment: boolean;
  isFreeAccessCandidate: boolean;
  freeApplicationLimit: number;
  freeApplicationsUsed: number;
  freeApplicationsRemaining: number;
  lockReason: string | null;
};

type JobBoardAccessProfile = {
  role?: string | null;
  candidate_target_role?: string | null;
  candidate_designation?: string | null;
};

/**
 * Viewing and applying are separate. candidate_onhold can browse and gets a limited free application quota.
 */
export async function getJobBoardAccessForUser(
  supabase: SupabaseClient,
  userId: string,
  profileOverride?: JobBoardAccessProfile | null
): Promise<JobBoardAccess> {
  let profile = profileOverride ?? null;

  if (!profile) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    profile = data;
  }

  if (!profile) {
    return {
      canAccessJobBoard: false,
      canViewJobBoard: false,
      canApplyToJobs: false,
      featuredJobsOnly: false,
      requiresAssessmentAssignment: false,
      isFreeAccessCandidate: false,
      freeApplicationLimit: CANDIDATE_FREE_JOB_APPLICATION_LIMIT,
      freeApplicationsUsed: 0,
      freeApplicationsRemaining: 0,
      lockReason: null,
    }
  }

  const canViewJobBoard = canViewJobBoardRole(profile.role)
  const isFreeAccessCandidate = profile.role === "candidate_onhold";
  const hasVerifiedApplyAccess = canAccessJobBoardRole(profile.role);
  const requiresAssessmentAssignment =
    isFreeAccessCandidate &&
    !profile.candidate_designation &&
    !isMappedTargetRole(profile.candidate_target_role);
  const featuredJobsOnly = requiresAssessmentAssignment;

  let freeApplicationsUsed = 0;
  if (isFreeAccessCandidate) {
    const { count } = await supabase
      .from("job_applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    freeApplicationsUsed = count || 0;
  }

  const freeApplicationsRemaining = Math.max(
    0,
    CANDIDATE_FREE_JOB_APPLICATION_LIMIT - freeApplicationsUsed
  );
  const canApplyToJobs = hasVerifiedApplyAccess || (isFreeAccessCandidate && freeApplicationsRemaining > 0);
  const lockReason = hasVerifiedApplyAccess
    ? null
    : isEmployerRole(profile.role)
      ? "As an employer, you can view roles here but you cannot apply to jobs."
    : requiresAssessmentAssignment
      ? freeApplicationsRemaining > 0
        ? `Only featured jobs are open until your assessment track is assigned. You have ${freeApplicationsRemaining} free application${freeApplicationsRemaining === 1 ? "" : "s"} available for those roles.`
        : "Your free featured-job access is complete. Wait for assessment assignment or verification to keep applying."
    : isFreeAccessCandidate
      ? freeApplicationsRemaining > 0
        ? `You have ${freeApplicationsRemaining} free application${freeApplicationsRemaining === 1 ? "" : "s"} remaining before full verification is required.`
        : "Your free job access is complete. Verify your profile to keep applying for more roles."
      : "Complete the assessment to unlock job applications.";

  return {
    canAccessJobBoard: canViewJobBoard,
    canViewJobBoard,
    canApplyToJobs,
    featuredJobsOnly,
    requiresAssessmentAssignment,
    isFreeAccessCandidate,
    freeApplicationLimit: CANDIDATE_FREE_JOB_APPLICATION_LIMIT,
    freeApplicationsUsed,
    freeApplicationsRemaining,
    lockReason,
  }
}
