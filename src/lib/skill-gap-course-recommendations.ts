import { COURSE_CATALOG } from "@/lib/assessment";

export type AcademyCourseRecommendation = {
  code: keyof typeof COURSE_CATALOG;
  title: string;
  description: string;
  url: string;
  recommendedFor: string[];
};

export type ExternalCourseNameSuggestion = {
  name: string;
  recommendedFor: string[];
};

const SKILL_TO_ACADEMY_COURSES: Partial<Record<string, Array<keyof typeof COURSE_CATALOG>>> = {
  "instructional design": ["C2", "C4"],
  storyboarding: ["C2", "C3"],
  "articulate 360": ["C3"],
  storyline: ["C3"],
  rise: ["C3"],
  vyond: ["C3"],
  camtasia: ["C3"],
  synthesia: ["C3"],
  elearning: ["C3", "C2"],
  "learning strategy": ["C2", "C4"],
  "learning design": ["C2", "C4"],
  "leadership development": ["C2", "C4"],
  facilitation: ["C2"],
  analytics: ["C1", "C4"],
  lms: ["C3"],
  reporting: ["C1", "C4"],
  onboarding: ["C2"],
  "curriculum design": ["C2", "C4"],
  microlearning: ["C2", "C3"],
  "project management": ["C4"],
  "program management": ["C4"],
  "needs analysis": ["C2", "C4"],
  xapi: ["C3"],
  scorm: ["C3"],
  evaluation: ["C1", "C4"],
  "workshop design": ["C2"],
  "training delivery": ["C2"],
  "content writing": ["C2", "C1"],
  "adult learning": ["C2"],
  "stakeholder management": ["C4"],
  "stakeholder communication": ["C4"],
  "performance consulting": ["C4"],
  ai: ["C1"],
  "ai in instructional design": ["C1"],
};

const SKILL_TO_EXTERNAL_COURSE_NAMES: Partial<Record<string, string[]>> = {
  "instructional design": ["Instructional Design Foundations", "Designing Learning Experiences"],
  storyboarding: ["Storyboarding for eLearning"],
  "articulate 360": ["Articulate Storyline 360 Advanced", "Rise 360 for Workplace Learning"],
  rise: ["Rise 360 for Workplace Learning"],
  "learning strategy": ["Learning Strategy for Business Impact"],
  facilitation: ["Virtual Facilitation Essentials", "Facilitation Skills for Trainers"],
  analytics: ["Learning Analytics Basics", "Measuring Training Impact"],
  lms: ["LMS Administration Essentials"],
  reporting: ["Data Storytelling for L&D"],
  onboarding: ["Designing High-Impact Onboarding Programs"],
  "curriculum design": ["Curriculum Architecture Workshop"],
  microlearning: ["Microlearning Design Lab"],
  xapi: ["xAPI for Learning Experience Designers"],
  scorm: ["SCORM Packaging Fundamentals"],
  evaluation: ["Kirkpatrick Evaluation in Practice"],
  "performance consulting": ["Performance Consulting Essentials"],
  ai: ["Prompting for Learning Designers"],
  "ai in instructional design": ["Prompting for Learning Designers"],
};

function uniq<T>(items: T[]) {
  return [...new Set(items)];
}

export function getAcademyCourseRecommendations(skills: string[]) {
  const normalizedSkills = uniq(skills.map((skill) => skill.toLowerCase().trim()).filter(Boolean));
  const courseMap = new Map<keyof typeof COURSE_CATALOG, Set<string>>();

  for (const skill of normalizedSkills) {
    const courseCodes = SKILL_TO_ACADEMY_COURSES[skill] || [];
    for (const courseCode of courseCodes) {
      if (!courseMap.has(courseCode)) {
        courseMap.set(courseCode, new Set());
      }
      courseMap.get(courseCode)?.add(skill);
    }
  }

  return [...courseMap.entries()]
    .map(([courseCode, matchedSkills]) => ({
      code: courseCode,
      title: COURSE_CATALOG[courseCode].title,
      description: COURSE_CATALOG[courseCode].description,
      url: COURSE_CATALOG[courseCode].externalLink,
      recommendedFor: [...matchedSkills],
      matchScore: matchedSkills.size,
    }))
    .sort((left, right) => right.matchScore - left.matchScore || left.title.localeCompare(right.title))
    .slice(0, 3)
    .map(({ matchScore: _matchScore, ...course }) => course);
}

export function getExternalCourseNameSuggestions(skills: string[]) {
  const normalizedSkills = uniq(skills.map((skill) => skill.toLowerCase().trim()).filter(Boolean));
  const suggestionMap = new Map<string, Set<string>>();

  for (const skill of normalizedSkills) {
    const suggestions = SKILL_TO_EXTERNAL_COURSE_NAMES[skill] || [];
    for (const suggestion of suggestions) {
      if (!suggestionMap.has(suggestion)) {
        suggestionMap.set(suggestion, new Set());
      }
      suggestionMap.get(suggestion)?.add(skill);
    }
  }

  return [...suggestionMap.entries()]
    .map(([name, matchedSkills]) => ({
      name,
      recommendedFor: [...matchedSkills],
      matchScore: matchedSkills.size,
    }))
    .sort((left, right) => right.matchScore - left.matchScore || left.name.localeCompare(right.name))
    .slice(0, 4)
    .map(({ matchScore: _matchScore, ...suggestion }) => suggestion);
}
