import { parseResumeFile } from "../parser/parse-resume-file";
import { scoreCandidate } from "../scoring/score-candidate";
import type { JobInput } from "../types";

export async function postScoreCandidateUpload(request: Request) {
  try {
    const formData = await request.formData();
    const jobRaw = formData.get("job");
    const resumeFile = formData.get("resume");

    if (typeof jobRaw !== "string") {
      throw new Error("Missing job JSON.");
    }

    if (!(resumeFile instanceof File)) {
      throw new Error("Missing resume file.");
    }

    const job = JSON.parse(jobRaw) as JobInput;
    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    const parsedResume = await parseResumeFile({
      fileName: resumeFile.name,
      mimeType: resumeFile.type,
      buffer,
    });

    return Response.json(
      scoreCandidate({
        job,
        resume: parsedResume,
      }),
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown ATS scoring error.",
      },
      { status: 400 }
    );
  }
}
