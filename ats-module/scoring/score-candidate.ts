import { summarizeResumeStrength } from "../parser/extract-signals";
import { calculateExperienceMatch, calculateKeywordMatch, calculateSkillMatch } from "./matchers";
import { clampScore } from "../utils/text";
import type { ScoreBreakdown, ScoreCandidateInput } from "../types";

export function scoreCandidate(input: ScoreCandidateInput): ScoreBreakdown {
  const skillResults = calculateSkillMatch(input.job, input.resume);
  const experienceMatch = calculateExperienceMatch(input.job, input.resume);
  const keywordMatch = calculateKeywordMatch(input.job, input.resume);

  const score = clampScore(
    0.5 * skillResults.skillMatch +
      0.3 * experienceMatch +
      0.2 * keywordMatch
  );

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
    missingSkills: skillResults.missingSkills,
    strengths,
  };
}
