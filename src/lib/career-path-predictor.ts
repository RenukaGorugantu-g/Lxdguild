import type { ParsedResume } from "../../ats-module/types";

export type CareerPathPrediction = {
  title: string;
  timeline: string;
  rationale: string;
  requiredSkills: string[];
};

type PredictorInput = {
  parsedResume: ParsedResume;
  profile: {
    headline?: string | null;
    skills?: string[] | null;
    experience_years?: number | null;
  };
  recommendedSkills: string[];
};

type CareerPathTemplate = {
  title: string;
  triggers: string[];
  baseSkills: string[];
  stretchSkills: string[];
  timelineByReadiness: {
    strong: string;
    medium: string;
    early: string;
  };
  rationale: string;
};

const CAREER_PATH_TEMPLATES: CareerPathTemplate[] = [
  {
    title: "Instructional Designer",
    triggers: ["instructional design", "storyboarding", "curriculum design", "elearning"],
    baseSkills: ["instructional design", "storyboarding", "needs analysis", "adult learning"],
    stretchSkills: ["evaluation", "learning strategy", "articulate 360"],
    timelineByReadiness: {
      strong: "0-3 months",
      medium: "3-6 months",
      early: "6-9 months",
    },
    rationale: "You already show parts of the design workflow, so this path is a natural move when you tighten your design process and authoring language.",
  },
  {
    title: "Learning Experience Designer",
    triggers: ["instructional design", "learning design", "microlearning", "storyboarding"],
    baseSkills: ["learning design", "curriculum design", "microlearning", "adult learning"],
    stretchSkills: ["learning strategy", "evaluation", "stakeholder management"],
    timelineByReadiness: {
      strong: "3-4 months",
      medium: "4-7 months",
      early: "7-10 months",
    },
    rationale: "This path fits candidates who already think about learner journeys and want to move from content creation toward richer experience design.",
  },
  {
    title: "eLearning Developer",
    triggers: ["articulate 360", "rise", "captivate", "scorm", "xapi", "elearning"],
    baseSkills: ["articulate 360", "rise", "scorm", "xapi"],
    stretchSkills: ["captivate", "course production", "storyboarding"],
    timelineByReadiness: {
      strong: "0-3 months",
      medium: "3-5 months",
      early: "5-8 months",
    },
    rationale: "You already have signals that map well to digital course production, so this path is realistic if you strengthen the tools stack and execution proof.",
  },
  {
    title: "Learning Program Manager",
    triggers: ["program management", "project management", "stakeholder management", "analytics", "reporting"],
    baseSkills: ["program management", "project management", "stakeholder management", "reporting"],
    stretchSkills: ["analytics", "performance consulting", "learning strategy"],
    timelineByReadiness: {
      strong: "3-5 months",
      medium: "5-8 months",
      early: "8-12 months",
    },
    rationale: "This route is strong for candidates who already coordinate learning work and want to move closer to cross-functional ownership and scale.",
  },
  {
    title: "Facilitation and Training Lead",
    triggers: ["facilitation", "training delivery", "workshop design", "leadership development", "onboarding"],
    baseSkills: ["facilitation", "training delivery", "workshop design", "leadership development"],
    stretchSkills: ["stakeholder communication", "program management", "evaluation"],
    timelineByReadiness: {
      strong: "2-4 months",
      medium: "4-6 months",
      early: "6-9 months",
    },
    rationale: "You already show delivery-oriented strengths, so this path builds on those rather than forcing a complete career reset.",
  },
  {
    title: "Learning Strategy Consultant",
    triggers: ["learning strategy", "stakeholder management", "performance consulting", "needs analysis", "evaluation"],
    baseSkills: ["learning strategy", "needs analysis", "stakeholder communication", "performance consulting"],
    stretchSkills: ["evaluation", "analytics", "program management"],
    timelineByReadiness: {
      strong: "4-6 months",
      medium: "6-9 months",
      early: "9-12 months",
    },
    rationale: "This path suits candidates who are already moving beyond content production and toward business-facing learning decisions.",
  },
];

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function scorePath(template: CareerPathTemplate, normalizedSkills: Set<string>) {
  let score = 0;
  for (const trigger of template.triggers) {
    if (normalizedSkills.has(trigger)) score += 3;
  }
  for (const skill of template.baseSkills) {
    if (normalizedSkills.has(skill)) score += 2;
  }
  for (const skill of template.stretchSkills) {
    if (normalizedSkills.has(skill)) score += 1;
  }
  return score;
}

function inferTimeline(template: CareerPathTemplate, matchedBaseSkills: number) {
  if (matchedBaseSkills >= 3) return template.timelineByReadiness.strong;
  if (matchedBaseSkills >= 2) return template.timelineByReadiness.medium;
  return template.timelineByReadiness.early;
}

function extractJson(raw: string) {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const object = raw.match(/\[[\s\S]*\]/);
  return object?.[0]?.trim() || null;
}

function sanitizeAiPredictions(payload: unknown) {
  if (!Array.isArray(payload)) return null;

  const cleaned = payload
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Record<string, unknown>;
      const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
      const timeline = typeof candidate.timeline === "string" ? candidate.timeline.trim() : "";
      const rationale = typeof candidate.rationale === "string" ? candidate.rationale.trim() : "";
      const requiredSkills = Array.isArray(candidate.requiredSkills)
        ? candidate.requiredSkills
            .filter((skill: unknown): skill is string => typeof skill === "string")
            .map((skill) => skill.trim())
            .filter(Boolean)
        : [];

      if (!title || !timeline || !rationale || requiredSkills.length === 0) {
        return null;
      }

      return {
        title,
        timeline,
        rationale,
        requiredSkills: requiredSkills.slice(0, 6),
      };
    })
    .filter(Boolean) as CareerPathPrediction[];

  return cleaned.length ? cleaned.slice(0, 3) : null;
}

async function generateWithOpenAI(input: PredictorInput) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-5";
  const years = input.profile.experience_years || input.parsedResume.yearsOfExperience || 0;
  const prompt = [
    "You are a career path predictor for LXD Guild.",
    "Based on the resume and skill signals, suggest 2 to 3 realistic next career paths for a Learning and Development professional.",
    "Return strict JSON array only.",
    "Each item must have: title, timeline, rationale, requiredSkills.",
    "Do not invent impossible jumps. Keep the paths realistic and adjacent.",
    `Headline: ${input.profile.headline || "Not provided"}`,
    `Years of experience: ${years}`,
    `Detected skills: ${input.parsedResume.skills.join(", ") || "None"}`,
    `Detected roles: ${input.parsedResume.roles.join(", ") || "None"}`,
    `Suggested next skills: ${input.recommendedSkills.join(", ") || "None"}`,
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
      temperature: 0.4,
      input: [
        {
          role: "developer",
          content:
            "Generate only realistic, adjacent career paths for L&D professionals. Output JSON array only and avoid exaggerated promises.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Career predictor AI call failed:", text);
    return null;
  }

  const payload = await response.json();
  const rawText =
    (typeof payload?.output_text === "string" && payload.output_text) ||
    (Array.isArray(payload?.output)
      ? payload.output
          .flatMap((item: any) => (Array.isArray(item?.content) ? item.content : []))
          .map((item: any) => item?.text || item?.output_text || "")
          .join("\n")
      : "");

  const jsonText = extractJson(rawText);
  if (!jsonText) return null;

  try {
    return sanitizeAiPredictions(JSON.parse(jsonText));
  } catch {
    return null;
  }
}

function generateTemplatePredictions(input: PredictorInput): CareerPathPrediction[] {
  const normalizedSkills = new Set(
    unique([
      ...input.parsedResume.skills.map((skill) => skill.toLowerCase()),
      ...((input.profile.skills || []).map((skill) => skill.toLowerCase())),
      ...input.recommendedSkills.map((skill) => skill.toLowerCase()),
    ])
  );

  return CAREER_PATH_TEMPLATES
    .map((template) => {
      const matchedBaseSkills = template.baseSkills.filter((skill) => normalizedSkills.has(skill)).length;
      return {
        title: template.title,
        timeline: inferTimeline(template, matchedBaseSkills),
        rationale: template.rationale,
        requiredSkills: unique([
          ...template.baseSkills.filter((skill) => !normalizedSkills.has(skill)),
          ...template.stretchSkills.filter((skill) => !normalizedSkills.has(skill)),
        ]).slice(0, 5),
        score: scorePath(template, normalizedSkills),
      };
    })
    .filter((path) => path.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, 3)
    .map(({ score: _score, ...path }) => ({
      ...path,
      requiredSkills: path.requiredSkills.length > 0 ? path.requiredSkills : ["portfolio proof", "clear achievement bullets"],
    }));
}

export async function predictCareerPaths(input: PredictorInput) {
  const aiResult = await generateWithOpenAI(input);
  if (aiResult) {
    return { source: "ai" as const, paths: aiResult };
  }

  return { source: "template" as const, paths: generateTemplatePredictions(input) };
}
