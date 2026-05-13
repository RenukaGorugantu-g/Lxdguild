import type { ParsedResume } from "../../ats-module/types";
import { validateResumeDocument } from "@/lib/resume-validation";

type ResumeReadinessInput = {
  parsedResume: ParsedResume;
  existingProfileSkills?: string[] | null;
  recommendedSkills?: string[];
};

type ResumeOptimizationLike = {
  skillsSection: string[];
  bulletPoints: string[];
  summary: string;
};

export type ResumeReadinessResult = {
  score: number;
  strengths: string[];
  focusAreas: string[];
  breakdown: Array<{
    label: string;
    score: number;
    detail: string;
  }>;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function roundScore(value: number) {
  return Math.round(clamp(value));
}

function normalize(values: string[]) {
  return unique(values.map((value) => value.trim().toLowerCase()).filter(Boolean));
}

export function computeResumeReadiness({
  parsedResume,
  existingProfileSkills,
  recommendedSkills,
}: ResumeReadinessInput): ResumeReadinessResult {
  const validation = validateResumeDocument(parsedResume);
  if (!validation.isLikelyResume) {
    return {
      score: 0,
      strengths: [],
      focusAreas: [validation.message],
      breakdown: [
        {
          label: "Skill coverage",
          score: 0,
          detail: "Resume skill signals could not be validated.",
        },
        {
          label: "Role clarity",
          score: 0,
          detail: "Role title could not be confidently detected from the uploaded file.",
        },
        {
          label: "Experience signal",
          score: 0,
          detail: "Experience signal is unavailable because the document does not read like a resume.",
        },
        {
          label: "Keyword depth",
          score: 0,
          detail: "Keyword extraction is disabled for invalid or unreadable resume files.",
        },
        {
          label: "ATS structure",
          score: 0,
          detail: "Section and formatting checks require a real resume document.",
        },
      ],
    };
  }

  const resumeSkills = normalize(parsedResume.skills);
  const profileSkills = normalize(existingProfileSkills || []);
  const skillUniverse = unique([...resumeSkills, ...profileSkills]);
  const recommendationPool = normalize(recommendedSkills || []);
  const missingRecommendedCount = recommendationPool.filter((skill) => !skillUniverse.includes(skill)).length;

  const skillCoverageScore = clamp(35 + skillUniverse.length * 5 - missingRecommendedCount * 2, 25, 100);
  const roleClarityScore = clamp(parsedResume.roles.length > 0 ? 75 + parsedResume.roles.length * 5 : 40, 35, 100);
  const experienceScore = clamp(
    parsedResume.yearsOfExperience > 0 ? 50 + parsedResume.yearsOfExperience * 6 : 35,
    30,
    100
  );
  const keywordDepthScore = clamp(parsedResume.keywords.length * 4, 30, 100);
  const structureScore = clamp(
    (parsedResume.text.length > 1200 ? 68 : 52) +
      (parsedResume.text.includes("summary") ? 10 : 0) +
      (parsedResume.text.includes("experience") ? 10 : 0) +
      (parsedResume.text.includes("skills") ? 10 : 0),
    40,
    100
  );

  const score = roundScore(
    skillCoverageScore * 0.32 +
      roleClarityScore * 0.14 +
      experienceScore * 0.18 +
      keywordDepthScore * 0.16 +
      structureScore * 0.2
  );

  const strengths: string[] = [];
  const focusAreas: string[] = [];

  if (skillUniverse.length >= 6) {
    strengths.push(`Strong skill coverage with ${skillUniverse.length} visible capabilities.`);
  } else {
    focusAreas.push("Expand the visible skills section so ATS systems can match more role keywords.");
  }

  if (parsedResume.roles.length > 0) {
    strengths.push(`Role clarity is present through titles like ${parsedResume.roles.slice(0, 2).join(", ")}.`);
  } else {
    focusAreas.push("Make the target role clearer in the headline and summary.");
  }

  if (parsedResume.yearsOfExperience >= 3) {
    strengths.push(`Experience signal is reasonably clear at ${parsedResume.yearsOfExperience}+ years.`);
  } else {
    focusAreas.push("State years of experience more directly in the summary or headline.");
  }

  if (missingRecommendedCount > 0) {
    focusAreas.push(
      `Close the most visible gaps by adding skills like ${recommendationPool.slice(0, 3).join(", ")} where accurate.`
    );
  }

  if (!parsedResume.text.toLowerCase().includes("skills")) {
    focusAreas.push("Add a dedicated skills section for easier ATS scanning.");
  }

  return {
    score,
    strengths: unique(strengths).slice(0, 4),
    focusAreas: unique(focusAreas).slice(0, 4),
    breakdown: [
      {
        label: "Skill coverage",
        score: roundScore(skillCoverageScore),
        detail: `${skillUniverse.length} visible skills across resume and profile.`,
      },
      {
        label: "Role clarity",
        score: roundScore(roleClarityScore),
        detail: parsedResume.roles.length
          ? `Detected role signals: ${parsedResume.roles.slice(0, 2).join(", ")}.`
          : "Role title is not clearly reinforced in the resume text.",
      },
      {
        label: "Experience signal",
        score: roundScore(experienceScore),
        detail: parsedResume.yearsOfExperience
          ? `${parsedResume.yearsOfExperience}+ years of experience detected.`
          : "Years of experience are not clearly stated.",
      },
      {
        label: "Keyword depth",
        score: roundScore(keywordDepthScore),
        detail: `${parsedResume.keywords.length} reusable keywords extracted from the resume.`,
      },
      {
        label: "ATS structure",
        score: roundScore(structureScore),
        detail: "Checks readability, section signals, and scan-friendly formatting cues.",
      },
    ],
  };
}

export function projectOptimizedReadinessScore(
  baseline: ResumeReadinessResult,
  optimization: ResumeOptimizationLike,
  recommendedSkills: string[] = []
) {
  let projected = baseline.score;

  projected += Math.min(12, optimization.skillsSection.length);
  projected += Math.min(10, optimization.bulletPoints.length * 2);
  projected += optimization.summary.length > 140 ? 6 : 3;
  projected += Math.min(8, normalize(recommendedSkills).filter((skill) =>
    normalize(optimization.skillsSection).includes(skill)
  ).length * 2);

  return roundScore(Math.max(projected, baseline.score + 6));
}
