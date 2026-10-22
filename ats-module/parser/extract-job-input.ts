import { extractKeywords, extractSkills } from "./extract-signals";
import type { JobInput } from "../types";

export function buildJobInput(title: string, description: string): JobInput {
  const plainDescription = description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const scoringText = `${title} ${plainDescription}`.trim();
  const allSkills = extractSkills(scoringText);
  const normalizedDescription = plainDescription.toLowerCase();
  const preferredHeading = /\b(preferred (?:skills|qualifications?)|nice to have|bonus skills|desired skills)\b/i.exec(
    normalizedDescription
  );
  const preferredText = preferredHeading
    ? normalizedDescription.slice(preferredHeading.index)
    : "";
  const nextSection = /\b(required qualifications|requirements|key responsibilities|responsibilities|what you'll do|what you will do|about the role|role overview|experience required)\b/i.exec(
    preferredText.slice(preferredHeading?.[0].length || 0)
  );
  const preferredSkills = preferredHeading
    ? extractSkills(
        nextSection
          ? preferredText.slice(0, preferredHeading[0].length + nextSection.index)
          : preferredText
      )
    : [];
  const requiredSkills = allSkills.filter((skill) => !preferredSkills.includes(skill));
  const experiencePatterns = [
    /(\d{1,2})\+?\s+years? of experience/gi,
    /minimum of\s+(\d{1,2})\+?\s+years?/gi,
    /at least\s+(\d{1,2})\+?\s+years?/gi,
    /(\d{1,2})\+?\s+years? experience/gi,
  ];
  const experienceValues = experiencePatterns.flatMap((pattern) =>
    [...plainDescription.matchAll(pattern)].map((match) => Number(match[1]))
  );

  return {
    title,
    description: plainDescription,
    requiredSkills,
    preferredSkills,
    minimumYearsOfExperience: experienceValues.length ? Math.max(...experienceValues) : 0,
    keywords: extractKeywords(scoringText, allSkills),
  };
}
