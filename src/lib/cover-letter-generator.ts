import type { ParsedResume } from "../../ats-module/types";

type CoverLetterInput = {
  parsedResume: ParsedResume;
  profile: {
    name?: string | null;
    headline?: string | null;
    skills?: string[] | null;
    experience_years?: number | null;
  };
  recommendedSkills: string[];
};

export type CoverLetterResult = {
  source: "ai" | "template";
  subject: string;
  intro: string;
  body: string[];
  closing: string;
  note: string;
};

function extractJsonObject(raw: string) {
  const fencedMatch = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) return fencedMatch[1].trim();
  const objectMatch = raw.match(/\{[\s\S]*\}/);
  return objectMatch?.[0]?.trim() || null;
}

function sanitizeResult(payload: any): CoverLetterResult | null {
  if (!payload || typeof payload !== "object") return null;

  const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
  const intro = typeof payload.intro === "string" ? payload.intro.trim() : "";
  const body = Array.isArray(payload.body)
    ? payload.body
        .filter((item: unknown): item is string => typeof item === "string")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];
  const closing = typeof payload.closing === "string" ? payload.closing.trim() : "";
  const note = typeof payload.note === "string" ? payload.note.trim() : "";

  if (!subject || !intro || body.length === 0 || !closing) return null;

  return {
    source: "ai",
    subject,
    intro,
    body: body.slice(0, 3),
    closing,
    note,
  };
}

async function generateWithOpenAI(input: CoverLetterInput) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-5";
  const prompt = [
    "You are a cover letter assistant for LXD Guild candidates.",
    "Create a concise, reusable cover letter draft grounded only in the provided resume signals.",
    "Do not invent employers, metrics, certifications, or job-specific claims that are not present.",
    "Return strict JSON only with keys: subject, intro, body, closing, note.",
    "body must be an array with 2 or 3 short paragraphs.",
    `Candidate name: ${input.profile.name || "Candidate"}`,
    `Candidate headline: ${input.profile.headline || "Not provided"}`,
    `Experience years: ${input.profile.experience_years || input.parsedResume.yearsOfExperience || 0}`,
    `Detected skills: ${input.parsedResume.skills.join(", ") || "None"}`,
    `Detected roles: ${input.parsedResume.roles.join(", ") || "None"}`,
    `Recommended skills to strengthen: ${input.recommendedSkills.join(", ") || "None"}`,
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
            "Return cover letter JSON only. Keep it concise, credible, and reusable across L&D applications.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) return null;

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
  if (!jsonText) return null;

  try {
    return sanitizeResult(JSON.parse(jsonText));
  } catch {
    return null;
  }
}

function buildTemplateCoverLetter(input: CoverLetterInput): CoverLetterResult {
  const name = input.profile.name || "Candidate";
  const role = input.parsedResume.roles[0] || input.profile.headline || "Learning and Development professional";
  const years = input.profile.experience_years || input.parsedResume.yearsOfExperience || 0;
  const topSkills = input.parsedResume.skills.slice(0, 4).join(", ");
  const growthSkills = input.recommendedSkills.slice(0, 2).join(", ");

  return {
    source: "template",
    subject: `${name} | ${role} application`,
    intro: `Dear Hiring Team, I am excited to be considered for ${role.toLowerCase()} opportunities where strong learning design, delivery, and business-focused execution matter.`,
    body: [
      years
        ? `I bring ${years}+ years of experience across learning and development work, with visible strengths in ${topSkills || "instructional design, facilitation, and stakeholder collaboration"}.`
        : `My background shows practical experience across learning and development work, with strengths in ${topSkills || "instructional design, facilitation, and stakeholder collaboration"}.`,
      growthSkills
        ? `I am especially focused on building deeper capability in ${growthSkills}, while continuing to improve how I design clear, measurable learning experiences.`
        : "I focus on building practical, learner-centered solutions and presenting that work in a clear, ATS-friendly way.",
      "I would welcome the opportunity to bring a thoughtful, execution-focused approach to your team and contribute to learning programs that drive real outcomes.",
    ],
    closing: "Thank you for your time and consideration. I would be glad to discuss my background further.",
    note: "Use this as a base draft, then tailor the opening line and one paragraph to the specific role before sending.",
  };
}

export async function generateCoverLetter(input: CoverLetterInput) {
  const aiResult = await generateWithOpenAI(input);
  if (aiResult) return aiResult;
  return buildTemplateCoverLetter(input);
}
