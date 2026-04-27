export const INTERNAL_APPLY_SENTINEL_PREFIX = "internal://lxd-guild/jobs/";

export function buildInternalApplyValue(jobId?: string | null) {
  return `${INTERNAL_APPLY_SENTINEL_PREFIX}${jobId || "pending"}`;
}

export function isInternalApplyValue(applyUrl?: string | null) {
  return Boolean(applyUrl && applyUrl.startsWith(INTERNAL_APPLY_SENTINEL_PREFIX));
}

export function normalizeExternalApplyUrl(applyUrl?: string | null) {
  if (!applyUrl || isInternalApplyValue(applyUrl)) {
    return null;
  }

  return applyUrl;
}
