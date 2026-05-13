import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { maybeSendPostVerificationWelcome } from "@/lib/post-verification-welcome";
import { loadProfile } from "@/lib/load-profile";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ skipped: true });
    }

    const profile = await loadProfile<{
      role?: string | null;
      name?: string | null;
      candidate_target_role?: string | null;
      candidate_designation?: string | null;
      welcome_email_sent_at?: string | null;
    }>(
      supabase,
      user.id,
      "role, name, candidate_target_role, candidate_designation, welcome_email_sent_at"
    );

    await maybeSendPostVerificationWelcome(supabase, user, profile);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Post-login welcome email failed:", error);
    return NextResponse.json({ success: false });
  }
}
