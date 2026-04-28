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
  const existingProfileResult = await admin.from("profiles").select("role, name").eq("id", user.id).maybeSingle();
  const existingProfile = existingProfileResult.data;

  if (existingProfile && isValidRole(existingProfile.role)) {
    if (existingProfile.name || !metadataName) {
      return {
        role: existingProfile.role,
        name: existingProfile.name || metadataName,
      };
    }

    const updateNameResult = await admin
      .from("profiles")
      .update({
        email: user.email ?? null,
        name: metadataName,
      })
      .eq("id", user.id)
      .select("role, name")
      .single();

    return updateNameResult.data ?? {
      role: existingProfile.role,
      name: metadataName,
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
      })
      .select("role, name")
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
      })
      .select("role, name")
      .single();

    data = insertResult.data;

    if (insertResult.error) {
      return null;
    }
  } else if (existingProfile.role !== safeRole || (!existingProfile.name && safeName)) {
    const updateResult = await admin
      .from("profiles")
      .update({
        email: user.email ?? null,
        name: safeName,
        role: safeRole,
      })
      .eq("id", user.id)
      .select("role, name")
      .single();

    data = updateResult.data;

    if (updateResult.error) {
      return null;
    }
  }

  return data;
}
