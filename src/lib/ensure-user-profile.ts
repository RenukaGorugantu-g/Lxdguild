import { createAdminClient } from "@/utils/supabase/admin";

type AuthLikeUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

const validRoles = new Set([
  "visitor",
  "candidate_onhold",
  "candidate_mvp",
  "employer_free",
  "employer_pro",
  "employer_premium",
  "pro_member",
  "admin",
]);

function isValidRole(role: unknown): role is string {
  return typeof role === "string" && validRoles.has(role);
}

function pickSaferRole(existingRole: string | null, inferredRole: string | null) {
  if (existingRole === "admin" || existingRole === "pro_member") return existingRole;
  if (inferredRole === "candidate_mvp" && existingRole === "candidate_onhold") return inferredRole;
  if (existingRole === "candidate_mvp") return existingRole;
  if (existingRole === "employer_premium" || existingRole === "employer_pro") return existingRole;
  if (isValidRole(existingRole)) return existingRole;
  return inferredRole;
}

export async function ensureUserProfile(user: AuthLikeUser) {
  const admin = createAdminClient();

  if (!admin) {
    return null;
  }

  const rawMetadataRole =
    typeof user.user_metadata?.role === "string" && user.user_metadata.role.length > 0
      ? user.user_metadata.role
      : null;
  const metadataName =
    typeof user.user_metadata?.name === "string" && user.user_metadata.name.length > 0
      ? user.user_metadata.name
      : user.email?.split("@")[0] || null;

  const metadataRole = isValidRole(rawMetadataRole) ? rawMetadataRole : null;
  const metadataTargetRole =
    typeof user.user_metadata?.candidate_target_role === "string" && user.user_metadata.candidate_target_role.length > 0
      ? user.user_metadata.candidate_target_role
      : null;
  const metadataExperienceYears =
    typeof user.user_metadata?.experience_years === "number"
      ? user.user_metadata.experience_years
      : typeof user.user_metadata?.experience_years === "string"
        ? Number(user.user_metadata.experience_years)
        : null;
  const existingProfileResult = await admin
    .from("profiles")
    .select("role, name, candidate_target_role, experience_years")
    .eq("id", user.id)
    .maybeSingle();
  const existingProfile = existingProfileResult.data;

  if (existingProfile && isValidRole(existingProfile.role)) {
    if (
      (existingProfile.name || !metadataName) &&
      (existingProfile.candidate_target_role || !metadataTargetRole) &&
      ((existingProfile.experience_years !== null && existingProfile.experience_years !== undefined) || metadataExperienceYears === null)
    ) {
      return {
        role: existingProfile.role,
        name: existingProfile.name || metadataName,
        candidate_target_role: existingProfile.candidate_target_role || metadataTargetRole,
        experience_years: existingProfile.experience_years ?? metadataExperienceYears,
      };
    }

    const updateNameResult = await admin
      .from("profiles")
      .update({
        email: user.email ?? null,
        name: metadataName,
        candidate_target_role: existingProfile.candidate_target_role || metadataTargetRole,
        experience_years: existingProfile.experience_years ?? metadataExperienceYears,
      })
      .eq("id", user.id)
      .select("role, name, candidate_target_role, experience_years")
      .single();

    return updateNameResult.data ?? {
      role: existingProfile.role,
      name: metadataName,
      candidate_target_role: existingProfile.candidate_target_role || metadataTargetRole,
      experience_years: existingProfile.experience_years ?? metadataExperienceYears,
    };
  }

  if (!existingProfile && metadataRole) {
    const insertResult = await admin
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? null,
        name: metadataName,
        role: metadataRole,
        candidate_target_role: metadataTargetRole,
        experience_years: metadataExperienceYears,
      })
      .select("role, name, candidate_target_role, experience_years")
      .single();

    if (!insertResult.error && insertResult.data) {
      return insertResult.data;
    }
  }

  const [employerResult, candidateResult, jobsResult, applicationsResult] = await Promise.all([
    admin.from("employers").select("user_id", { head: true, count: "exact" }).eq("user_id", user.id),
    admin.from("candidates").select("user_id, pass_status").eq("user_id", user.id).maybeSingle(),
    admin.from("jobs").select("id", { head: true, count: "exact" }).eq("user_id", user.id),
    admin.from("job_applications").select("id", { head: true, count: "exact" }).eq("user_id", user.id),
  ]);

  const employerCount = employerResult.count || 0;
  const jobsCount = jobsResult.count || 0;
  const applicationsCount = applicationsResult.count || 0;
  const candidatePassStatus =
    candidateResult.data && typeof candidateResult.data.pass_status === "string"
      ? candidateResult.data.pass_status
      : null;

  let inferredRole = metadataRole;
  if (!inferredRole) {
    if (employerCount > 0 || jobsCount > 0) {
      inferredRole = "employer_free";
    } else if (candidatePassStatus === "pass") {
      inferredRole = "candidate_mvp";
    } else if (candidateResult.data || applicationsCount > 0) {
      inferredRole = "candidate_onhold";
    } else {
      inferredRole = "visitor";
    }
  }

  const safeRole = pickSaferRole(existingProfile?.role ?? null, inferredRole);
  const safeName = existingProfile?.name || metadataName;

  let data = existingProfile
    ? {
        role: safeRole,
        name: safeName,
      }
    : null;

  if (!existingProfile) {
    const insertResult = await admin
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? null,
        name: safeName,
        role: safeRole,
        candidate_target_role: metadataTargetRole,
        experience_years: metadataExperienceYears,
      })
      .select("role, name, candidate_target_role, experience_years")
      .single();

    data = insertResult.data;

    if (insertResult.error) {
      return null;
    }
  } else if (
    existingProfile.role !== safeRole ||
    (!existingProfile.name && safeName) ||
    (!existingProfile.candidate_target_role && metadataTargetRole) ||
    ((existingProfile.experience_years === null || existingProfile.experience_years === undefined) && metadataExperienceYears !== null)
  ) {
    const updateResult = await admin
      .from("profiles")
      .update({
        email: user.email ?? null,
        name: safeName,
        role: safeRole,
        candidate_target_role: existingProfile.candidate_target_role || metadataTargetRole,
        experience_years: existingProfile.experience_years ?? metadataExperienceYears,
      })
      .eq("id", user.id)
      .select("role, name, candidate_target_role, experience_years")
      .single();

    data = updateResult.data;

    if (updateResult.error) {
      return null;
    }
  }

  return data;
}
