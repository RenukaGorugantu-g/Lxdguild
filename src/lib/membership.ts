export const MEMBER_ANNUAL_PLAN_CODE = "member_annual";
export const MEMBER_ANNUAL_PRICE_INR = 2999;
export const MEMBER_DURATION_DAYS = 365;

type MembershipProfile = {
  role?: string | null;
  membership_status?: string | null;
  membership_plan?: string | null;
  membership_expires_at?: string | null;
};

function parseExpiryFromStatus(value?: string | null) {
  if (!value) return null;
  if (!value.startsWith("active_until:")) return null;
  const iso = value.replace("active_until:", "");
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function hasActiveMembership(profile: MembershipProfile | null | undefined) {
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "pro_member") return true;

  const expiresAt = profile.membership_expires_at
    ? new Date(profile.membership_expires_at)
    : parseExpiryFromStatus(profile.membership_status);
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) return false;

  return expiresAt.getTime() > Date.now();
}

export function getMembershipState(profile: MembershipProfile | null | undefined) {
  const active = hasActiveMembership(profile);
  const expiresAt = profile?.membership_expires_at
    ? new Date(profile.membership_expires_at)
    : parseExpiryFromStatus(profile?.membership_status);

  return {
    active,
    expiresAt,
    isLegacyProMember: profile?.role === "pro_member",
    plan: active ? (profile?.membership_plan || MEMBER_ANNUAL_PLAN_CODE) : "free",
  };
}

export function addMembershipYear(start: Date) {
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + MEMBER_DURATION_DAYS);
  return next;
}

export function formatMembershipDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}
