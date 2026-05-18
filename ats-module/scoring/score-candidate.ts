import { summarizeResumeStrength } from "../parser/extract-signals";
import { calculateExperienceMatch, calculateKeywordMatch, calculateRoleAlignment, calculateSkillMatch } from "./matchers";
import { clampScore } from "../utils/text";
import type { ScoreBreakdown, ScoreCandidateInput } from "../types";

export function scoreCandidate(input: ScoreCandidateInput): ScoreBreakdown {
  const skillResults = calculateSkillMatch(input.job, input.resume);
  const experienceMatch = calculateExperienceMatch(input.job, input.resume);
  const keywordMatch = calculateKeywordMatch(input.job, input.resume);
  const roleAlignment = calculateRoleAlignment(input.job, input.resume);
  const requiredCoverage = input.job.requiredSkills.length
    ? skillResults.matchedRequired.length / input.job.requiredSkills.length
    : 1;

  let score = clampScore(
    0.45 * skillResults.skillMatch +
      0.2 * experienceMatch +
      0.15 * keywordMatch +
      0.2 * roleAlignment
  );

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
    missingSkills: skillResults.missingSkills,
    strengths,
  };
}
