import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type PreferenceType = "company" | "role";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const type = body.type as PreferenceType;
    const value = String(body.value || "").trim();

    if (!value || !["company", "role"].includes(type)) {
      return NextResponse.json({ error: "Invalid preference request." }, { status: 400 });
    }

    if (type === "company") {
      const { data: existing } = await supabase
        .from("saved_companies")
        .select("id")
        .eq("user_id", user.id)
        .eq("company_name", value)
        .maybeSingle();

      if (existing?.id) {
        await supabase.from("saved_companies").delete().eq("id", existing.id);
        return NextResponse.json({ saved: false, type, value });
      }

      await supabase.from("saved_companies").insert({
        user_id: user.id,
        company_name: value,
      });

      return NextResponse.json({ saved: true, type, value });
    }

    const { data: existing } = await supabase
      .from("followed_job_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("keyword", value)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from("followed_job_roles").delete().eq("id", existing.id);
      return NextResponse.json({ saved: false, type, value });
    }

    await supabase.from("followed_job_roles").insert({
      user_id: user.id,
      keyword: value,
    });

    return NextResponse.json({ saved: true, type, value });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown preference error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
