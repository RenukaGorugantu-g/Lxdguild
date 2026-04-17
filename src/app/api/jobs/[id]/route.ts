import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (!profile.role?.startsWith("employer") && profile.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    if (profile.role !== "admin" && job.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { title, company, location, apply_url, description } = body;
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();

    if (!title || !company || !location || !apply_url || !description) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (!profile.role?.startsWith("employer") && profile.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    if (profile.role !== "admin" && job.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        title,
        company,
        location,
        apply_url,
        description,
        is_active: true,
        imported_at: nowIso,
        last_seen_at: nowIso,
        external_posted_at: nowIso,
        expires_at: expiresAt,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
