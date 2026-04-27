import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { downloadResumeBuffer, scoreResumeWithMlService } from "@/lib/resume-analysis";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let parsedResumeId = "";
  try {
    const body = await req.json();
    const resumeId = typeof body.resumeId === "string" ? body.resumeId : "";
    parsedResumeId = resumeId;

    if (!resumeId) {
      return NextResponse.json({ error: "resumeId is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = createAdminClient() ?? supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: resume } = await supabase
      .from("resumes")
      .select("id, user_id, file_url, file_path, file_name, mime_type")
      .eq("id", resumeId)
      .single();

    if (!resume || resume.user_id !== user.id) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("skills")
      .eq("id", user.id)
      .single();

    await adminSupabase
      .from("resumes")
      .update({
        ats_analysis_status: "processing",
        ats_analysis_error: null,
      })
      .eq("id", resumeId);

    const downloaded = await downloadResumeBuffer({
      filePath: resume.file_path,
      fileUrl: resume.file_url,
      fileName: resume.file_name,
      mimeType: resume.mime_type,
    });

    const analysis = await scoreResumeWithMlService({
      buffer: downloaded.buffer,
      fileName: downloaded.fileName,
      mimeType: downloaded.mimeType,
      candidateSkills: Array.isArray(profile?.skills) ? profile.skills.map(String) : [],
    });

    const { data: updatedResume, error: updateError } = await adminSupabase
      .from("resumes")
      .update({
        file_path: resume.file_path || downloaded.sourcePath,
        mime_type: resume.mime_type || downloaded.mimeType,
        ats_score: analysis.score,
        ats_summary: analysis.summary,
        ats_recommendations: analysis.recommendations,
        ats_highlights: analysis.highlights,
        ats_missing_skills: analysis.missing_keywords,
        ats_analysis_status: "completed",
        ats_analysis_error: null,
        ats_last_analyzed_at: new Date().toISOString(),
      })
      .eq("id", resumeId)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resume: updatedResume,
      analysis,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Resume scoring failed.";

    if (parsedResumeId) {
      const adminSupabase = createAdminClient();
      if (adminSupabase) {
        await adminSupabase
          .from("resumes")
          .update({
            ats_analysis_status: "failed",
            ats_analysis_error: message,
            ats_last_analyzed_at: new Date().toISOString(),
          })
          .eq("id", parsedResumeId);
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
