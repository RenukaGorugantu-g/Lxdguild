import { buildSharePreview, shareImageContentType, shareImageSize } from "@/lib/share-preview";

export const alt = "LXD Guild jobs board preview";
export const size = shareImageSize;
export const contentType = shareImageContentType;

export default function Image() {
  return buildSharePreview({
    eyebrow: "Jobs board",
    title: "Browse verified L&D jobs across India.",
    description:
      "Discover instructional design, eLearning, facilitation, and learning experience roles curated for the LXD Guild marketplace.",
    accent: "blue",
  });
}
