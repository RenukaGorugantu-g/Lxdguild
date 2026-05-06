import { KNOWN_SKILLS } from "../../ats-module/utils/constants";
import type { ParsedResume } from "../../ats-module/types";

type SkillSuggestionGroup = {
  name: string;
  triggers: string[];
  suggestions: string[];
};

const SKILL_SUGGESTION_GROUPS: SkillSuggestionGroup[] = [
  {
    name: "Authoring stack",
    triggers: ["instructional design", "storyboarding", "elearning"],
    suggestions: ["articulate 360", "rise", "captivate", "scorm", "xapi"],
  },
  {
    name: "Learning strategy",
    triggers: ["instructional design", "learning design", "curriculum design"],
    suggestions: ["learning strategy", "needs analysis", "evaluation", "adult learning"],
  },
  {
    name: "Facilitation and delivery",
    triggers: ["facilitation", "training delivery", "onboarding"],
    suggestions: ["facilitation", "workshop design", "training delivery", "leadership development"],
  },
  {
    name: "Operations and reporting",
    triggers: ["lms", "learning management system", "analytics", "reporting"],
    suggestions: ["lms", "analytics", "reporting", "project management", "program management"],
  },
  {
    name: "Stakeholder influence",
    triggers: ["stakeholder management", "stakeholder communication", "program management"],
    suggestions: ["stakeholder management", "stakeholder communication", "performance consulting"],
  },
];

export type ResumeSkillSuggestionResult = {
  detectedSkills: string[];
  recommendedSkills: string[];
  suggestionReasons: string[];
};

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function getResumeSkillSuggestions({
  parsedResume,
  existingProfileSkills,
}: {
  parsedResume: ParsedResume;
  existingProfileSkills?: string[] | null;
}): ResumeSkillSuggestionResult {
  const resumeSkills = new Set(parsedResume.skills.map((skill) => skill.toLowerCase()));
  const profileSkills = new Set((existingProfileSkills || []).map((skill) => skill.toLowerCase()));
  const combinedKnownSkills = new Set<string>([
    ...resumeSkills,
    ...profileSkills,
  ]);

  const detectedSkills = unique(parsedResume.skills);
  const recommendedSkills: string[] = [];
  const suggestionReasons: string[] = [];

  for (const group of SKILL_SUGGESTION_GROUPS) {
    const hasTrigger = group.triggers.some((trigger) => combinedKnownSkills.has(trigger));
    if (!hasTrigger) {
      continue;
    }

    const missingFromGroup = group.suggestions.filter((skill) => !combinedKnownSkills.has(skill));
    if (missingFromGroup.length === 0) {
      continue;
    }

    recommendedSkills.push(...missingFromGroup);
    const matchedTriggers = group.triggers.filter((trigger) => combinedKnownSkills.has(trigger));
    const previewSuggestions = missingFromGroup.slice(0, 2);
    suggestionReasons.push(
      `${group.name}: You already show ${matchedTriggers.join(", ")}. Next, build ${previewSuggestions.join(", ")}${
        missingFromGroup.length > previewSuggestions.length ? " and related skills" : ""
      }.`
    );
  }

  if (recommendedSkills.length < 5) {
    const supplementalSkills = KNOWN_SKILLS.filter((skill) => !combinedKnownSkills.has(skill)).slice(0, 5 - recommendedSkills.length);
    if (supplementalSkills.length > 0) {
      recommendedSkills.push(...supplementalSkills);
      suggestionReasons.push(
        `Profile strengtheners: Consider adding ${supplementalSkills.slice(0, 3).join(", ")}.`
      );
    }
  }

  return {
    detectedSkills,
    recommendedSkills: unique(recommendedSkills).slice(0, 8),
    suggestionReasons: unique(suggestionReasons).slice(0, 4),
  };
}
