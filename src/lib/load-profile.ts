import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/utils/supabase/admin";

export async function loadProfile<T>(
  supabase: SupabaseClient,
  userId: string,
  selectClause: string
): Promise<T | null> {
  const primaryResult = await supabase
    .from("profiles")
    .select(selectClause)
    .eq("id", userId)
    .maybeSingle();

  if (primaryResult.data) {
    return primaryResult.data as T;
  }

  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const adminResult = await admin
    .from("profiles")
    .select(selectClause)
    .eq("id", userId)
    .maybeSingle();

  return (adminResult.data as T | null) || null;
}
