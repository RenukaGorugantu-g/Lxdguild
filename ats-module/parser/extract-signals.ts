import { KNOWN_ROLE_PATTERNS, KNOWN_SKILLS } from "../utils/constants";
import { collectWordTokens, normalizeText, normalizeList, percent } from "../utils/text";
import type { ParsedResume } from "../types";

export function parseResumeText({
  fileName,
  mimeType,
  text,
}: {
  fileName: string;
  mimeType: string;
  text: string;
}): ParsedResume {
  const normalizedText = normalizeText(text);
  const skills = extractSkills(normalizedText);
  const roles = extractRoles(normalizedText);
  const yearsOfExperience = extractYearsOfExperience(normalizedText);
  const keywords = extractKeywords(normalizedText, skills);

  return {
    fileName,
    mimeType,
    text,
    skills,
    yearsOfExperience,
    roles,
    keywords,
  };
}

export function extractSkills(normalizedText: string) {
  return normalizeList(KNOWN_SKILLS.filter((skill) => normalizedText.includes(skill)));
}

export function extractRoles(normalizedText: string) {
  return normalizeList(KNOWN_ROLE_PATTERNS.filter((role) => normalizedText.includes(role)));
}

export function extractYearsOfExperience(normalizedText: string) {
  const patterns = [
    /(\d{1,2})\+?\s+years? of experience/g,
    /experience of\s+(\d{1,2})\+?\s+years?/g,
    /(\d{1,2})\+?\s+years? experience/g,
  ];

  const values: number[] = [];

  for (const pattern of patterns) {
    for (const match of normalizedText.matchAll(pattern)) {
      values.push(Number(match[1]));
    }
  }

  return values.length ? Math.max(...values) : 0;
}

export function extractKeywords(normalizedText: string, knownSkills: string[]) {
  const tokens = collectWordTokens(normalizedText);
  const frequency = new Map<string, number>();

  for (const token of tokens) {
    if (token.length < 5) {
      continue;
    }

    frequency.set(token, (frequency.get(token) || 0) + 1);
  }

  const ranked = [...frequency.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 20)
    .map(([token]) => token);

  return normalizeList([...knownSkills, ...ranked]);
}

export function summarizeResumeStrength(parsedResume: ParsedResume) {
  const strengths: string[] = [];

  if (parsedResume.skills.length >= 5) {
    strengths.push(`Detected ${parsedResume.skills.length} relevant skills in the resume.`);
  }

  if (parsedResume.yearsOfExperience >= 5) {
    strengths.push(`Resume suggests ${parsedResume.yearsOfExperience} years of experience.`);
  }

  if (parsedResume.roles.length > 0) {
    strengths.push(`Detected likely roles: ${parsedResume.roles.join(", ")}.`);
  }

  if (!strengths.length) {
    strengths.push("Resume includes enough text for baseline ATS analysis.");
  }

  return strengths;
}

export function compareKeywordCoverage(jobKeywords: string[], resumeKeywords: string[]) {
  const resumeSet = new Set(resumeKeywords.map((item) => normalizeText(item)));
  const matched = jobKeywords.filter((keyword) => resumeSet.has(normalizeText(keyword)));

  return {
    matched,
    percentage: percent(matched.length, jobKeywords.length),
  };
}
