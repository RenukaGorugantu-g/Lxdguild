import { summarizeResumeStrength } from "../parser/extract-signals";
import {
  calculateExperienceMatch,
  calculateKeywordMatch,
  calculateRoleAlignment,
  calculateSkillMatch,
  getKeywordCoverage,
} from "./matchers";
import { clampScore } from "../utils/text";
import type { ScoreBreakdown, ScoreCandidateInput } from "../types";

export function scoreCandidate(input: ScoreCandidateInput): ScoreBreakdown {
  const skillResults = calculateSkillMatch(input.job, input.resume);
  const experienceMatch = calculateExperienceMatch(input.job, input.resume);
  const keywordMatch = calculateKeywordMatch(input.job, input.resume);
  const roleAlignment = calculateRoleAlignment(input.job, input.resume);
  const keywordCoverage = getKeywordCoverage(input.job, input.resume);
  const hasSkillCriteria = input.job.requiredSkills.length > 0 || Boolean(input.job.preferredSkills?.length);
  const hasExperienceCriteria = (input.job.minimumYearsOfExperience || 0) > 0;
  const skillWeight = hasSkillCriteria ? 0.4 : 0;
  const experienceWeight = hasExperienceCriteria ? 0.2 : 0.1;
  const keywordWeight = 0.3;
  const roleWeight = 0.2;
  const totalWeight = skillWeight + experienceWeight + keywordWeight + roleWeight;

  let score = clampScore(
    (skillWeight * skillResults.skillMatch +
      experienceWeight * experienceMatch +
      keywordWeight * keywordMatch +
      roleWeight * roleAlignment) /
      totalWeight
  );
  const requiredCoverage = input.job.requiredSkills.length
    ? skillResults.matchedRequired.filter((skill) => input.job.requiredSkills.includes(skill)).length /
      input.job.requiredSkills.length
    : 1;

  // Hard cap resumes that miss too many of the actual core requirements.
  if (input.job.requiredSkills.length >= 3 && skillResults.matchedRequired.length === 0) {
    score = Math.min(score, 35);
  } else if (requiredCoverage < 0.35) {
    score = Math.min(score, 55);
  } else if (roleAlignment < 35) {
    score = Math.min(score, 60);
  }

  const strengths = [
    ...summarizeResumeStrength(input.resume),
    ...(skillResults.matchedRequired.length
      ? [`Matched required skills: ${skillResults.matchedRequired.join(", ")}.`]
      : []),
    ...(skillResults.matchedPreferred.length
      ? [`Matched preferred skills: ${skillResults.matchedPreferred.join(", ")}.`]
      : []),
    ...(experienceMatch === 100 && (input.job.minimumYearsOfExperience || 0) > 0
      ? [`Meets the minimum experience requirement of ${input.job.minimumYearsOfExperience} years.`]
      : []),
  ];

  return {
    score,
    skillMatch: skillResults.skillMatch,
    experienceMatch,
    keywordMatch,
    roleAlignment,
    matchedSkills: [...skillResults.matchedRequired, ...skillResults.matchedPreferred],
    missingSkills: skillResults.missingSkills,
    matchedKeywords: keywordCoverage.matched,
    missingKeywords: (input.job.keywords || []).filter(
      (keyword) => !keywordCoverage.matched.includes(keyword)
    ),
    strengths,
  };
}
