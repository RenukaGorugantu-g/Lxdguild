export function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function uniqueNormalized(values: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const normalized = normalizeText(value);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    output.push(value.trim());
  }

  return output;
}

export function normalizeList(values: string[]) {
  return uniqueNormalized(values).map((value) => value.trim());
}

export function splitCsvLike(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function collectWordTokens(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9\s+#.&/-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function percent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 100;
  }

  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
