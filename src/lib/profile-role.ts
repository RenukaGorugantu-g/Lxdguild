import { hasActiveMembership } from "@/lib/membership";

type ProfileLike = {
  role?: string | null;
  membership_status?: string | null;
  membership_plan?: string | null;
  membership_expires_at?: string | null;
};

export function isAdminRole(role?: string | null) {
  return role === "admin";
}

export function isCandidateRole(role?: string | null) {
  return typeof role === "string" && role.startsWith("candidate");
}

export function isEmployerRole(role?: string | null) {
  return (
    (typeof role === "string" && role.startsWith("employer")) ||
    role === "pro_member"
  );
}

export function isVerifiedCandidateRole(role?: string | null) {
  return role === "candidate_mvp";
}

export function getEmployerPlan(role?: string | null) {
  if (role === "employer_pro") return "pro";
  if (role === "employer_premium") return "premium";
  if (role === "employer_free") return "free";
  return null;
}

export function getBaseRole(profile: ProfileLike | null | undefined) {
  const role = profile?.role;

  if (isAdminRole(role)) return "admin";
  if (isCandidateRole(role)) return "candidate";
  if (isEmployerRole(role)) return "employer";
  return "visitor";
}

export function getRoleDisplayLabel(profile: ProfileLike | null | undefined) {
  const role = profile?.role;
  const activeMember = hasActiveMembership(profile);

  if (isAdminRole(role)) return activeMember ? "Admin + Member" : "Admin";
  if (isVerifiedCandidateRole(role)) return activeMember ? "Candidate MVP + Member" : "Candidate MVP";
  if (isCandidateRole(role)) return activeMember ? "Candidate + Member" : "Candidate";

  if (isEmployerRole(role)) {
    const plan = getEmployerPlan(role);
    const employerLabel =
      plan === "premium" ? "Employer Premium" : plan === "pro" ? "Employer Pro" : "Employer";
    return activeMember ? `${employerLabel} + Member` : employerLabel;
  }

  return activeMember ? "Member" : (role || "Member");
}

export function canAccessJobBoardRole(role?: string | null) {
  return isAdminRole(role) || isVerifiedCandidateRole(role);
}

export function canViewJobBoardRole(role?: string | null) {
  return isAdminRole(role) || isCandidateRole(role);
}
