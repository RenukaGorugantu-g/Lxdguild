import { compareKeywordCoverage } from "../parser/extract-signals";
import { normalizeText, percent } from "../utils/text";
import type { JobInput, ParsedResume } from "../types";

export function calculateSkillMatch(job: JobInput, resume: ParsedResume) {
  const requiredSkills = job.requiredSkills || [];
  const preferredSkills = job.preferredSkills || [];
  const resumeSet = new Set(resume.skills.map((item) => normalizeText(item)));

  const matchedRequired = requiredSkills.filter((skill) => resumeHasSkill(skill, resumeSet, resume.text));
  const matchedPreferred = preferredSkills.filter((skill) => resumeHasSkill(skill, resumeSet, resume.text));
  const requiredPercentage = requiredSkills.length ? percent(matchedRequired.length, requiredSkills.length) : 0;
  const preferredPercentage = percent(matchedPreferred.length, preferredSkills.length);
  const weightedPreferredBoost = preferredSkills.length ? Math.round(preferredPercentage * 0.35) : 0;
  const skillMatch = requiredSkills.length
    ? Math.min(100, requiredPercentage + weightedPreferredBoost)
    : preferredSkills.length
      ? preferredPercentage
      : 0;
  const missingSkills = requiredSkills.filter((skill) => !resumeHasSkill(skill, resumeSet, resume.text));

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
    return 50;
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

  return mergedKeywords.length
    ? compareKeywordCoverage(mergedKeywords, resume.keywords).percentage
    : 0;
}

export function getKeywordCoverage(job: JobInput, resume: ParsedResume) {
  const keywords = job.keywords || [];
  return compareKeywordCoverage(keywords, resume.keywords);
}

export function calculateRoleAlignment(job: JobInput, resume: ParsedResume) {
  const normalizedTitle = normalizeText(job.title || "");
  const resumeRoles = resume.roles.map((role) => normalizeText(role));

  if (!resumeRoles.length) {
    return 55;
  }

  const titleMatch = resumeRoles.some((role) => normalizedTitle.includes(role) || role.includes(normalizedTitle));
  if (titleMatch) {
    return 100;
  }

  const jobIsAIGenerationRole =
    /prompt|image generation|video generation|ai content|generative ai|motion designer|animator|video editor/.test(normalizedTitle) ||
    /kling|veo|seedream|runway|eleven labs|google flow/.test(normalizeText(job.description || ""));
  const resumeIsClassicLndRole = resumeRoles.some((role) =>
    /instructional designer|learning designer|learning experience designer|curriculum designer|training specialist/.test(role)
  );

  if (jobIsAIGenerationRole && resumeIsClassicLndRole) {
    return 20;
  }

  const sharedTokens = resumeRoles.filter((role) => {
    const roleTokens = role.split(/\s+/).filter((token) => token.length >= 4);
    return roleTokens.some((token) => normalizedTitle.includes(token));
  });

  if (sharedTokens.length > 0) {
    return 70;
  }

  return 35;
}

function collectDescriptionKeywords(description: string) {
  return normalizeText(description)
    .split(/\s+/)
    .filter((token) => token.length >= 5)
    .slice(0, 30);
}

function resumeHasSkill(skill: string, resumeSkills: Set<string>, resumeText: string) {
  const normalizedSkill = normalizeText(skill);
  if (resumeSkills.has(normalizedSkill)) return true;

  const aliases: Record<string, string[]> = {
    "articulate 360": ["articulate storyline", "storyline 360", "storyline"],
    "articulate storyline": ["articulate 360", "storyline 360", "storyline"],
    "articulate rise": ["rise 360", "rise"],
    "rise 360": ["articulate rise", "rise"],
    xapi: ["experience api", "tin can api"],
    scorm: ["scorm 1.2", "scorm 2004"],
  };
  const variants = [normalizedSkill, ...(aliases[normalizedSkill] || [])];
  const normalizedResumeText = normalizeText(resumeText);

  return variants.some((variant) => {
    if (resumeSkills.has(variant)) return true;
    const escapedVariant = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escapedVariant}([^a-z0-9]|$)`, "i").test(normalizedResumeText);
  });
}
