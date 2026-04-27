import type { SupabaseClient } from '@supabase/supabase-js'
import { canAccessJobBoardRole, canViewJobBoardRole } from "@/lib/profile-role";

export const CANDIDATE_FREE_JOB_APPLICATION_LIMIT = 15;

type JobBoardAccess = {
  canAccessJobBoard: boolean;
  canViewJobBoard: boolean;
  canApplyToJobs: boolean;
  isFreeAccessCandidate: boolean;
  freeApplicationLimit: number;
  freeApplicationsUsed: number;
  freeApplicationsRemaining: number;
  lockReason: string | null;
};

type JobBoardAccessProfile = {
  role?: string | null;
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
    : isFreeAccessCandidate
      ? freeApplicationsRemaining > 0
        ? `You have ${freeApplicationsRemaining} free application${freeApplicationsRemaining === 1 ? "" : "s"} remaining before full verification is required.`
        : "Your free job access is complete. Verify your profile to keep applying for more roles."
      : "Complete the assessment to unlock job applications.";

  return {
    canAccessJobBoard: canViewJobBoard,
    canViewJobBoard,
    canApplyToJobs,
    isFreeAccessCandidate,
    freeApplicationLimit: CANDIDATE_FREE_JOB_APPLICATION_LIMIT,
    freeApplicationsUsed,
    freeApplicationsRemaining,
    lockReason,
  }
}
