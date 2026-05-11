import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { downloadResumeBuffer } from "@/lib/resume-analysis";
import { parseResumeFile } from "../../../../../ats-module";
import { getResumeSkillSuggestions } from "@/lib/resume-skill-suggestions";
import { getAcademyCourseRecommendations } from "@/lib/skill-gap-course-recommendations";
import { optimizeResumeContent } from "@/lib/resume-optimizer";
import { computeResumeReadiness, projectOptimizedReadinessScore } from "@/lib/resume-readiness";

function isMissingColumnError(message?: string | null) {
  const normalized = message || "";
  return (
    normalized.includes("Could not find") ||
    normalized.includes("does not exist") ||
    normalized.includes("schema cache")
  );
}

function extractSection(text: string, heading: string) {
  const normalized = text.replace(/\r/g, "");
  const pattern = new RegExp(`${heading}\\s*\\n([\\s\\S]*?)(\\n[A-Z][A-Z\\s]{2,}|$)`, "i");
  const match = normalized.match(pattern);
  return match?.[1]?.trim() || "";
}

function extractBulletLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*•]/.test(line))
    .map((line) => line.replace(/^[-*•]\s*/, ""))
    .filter(Boolean)
    .slice(0, 4);
}

function summarizeText(text: string, maxLength = 220) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength).trim()}...`;
}

function buildOriginalPreview({
  parsedResume,
  profile,
  fileName,
}: {
  parsedResume: Awaited<ReturnType<typeof parseResumeFile>>;
  profile: {
    name?: string | null;
    headline?: string | null;
  } | null;
  fileName?: string | null;
}) {
  const summarySection =
    extractSection(parsedResume.text, "professional summary") ||
    extractSection(parsedResume.text, "summary") ||
    summarizeText(parsedResume.text, 240);
  const bulletPoints = extractBulletLines(parsedResume.text);
  const fallbackName = fileName?.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim() || "Resume Draft";

  return {
    name: profile?.name?.trim() || fallbackName,
    headline: profile?.headline?.trim() || parsedResume.roles[0] || "Learning and Development Professional",
    summary: summarySection || "Original resume preview unavailable.",
    bulletPoints,
    skills: parsedResume.skills.slice(0, 6),
  };
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

  if (!fullQuery.error) {
    return fullQuery.data;
  }

  if (fullQuery.error.code !== "42703" && !isMissingColumnError(fullQuery.error.message)) {
    return null;
  }

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

    const suggestions = getResumeSkillSuggestions({
      parsedResume,
      existingProfileSkills: profileQuery.data?.skills || [],
    });

    const academyCourseRecommendations = getAcademyCourseRecommendations(suggestions.recommendedSkills);
    const baselineReadiness = computeResumeReadiness({
      parsedResume,
      existingProfileSkills: profileQuery.data?.skills || [],
      recommendedSkills: suggestions.recommendedSkills,
    });
    const optimization = await optimizeResumeContent({
      parsedResume,
      profile: profileQuery.data || {},
      recommendedSkills: suggestions.recommendedSkills,
      academyCourseRecommendations,
    });
    const projectedScore = projectOptimizedReadinessScore(
      baselineReadiness,
      optimization,
      suggestions.recommendedSkills
    );
    const improvement = Math.max(projectedScore - baselineReadiness.score, 0);
    const originalPreview = buildOriginalPreview({
      parsedResume,
      profile: profileQuery.data || null,
      fileName: resumeRecord.file_name,
    });

    return NextResponse.json({
      success: true,
      source: optimization.source,
      summary: optimization.summary,
      skillsSection: optimization.skillsSection,
      bulletPoints: optimization.bulletPoints,
      atsFormattingTips: optimization.atsFormattingTips,
      note: optimization.note,
      beforeScore: baselineReadiness.score,
      afterScore: projectedScore,
      improvementPercent: improvement,
      strengths: baselineReadiness.strengths,
      focusAreas: baselineReadiness.focusAreas,
      originalPreview,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Resume optimization failed.",
      },
      { status: 500 }
    );
  }
}
