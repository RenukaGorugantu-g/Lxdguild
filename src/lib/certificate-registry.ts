import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type RegistryCandidate = {
  certificate_code: string;
  learner_email: string;
  learner_name: string | null;
  course_name: string | null;
  certificate_url: string | null;
  completion_date: string | null;
  claimed_by_user_id: string | null;
  id: string;
};

export type CertificateRegistryMatch =
  | {
      matched: true;
      entry: RegistryCandidate;
      reason: "email_match";
    }
  | {
      matched: false;
      reason: "missing_code" | "not_found" | "email_mismatch" | "claimed_by_other_user";
      entry?: RegistryCandidate | null;
    };

export async function verifyCertificateCodeForUser({
  supabase,
  userId,
  certificateCode,
  profileEmail,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  certificateCode: string | null | undefined;
  profileEmail: string | null | undefined;
}): Promise<CertificateRegistryMatch> {
  const normalizedCode = certificateCode?.trim();
  if (!normalizedCode) {
    return { matched: false, reason: "missing_code" };
  }

  const reader = getRegistryReader(supabase);

  const { data, error } = await reader
    .from("certificate_registry")
    .select("id, certificate_code, learner_email, learner_name, course_name, certificate_url, completion_date, claimed_by_user_id")
    .eq("certificate_code", normalizedCode)
    .maybeSingle();

  if (error || !data) {
    return { matched: false, reason: "not_found" };
  }

  const entry = data as RegistryCandidate;
  if (entry.claimed_by_user_id && entry.claimed_by_user_id !== userId) {
    return { matched: false, reason: "claimed_by_other_user", entry };
  }

  if (!profileEmail || entry.learner_email.trim().toLowerCase() !== profileEmail.trim().toLowerCase()) {
    return { matched: false, reason: "email_mismatch", entry };
  }

  return {
    matched: true,
    reason: "email_match",
    entry,
  };
}

export async function claimCertificateRegistryEntry({
  supabase,
  registryEntryId,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  registryEntryId: string;
  userId: string;
}) {
  const writer = getRegistryReader(supabase);

  const { error } = await writer
    .from("certificate_registry")
    .update({ claimed_by_user_id: userId, synced_at: new Date().toISOString() })
    .eq("id", registryEntryId);

  if (error) {
    console.error("Failed to claim certificate registry entry:", error.message);
  }
}

function getRegistryReader(fallback: Awaited<ReturnType<typeof createClient>>) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !url) {
    return fallback;
  }

  return createSupabaseClient(url, serviceRoleKey);
}
