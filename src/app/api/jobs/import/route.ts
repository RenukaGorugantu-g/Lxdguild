import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { syncJobFeed } from "@/lib/job-feed";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const isJson = searchParams.get("format") === "json";

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await syncJobFeed({ trigger: "manual" });

    if (isJson) {
      return NextResponse.json(result);
    }

    const destination = new URL("/dashboard/jobs", req.url);
    destination.searchParams.set("imported", String(result.imported));
    destination.searchParams.set("refreshed", String(result.refreshed));
    destination.searchParams.set("expired", String(result.expired));
    return NextResponse.redirect(destination);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown sync error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
