import { notifyUser } from "@/lib/notifications";
import { getSiteUrl } from "@/lib/site-url";
import type { User, SupabaseClient } from "@supabase/supabase-js";

type WelcomeProfile = {
  role?: string | null;
  name?: string | null;
  candidate_target_role?: string | null;
  candidate_designation?: string | null;
  welcome_email_sent_at?: string | null;
};

function isCandidateRole(role?: string | null) {
  return String(role || "").toLowerCase().startsWith("candidate");
}

export async function maybeSendPostVerificationWelcome(
  supabase: SupabaseClient,
  user: User,
  profile: WelcomeProfile | null | undefined
) {
  if (!profile || !isCandidateRole(profile.role) || profile.welcome_email_sent_at) {
    return;
  }

  const confirmedAt = user.email_confirmed_at || user.confirmed_at || null;
  if (!confirmedAt) {
    return;
  }

  const confirmedDate = new Date(confirmedAt);
  if (Number.isNaN(confirmedDate.getTime())) {
    return;
  }

  if (Date.now() - confirmedDate.getTime() < 90 * 1000) {
    return;
  }

  await notifyUser(user.id, "user_registered", "Welcome to LXD Guild", "Your account is verified and your dashboard is ready.", {
    role: profile.role,
    name: profile.name,
    email: user.email || "",
    dashboard_url: `${getSiteUrl()}/dashboard`,
    target_role: profile.candidate_target_role,
    designation_bucket: profile.candidate_designation,
  });

  await supabase
    .from("profiles")
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq("id", user.id);
}
