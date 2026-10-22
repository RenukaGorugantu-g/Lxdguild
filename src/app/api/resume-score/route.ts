import { NextResponse } from "next/server";
import { buildJobInput, parseResumeFile, scoreCandidate } from "../../../../ats-module";
import { validateResumeDocument } from "@/lib/resume-validation";
import { downloadResumeBuffer } from "@/lib/resume-analysis";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

type ResumeRecord = {
  id: string;
  file_url: string | null;
  file_name: string | null;
  file_path?: string | null;
  mime_type?: string | null;
};

function isMissingColumnError(message?: string | null) {
  return Boolean(
    message &&
      (message.includes("Could not find") ||
        message.includes("does not exist") ||
        message.includes("schema cache"))
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

  if (!fullQuery.error) return fullQuery.data as ResumeRecord | null;
  if (fullQuery.error.code !== "42703" && !isMissingColumnError(fullQuery.error.message)) {
    throw new Error(fullQuery.error.message);
  }

  const fallbackQuery = await supabase
    .from("resumes")
    .select("id, file_url, file_name")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fallbackQuery.error) throw new Error(fallbackQuery.error.message);
  return fallbackQuery.data
    ? { ...fallbackQuery.data, file_path: null, mime_type: null }
    : null;
}

export async function POST(request: Request) {
  let body: { resumeId?: unknown; jobTitle?: unknown; jobDescription?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof body.resumeId !== "string" || !body.resumeId.trim()) {
    return NextResponse.json({ error: "Select a resume to analyze." }, { status: 400 });
  }

  if (typeof body.jobDescription !== "string" || body.jobDescription.trim().length < 40) {
    return NextResponse.json(
      { error: "Paste a job description with at least 40 characters for a meaningful match score." },
      { status: 400 }
    );
  }

  if (body.jobDescription.length > 30000) {
    return NextResponse.json({ error: "Job description must be 30,000 characters or fewer." }, { status: 413 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const resumeRecord = await getResumeRecord(supabase, body.resumeId.trim(), user.id);
    if (!resumeRecord) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    }

    const downloadedResume = await downloadResumeBuffer({
      filePath: resumeRecord.file_path,
      fileUrl: resumeRecord.file_url,
      fileName: resumeRecord.file_name,
      mimeType: resumeRecord.mime_type,
    });
    const parsedResume = await parseResumeFile({
      fileName: downloadedResume.fileName,
      mimeType: downloadedResume.mimeType,
      buffer: downloadedResume.buffer,
    });
    const validation = validateResumeDocument(parsedResume);

    if (!validation.isLikelyResume) {
      return NextResponse.json({ error: validation.message }, { status: 422 });
    }

    const jobTitle =
      typeof body.jobTitle === "string" && body.jobTitle.trim()
        ? body.jobTitle.trim().slice(0, 160)
        : "Target role";
    const result = scoreCandidate({
      job: buildJobInput(jobTitle, body.jobDescription),
      resume: parsedResume,
    });

    return NextResponse.json({
      success: true,
      score: result.score,
      skillMatch: result.skillMatch,
      experienceMatch: result.experienceMatch,
      keywordMatch: result.keywordMatch,
      roleAlignment: result.roleAlignment,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      matchedKeywords: result.matchedKeywords,
      missingKeywords: result.missingKeywords,
      strengths: result.strengths,
    });
  } catch (error) {
    console.error("[resume-score] analysis failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Resume analysis failed." },
      { status: 500 }
    );
  }
}
