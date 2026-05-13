import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { downloadResumeBuffer } from "@/lib/resume-analysis";
import { parseResumeFile } from "../../../../../ats-module";
import { getResumeSkillSuggestions } from "@/lib/resume-skill-suggestions";
import { generateCoverLetter } from "@/lib/cover-letter-generator";
import { validateResumeDocument } from "@/lib/resume-validation";

function isMissingColumnError(message?: string | null) {
  const normalized = message || "";
  return (
    normalized.includes("Could not find") ||
    normalized.includes("does not exist") ||
    normalized.includes("schema cache")
  );
}

async function getResumeRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  resumeId: string,
  userId: string
) {
  const fullQuery = await supabase
    .from("resumes")
    .select("id, file_url, file_name, file_path, mime_type")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!fullQuery.error) return fullQuery.data;
  if (fullQuery.error.code !== "42703" && !isMissingColumnError(fullQuery.error.message)) return null;

  const fallbackQuery = await supabase
    .from("resumes")
    .select("id, file_url, file_name")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();

  return fallbackQuery.data
    ? {
        ...fallbackQuery.data,
        file_path: null,
        mime_type: null,
      }
    : null;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { resumeId?: string };
  if (!body.resumeId) {
    return NextResponse.json({ error: "Missing resumeId." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [resumeRecord, profileQuery] = await Promise.all([
    getResumeRecord(supabase, body.resumeId, user.id),
    supabase
      .from("profiles")
      .select("name, headline, skills, experience_years")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!resumeRecord) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  try {
    const resumeFile = await downloadResumeBuffer({
      filePath: resumeRecord.file_path,
      fileUrl: resumeRecord.file_url,
      fileName: resumeRecord.file_name,
      mimeType: resumeRecord.mime_type,
    });

    const parsedResume = await parseResumeFile({
      fileName: resumeFile.fileName,
      mimeType: resumeFile.mimeType || undefined,
      buffer: resumeFile.buffer,
    });
    const validation = validateResumeDocument(parsedResume);

    if (!validation.isLikelyResume) {
      return NextResponse.json({ error: validation.message }, { status: 422 });
    }

    const suggestions = getResumeSkillSuggestions({
      parsedResume,
      existingProfileSkills: profileQuery.data?.skills || [],
    });

    const coverLetter = await generateCoverLetter({
      parsedResume,
      profile: profileQuery.data || {},
      recommendedSkills: suggestions.recommendedSkills,
    });

    return NextResponse.json({
      success: true,
      ...coverLetter,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cover letter generation failed." },
      { status: 500 }
    );
  }
}
