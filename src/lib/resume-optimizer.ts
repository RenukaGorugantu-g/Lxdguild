import type { ParsedResume } from "../../ats-module/types";

type ResumeOptimizationInput = {
  parsedResume: ParsedResume;
  profile: {
    name?: string | null;
    headline?: string | null;
    skills?: string[] | null;
    experience_years?: number | null;
  };
  recommendedSkills: string[];
  academyCourseRecommendations: Array<{
    title: string;
    recommendedFor: string[];
  }>;
};

export type ResumeOptimizationResult = {
  summary: string;
  skillsSection: string[];
  bulletPoints: string[];
  atsFormattingTips: string[];
  note: string;
  source: "ai" | "template";
};

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function extractJsonObject(raw: string) {
  const fencedMatch = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const objectMatch = raw.match(/\{[\s\S]*\}/);
  return objectMatch?.[0]?.trim() || null;
}

function sanitizeOptimization(payload: any): ResumeOptimizationResult | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const summary = typeof payload.summary === "string" ? payload.summary.trim() : "";
  const skillsSection = Array.isArray(payload.skillsSection)
    ? payload.skillsSection
        .filter((item: unknown): item is string => typeof item === "string")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];
  const bulletPoints = Array.isArray(payload.bulletPoints)
    ? payload.bulletPoints
        .filter((item: unknown): item is string => typeof item === "string")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];
  const atsFormattingTips = Array.isArray(payload.atsFormattingTips)
    ? payload.atsFormattingTips
        .filter((item: unknown): item is string => typeof item === "string")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];
  const note = typeof payload.note === "string" ? payload.note.trim() : "";

  if (!summary || skillsSection.length === 0 || bulletPoints.length === 0 || atsFormattingTips.length === 0) {
    return null;
  }

  return {
    summary,
    skillsSection: skillsSection.slice(0, 12),
    bulletPoints: bulletPoints.slice(0, 6),
    atsFormattingTips: atsFormattingTips.slice(0, 5),
    note,
    source: "ai",
  };
}

async function generateWithOpenAI(input: ResumeOptimizationInput) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-5";

  const prompt = [
    "You are an ATS resume optimization assistant for LXD Guild.",
    "Rewrite the resume content to be clearer, stronger, and more ATS-friendly without inventing fake employers, fake metrics, or fake certifications.",
    "Keep the tone professional and concise.",
    "Return strict JSON only with keys: summary, skillsSection, bulletPoints, atsFormattingTips, note.",
    "skillsSection must be an array of short skills.",
    "bulletPoints must be resume-ready bullet points.",
    "atsFormattingTips must be practical formatting tips.",
    "note should be a one-line explanation of what was improved.",
    `Candidate headline: ${input.profile.headline || "Not provided"}`,
    `Candidate experience years: ${input.profile.experience_years || input.parsedResume.yearsOfExperience || 0}`,
    `Detected resume skills: ${input.parsedResume.skills.join(", ") || "None detected"}`,
    `Detected resume roles: ${input.parsedResume.roles.join(", ") || "None detected"}`,
    `Recommended missing skills: ${input.recommendedSkills.join(", ") || "None"}`,
    `Recommended academy courses: ${
      input.academyCourseRecommendations.map((course) => course.title).join(", ") || "None"
    }`,
    "Resume text follows:",
    input.parsedResume.text,
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "low" },
      temperature: 0.5,
      input: [
        {
          role: "developer",
          content:
            "Produce structured resume optimization output only. Do not wrap the answer in commentary. Never invent facts not supported by the source resume.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    console.error("Resume optimizer AI call failed:", message);
    return null;
  }

  const payload = await response.json();
  const rawOutput =
    (typeof payload?.output_text === "string" && payload.output_text) ||
    (Array.isArray(payload?.output)
      ? payload.output
          .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
          .map((item: any) => item?.text || item?.output_text || "")
          .join("\n")
      : "");

  const jsonText = extractJsonObject(rawOutput);
  if (!jsonText) {
    return null;
  }

  try {
    return sanitizeOptimization(JSON.parse(jsonText));
  } catch {
    return null;
  }
}

function buildTemplateOptimization(input: ResumeOptimizationInput): ResumeOptimizationResult {
  const combinedSkills = unique([
    ...input.parsedResume.skills,
    ...(input.profile.skills || []),
    ...input.recommendedSkills,
  ]).slice(0, 12);

  const roleLabel = input.parsedResume.roles[0] || input.profile.headline || "Learning and Development professional";
  const years = input.profile.experience_years || input.parsedResume.yearsOfExperience || 0;
  const summarySkills = combinedSkills.slice(0, 5).join(", ");

  const bulletPoints = unique([
    years
      ? `Highlight ${years}+ years of experience in ${roleLabel.toLowerCase()} work with a stronger emphasis on business impact, learner outcomes, and project ownership.`
      : `Open with a stronger achievement-based bullet that positions you as a ${roleLabel.toLowerCase()} with clear L&D delivery strengths.`,
    input.parsedResume.skills.length
      ? `Rework your strongest experience bullets to surface tools and methods like ${input.parsedResume.skills.slice(0, 3).join(", ")} in ATS-friendly wording.`
      : "Rewrite role bullets using clearer action verbs, project scope, and measurable outcomes where your resume already supports them.",
    input.recommendedSkills.length
      ? `Where accurate, fold in missing but relevant capability language such as ${input.recommendedSkills.slice(0, 2).join(", ")} to better align with target job descriptions.`
      : "Align each experience bullet more closely to target job descriptions by mirroring the language of relevant L&D responsibilities.",
    "Keep each bullet focused on one outcome: what you designed, delivered, improved, or measured.",
  ]).slice(0, 4);

  return {
    summary: years
      ? `${roleLabel} with ${years}+ years of experience across learning design, delivery, and capability-building work. Stronger ATS alignment comes from clearly surfacing experience in ${summarySkills || "instructional design and related L&D functions"} while keeping the summary concise, role-specific, and outcome-oriented.`
      : `${roleLabel} with experience across learning and development work. Strengthen ATS alignment by clearly surfacing capability in ${summarySkills || "instructional design and related L&D functions"} and keeping the summary concise, role-specific, and outcome-oriented.`,
    skillsSection: combinedSkills,
    bulletPoints,
    atsFormattingTips: [
      "Keep section headings simple: Summary, Skills, Experience, Education, Certifications.",
      "Use plain text bullets and avoid tables, text boxes, or multi-column resume layouts.",
      "Mirror job-description language when it truthfully matches your real work.",
      "Keep dates, job titles, and employer names easy to scan in a consistent format.",
    ],
    note:
      input.academyCourseRecommendations.length > 0
        ? `This draft leans into your current strengths and the nearby skill gaps tied to ${input.academyCourseRecommendations[0]?.title}.`
        : "This draft leans into your current strengths and makes the resume easier for ATS systems to parse.",
    source: "template",
  };
}

export async function optimizeResumeContent(input: ResumeOptimizationInput) {
  const aiResult = await generateWithOpenAI(input);
  if (aiResult) {
    return aiResult;
  }

  return buildTemplateOptimization(input);
}
