import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { downloadResumeBuffer } from "@/lib/resume-analysis";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const { data: resume } = await supabase
      .from("resumes")
      .select("id, user_id, file_url, file_path, file_name, mime_type")
      .eq("id", id)
      .single();

    if (!resume) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    }

    let canAccess = resume.user_id === user.id || profile?.role === "admin";

    if (!canAccess) {
      const { data: ownedApplication } = await supabase
        .from("job_applications")
        .select("id, jobs!inner(user_id)")
        .eq("resume_id", id)
        .eq("jobs.user_id", user.id)
        .limit(1)
        .maybeSingle();

      const job = ownedApplication?.jobs;
      const ownerId = Array.isArray(job) ? job[0]?.user_id : job?.user_id;
      canAccess = ownerId === user.id;
    }

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const downloaded = await downloadResumeBuffer({
      filePath: resume.file_path,
      fileUrl: resume.file_url,
      fileName: resume.file_name,
      mimeType: resume.mime_type,
    });

    return new NextResponse(downloaded.buffer, {
      headers: {
        "Content-Type": downloaded.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${downloaded.fileName}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Resume download failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
