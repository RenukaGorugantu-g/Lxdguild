import { parseResumeText } from "../parser/extract-signals";
import { scoreCandidate } from "../scoring/score-candidate";
import type { ScoreCandidateJson, ScoreCandidateRequestBody } from "../types";

export async function scoreCandidateFromJson(body: ScoreCandidateRequestBody): Promise<ScoreCandidateJson> {
  if (!body.job) {
    throw new Error("Missing job payload.");
  }

  if (!body.resumeText?.trim()) {
    throw new Error("Missing resume text.");
  }

  const parsedResume = parseResumeText({
    fileName: body.resumeFileName || "resume.txt",
    mimeType: body.resumeMimeType || "text/plain",
    text: body.resumeText,
  });

  return scoreCandidate({
    job: body.job,
    resume: parsedResume,
  });
}

export async function postScoreCandidate(request: Request) {
  try {
    const body = (await request.json()) as ScoreCandidateRequestBody;
    const result = await scoreCandidateFromJson(body);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown ATS scoring error.",
      },
      { status: 400 }
    );
  }
}
