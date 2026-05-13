import type { ParsedResume } from "../../ats-module/types";

export type ResumeValidationResult = {
  isLikelyResume: boolean;
  confidenceScore: number;
  message: string;
};

const SECTION_PATTERNS = [
  "summary",
  "professional summary",
  "experience",
  "work experience",
  "employment",
  "education",
  "skills",
  "technical skills",
  "projects",
  "certifications",
  "achievements",
];

function countMatches(source: string, patterns: string[]) {
  return patterns.reduce((total, pattern) => total + (source.includes(pattern) ? 1 : 0), 0);
}

export function validateResumeDocument(parsedResume: ParsedResume): ResumeValidationResult {
  const normalizedText = parsedResume.text.toLowerCase().replace(/\s+/g, " ").trim();
  const wordCount = normalizedText ? normalizedText.split(" ").filter(Boolean).length : 0;
  const sectionCount = countMatches(normalizedText, SECTION_PATTERNS);
  const bulletLineCount = parsedResume.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*•]\s+/.test(line)).length;
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(parsedResume.text);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(parsedResume.text);

  let confidenceScore = 0;

  if (wordCount >= 80) confidenceScore += 1;
  if (wordCount >= 180) confidenceScore += 1;
  if (sectionCount >= 2) confidenceScore += 1;
  if (sectionCount >= 4) confidenceScore += 1;
  if (parsedResume.roles.length >= 1) confidenceScore += 1;
  if (parsedResume.skills.length >= 3) confidenceScore += 1;
  if (parsedResume.yearsOfExperience > 0) confidenceScore += 1;
  if (bulletLineCount >= 2) confidenceScore += 1;
  if (hasEmail) confidenceScore += 1;
  if (hasPhone) confidenceScore += 1;

  const hasCoreResumeSignal =
    sectionCount >= 2 ||
    parsedResume.roles.length >= 1 ||
    parsedResume.skills.length >= 3 ||
    parsedResume.yearsOfExperience > 0;

  const isLikelyResume = wordCount >= 80 && hasCoreResumeSignal && confidenceScore >= 4;

  return {
    isLikelyResume,
    confidenceScore,
    message: isLikelyResume
      ? "Resume looks valid for scoring."
      : "This file does not look like a readable resume yet. Upload a resume PDF or DOCX with real resume text to get scoring and suggestions.",
  };
}
