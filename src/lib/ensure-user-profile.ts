import { createAdminClient } from "@/utils/supabase/admin";

type AuthLikeUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

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

  let metadataRole = rawMetadataRole && validRoles.has(rawMetadataRole) ? rawMetadataRole : null;

  if (!metadataRole) {
    const [{ count: employerCount }, { count: candidateCount }, { count: jobsCount }, { count: applicationsCount }] =
      await Promise.all([
        admin.from("employers").select("user_id", { head: true, count: "exact" }).eq("user_id", user.id),
        admin.from("candidates").select("user_id", { head: true, count: "exact" }).eq("user_id", user.id),
        admin.from("jobs").select("id", { head: true, count: "exact" }).eq("user_id", user.id),
        admin.from("job_applications").select("id", { head: true, count: "exact" }).eq("user_id", user.id),
      ]);

    if ((employerCount || 0) > 0 || (jobsCount || 0) > 0) {
      metadataRole = "employer_free";
    } else if ((candidateCount || 0) > 0 || (applicationsCount || 0) > 0) {
      metadataRole = "candidate_onhold";
    } else {
      metadataRole = "visitor";
    }
  }

  const { data, error } = await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        name: metadataName,
        role: metadataRole,
      },
      { onConflict: "id" }
    )
    .select("role, name")
    .single();

  if (error) {
    return null;
  }

  return data;
}
