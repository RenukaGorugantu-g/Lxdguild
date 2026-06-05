export const CATEGORY_ALLOWLIST = [
  "Instructional Design",
  "eLearning",
  "Learning & Development",
  "Corporate Training",
  "Curriculum",
  "Learning Technology",
  "Training Specialist",
  "L&D Manager",
] as const;

export const TITLE_KEYWORDS = [
  "instructional",
  "elearning",
  "e-learning",
  "learning designer",
  "training",
  "curriculum",
  "l&d",
  "lxd",
] as const;

function normalizeText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9&+\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesAllowedCategory(value: string | null | undefined) {
  const normalized = normalizeText(value);
  return CATEGORY_ALLOWLIST.some((category) => normalizeText(category) === normalized);
}

export function matchesTitleKeyword(value: string | null | undefined) {
  const normalized = normalizeText(value);
  return TITLE_KEYWORDS.some((keyword) => normalized.includes(normalizeText(keyword)));
}

export function shouldImportMarketplaceJob(input: {
  title?: string | null;
  searchKeyword?: string | null;
}) {
  return matchesAllowedCategory(input.searchKeyword) && matchesTitleKeyword(input.title);
}
