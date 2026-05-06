import { extname } from "node:path";
import { extractTextFromDocxBuffer } from "./docx";
import { parseResumeText } from "./extract-signals";
import { extractTextFromPdfBuffer } from "./pdf";
import type { ParsedResume } from "../types";

export async function parseResumeFile({
  fileName,
  mimeType,
  buffer,
}: {
  fileName: string;
  mimeType?: string;
  buffer: Buffer;
}): Promise<ParsedResume> {
  const extension = extname(fileName).toLowerCase();
  const resolvedMimeType = mimeType || inferMimeType(extension);

  if (extension === ".pdf" || resolvedMimeType === "application/pdf") {
    const text = await extractTextFromPdfBuffer(buffer);
    return parseResumeText({ fileName, mimeType: resolvedMimeType, text });
  }

  if (
    extension === ".docx" ||
    resolvedMimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const text = await extractTextFromDocxBuffer(buffer);
    return parseResumeText({ fileName, mimeType: resolvedMimeType, text });
  }

  if (extension === ".txt" || resolvedMimeType === "text/plain") {
    const text = buffer.toString("utf8");
    return parseResumeText({ fileName, mimeType: resolvedMimeType, text });
  }

  throw new Error("Unsupported resume format. Use PDF, DOCX, or TXT.");
}

function inferMimeType(extension: string) {
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (extension === ".txt") return "text/plain";
  return "application/octet-stream";
}
