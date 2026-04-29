import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !url) return null;
  return createSupabaseClient(url, serviceRoleKey);
}

export async function POST(req: Request) {
  const secret = req.headers.get("x-lxd-sync-secret");
  if (!secret || secret !== process.env.LEARNDASH_SYNC_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const body = await req.json();
  const {
    certificate_code,
    learndash_user_id,
    learner_email,
    learner_name,
    course_id,
    course_name,
    completion_date,
    certificate_url,
    certificate_id_display,
  } = body ?? {};

  if (!certificate_code || !learner_email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("certificate_registry")
    .upsert(
      {
        certificate_code,
        learndash_user_id: typeof learndash_user_id === "number" ? learndash_user_id : null,
        learner_email,
        learner_name: learner_name || null,
        course_id: typeof course_id === "number" ? course_id : null,
        course_name: course_name || null,
        completion_date: completion_date || null,
        certificate_url: certificate_url || null,
        certificate_id_display: certificate_id_display || null,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "certificate_code" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
