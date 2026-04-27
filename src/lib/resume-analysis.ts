import { createAdminClient } from "@/utils/supabase/admin";

export type ResumeAnalysisResult = {
  score: number;
  summary: string;
  recommendations: string[];
  matched_keywords: string[];
  missing_keywords: string[];
  highlights: string[];
};

export type ResumeDownloadSource = {
  filePath?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
};

export function normalizeGoogleDriveDownloadUrl(url: string) {
  const match = url.match(/\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  if (!match?.[1]) return url;
  return `https://drive.google.com/uc?export=download&id=${match[1]}`;
}

export function deriveResumeStoragePath(fileUrl?: string | null) {
  if (!fileUrl) return null;

  const publicMarker = "/storage/v1/object/public/resumes/";
  const signMarker = "/storage/v1/object/sign/resumes/";

  if (fileUrl.includes(publicMarker)) {
    return decodeURIComponent(fileUrl.split(publicMarker)[1] || "").split("?")[0] || null;
  }

  if (fileUrl.includes(signMarker)) {
    return decodeURIComponent(fileUrl.split(signMarker)[1] || "").split("?")[0] || null;
  }

  return null;
}

export async function downloadResumeBuffer(source: ResumeDownloadSource) {
  const adminSupabase = createAdminClient();
  const resolvedPath = source.filePath || deriveResumeStoragePath(source.fileUrl);

  if (adminSupabase && resolvedPath) {
    const { data, error } = await adminSupabase.storage.from("resumes").download(resolvedPath);
    if (error) {
      throw new Error(`Resume download failed: ${error.message}`);
    }

    return {
      buffer: Buffer.from(await data.arrayBuffer()),
      fileName: source.fileName || resolvedPath.split("/").pop() || "resume",
      mimeType: source.mimeType || data.type || "application/octet-stream",
      sourcePath: resolvedPath,
    };
  }

  if (!source.fileUrl) {
    throw new Error("Resume file path or URL is required.");
  }

  const normalizedUrl = source.fileUrl.includes("drive.google.com")
    ? normalizeGoogleDriveDownloadUrl(source.fileUrl)
    : source.fileUrl;

  const response = await fetch(normalizedUrl);
  if (!response.ok) {
    throw new Error(`Resume fetch failed with status ${response.status}.`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    fileName: source.fileName || "resume",
    mimeType: source.mimeType || response.headers.get("content-type") || "application/octet-stream",
    sourcePath: resolvedPath,
  };
}

export async function scoreResumeWithMlService({
  buffer,
  fileName,
  mimeType,
  jobDescription,
  candidateSkills,
}: {
  buffer: Buffer;
  fileName: string;
  mimeType?: string | null;
  jobDescription?: string | null;
  candidateSkills?: string[] | null;
}): Promise<ResumeAnalysisResult> {
  const serviceUrl = process.env.RESUME_ML_SERVICE_URL;

  if (!serviceUrl) {
    throw new Error("RESUME_ML_SERVICE_URL is not configured.");
  }

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType || "application/octet-stream" });
  formData.append("file", blob, fileName);
  if (jobDescription) {
    formData.append("jd", jobDescription);
  }
  if (candidateSkills?.length) {
    formData.append("skills", candidateSkills.join(", "));
  }

  const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/score`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as Partial<ResumeAnalysisResult> & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Resume ML service failed.");
  }

  return {
    score: Number(payload.score || 0),
    summary: payload.summary || "Resume analysis completed.",
    recommendations: Array.isArray(payload.recommendations) ? payload.recommendations : [],
    matched_keywords: Array.isArray(payload.matched_keywords) ? payload.matched_keywords : [],
    missing_keywords: Array.isArray(payload.missing_keywords) ? payload.missing_keywords : [],
    highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
  };
}

export function decideApplicationStatus(score: number) {
  const shortlistThreshold = Number(process.env.ATS_AUTO_SHORTLIST_SCORE || "80");
  const rejectThreshold = Number(process.env.ATS_AUTO_REJECT_SCORE || "45");

  if (score >= shortlistThreshold) {
    return {
      applicationStatus: "shortlisted",
      autoDecision: "shortlisted",
      reason: `ATS score ${score} met the shortlist threshold of ${shortlistThreshold}.`,
    } as const;
  }

  if (score <= rejectThreshold) {
    return {
      applicationStatus: "rejected",
      autoDecision: "rejected",
      reason: `ATS score ${score} was below the reject threshold of ${rejectThreshold}.`,
    } as const;
  }

  return {
    applicationStatus: "applied",
    autoDecision: "manual_review",
    reason: `ATS score ${score} fell between auto-shortlist and auto-reject thresholds.`,
  } as const;
}
