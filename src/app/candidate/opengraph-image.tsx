import { buildSharePreview, shareImageContentType, shareImageSize } from "@/lib/share-preview";

export const alt = "LXD Guild candidate preview";
export const size = shareImageSize;
export const contentType = shareImageContentType;

export default function Image() {
  return buildSharePreview({
    eyebrow: "Candidate flow",
    title: "Build your verified L&D profile and unlock stronger-fit roles.",
    description:
      "Use resume insights, skill validation, and guided growth tools to move from discovery to better opportunities.",
    accent: "green",
  });
}
