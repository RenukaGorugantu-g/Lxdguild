import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { notifyUser, notifyAdmins } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, company, location, apply_url, description } = body;

    if (!title || !company || !location || !apply_url || !description) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Unable to verify user." }, { status: 500 });
    }

    if (!profile.role?.startsWith("employer") && profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: existing } = await supabase.from("jobs").select("id").eq("apply_url", apply_url).single();
    if (existing) {
      return NextResponse.json({ error: "This job has already been posted." }, { status: 409 });
    }

    const { data: insertedJob, error: insertError } = await supabase.from("jobs").insert({
      title,
      company,
      location,
      description,
      source: "employer",
      apply_url,
      user_id: user.id,
    }).select('id, title, company');

    if (insertError) {
      const message = insertError.message || "Unable to post job.";
      if (message.includes("user_id") && message.includes("does not exist")) {
        const { data: fallbackJob, error: fallbackError } = await supabase.from("jobs").insert({
          title,
          company,
          location,
          description,
          source: "employer",
          apply_url,
        }).select('id, title, company');

        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message || "Unable to post job." }, { status: 500 });
        }

        await notifyAdmins(
          'job_posted_admin',
          'Employer posted a new job',
          `A new employer job was posted: ${title} at ${company}.`,
          { job_id: fallbackJob?.[0]?.id, title, company }
        );

        return NextResponse.json({
          success: true,
          warning:
            "Job posted, but jobs.user_id is missing from the database schema. Apply pending migrations to restore employer ownership.",
        });
      }

      return NextResponse.json({ error: message }, { status: 500 });
    }

    const job = Array.isArray(insertedJob) ? insertedJob[0] : insertedJob;

    await notifyUser(
      user.id,
      'job_posted',
      'Job posted successfully',
      `Your job posting for ${title} at ${company} is live. Candidates will be notified when they apply.`,
      { job_id: job?.id, title, company }
    );

    await notifyAdmins(
      'job_posted_admin',
      'Employer posted a new job',
      `An employer posted a new job: ${title} at ${company}.`,
      { job_id: job?.id, title, company }
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
