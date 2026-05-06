import { compareKeywordCoverage } from "../parser/extract-signals";
import { normalizeText, percent } from "../utils/text";
import type { JobInput, ParsedResume } from "../types";

export function calculateSkillMatch(job: JobInput, resume: ParsedResume) {
  const requiredSkills = job.requiredSkills || [];
  const preferredSkills = job.preferredSkills || [];
  const resumeSet = new Set(resume.skills.map((item) => normalizeText(item)));

  const matchedRequired = requiredSkills.filter((skill) => resumeSet.has(normalizeText(skill)));
  const matchedPreferred = preferredSkills.filter((skill) => resumeSet.has(normalizeText(skill)));
  const requiredPercentage = percent(matchedRequired.length, requiredSkills.length);
  const preferredPercentage = percent(matchedPreferred.length, preferredSkills.length);
  const weightedPreferredBoost = preferredSkills.length ? Math.round(preferredPercentage * 0.35) : 0;
  const skillMatch = Math.min(100, requiredPercentage + weightedPreferredBoost);
  const missingSkills = requiredSkills.filter((skill) => !resumeSet.has(normalizeText(skill)));

  return {
    skillMatch,
    matchedRequired,
    matchedPreferred,
    missingSkills,
  };
}

export function calculateExperienceMatch(job: JobInput, resume: ParsedResume) {
  const minimumYears = job.minimumYearsOfExperience || 0;

  if (minimumYears <= 0) {
    return 100;
  }

  if (resume.yearsOfExperience >= minimumYears) {
    return 100;
  }

  return percent(resume.yearsOfExperience, minimumYears);
}

export function calculateKeywordMatch(job: JobInput, resume: ParsedResume) {
  const explicitKeywords = job.keywords || [];
  const mergedKeywords = explicitKeywords.length
    ? explicitKeywords
    : [...job.requiredSkills, ...(job.preferredSkills || []), ...collectDescriptionKeywords(job.description)];

  return compareKeywordCoverage(mergedKeywords, resume.keywords).percentage;
}

function collectDescriptionKeywords(description: string) {
  return normalizeText(description)
    .split(/\s+/)
    .filter((token) => token.length >= 5)
    .slice(0, 30);
}
