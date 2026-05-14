import { buildSharePreview, shareImageContentType, shareImageSize } from "@/lib/share-preview";

export const alt = "LXD Guild marketplace preview";
export const size = shareImageSize;
export const contentType = shareImageContentType;

export default function Image() {
  return buildSharePreview({
    eyebrow: "Marketplace",
    title: "India's verified marketplace for L&D professionals.",
    description:
      "Validate your skills, unlock stronger-fit jobs, and grow with verified employer visibility, ATS insights, and premium resources.",
    accent: "green",
  });
}
