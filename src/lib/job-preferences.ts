const ROLE_LABELS = [
  "Instructional Designer",
  "Senior Instructional Designer",
  "Learning Experience Designer",
  "eLearning Developer",
  "Curriculum Developer",
  "Curriculum Designer",
  "Learning Designer",
  "L&D Specialist",
  "Learning and Development Specialist",
  "L&D Manager",
  "Learning Consultant",
  "Training Designer",
  "Training Specialist",
  "Enablement Designer",
  "Content Developer",
  "Assessment Designer",
];

export function deriveRoleKeyword(title: string | null | undefined) {
  const safeTitle = (title || "").toLowerCase();
  const matched = ROLE_LABELS.find((label) => safeTitle.includes(label.toLowerCase()));
  return matched || title || "L&D Roles";
}

export function tokenizeTitle(title: string | null | undefined) {
  return (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s&-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

export function scoreSimilarJob(
  sourceTitle: string | null | undefined,
  targetTitle: string | null | undefined,
  sameCompany: boolean
) {
  const sourceTokens = new Set(tokenizeTitle(sourceTitle));
  const targetTokens = tokenizeTitle(targetTitle);
  const overlap = targetTokens.reduce((count, token) => count + (sourceTokens.has(token) ? 1 : 0), 0);
  return overlap + (sameCompany ? 2 : 0);
}
