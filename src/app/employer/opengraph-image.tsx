import { buildSharePreview, shareImageContentType, shareImageSize } from "@/lib/share-preview";

export const alt = "LXD Guild employer preview";
export const size = shareImageSize;
export const contentType = shareImageContentType;

export default function Image() {
  return buildSharePreview({
    eyebrow: "Employer flow",
    title: "Discover pre-vetted L&D talent and hire with stronger signals.",
    description:
      "Post jobs, review verified candidates, and move faster through a cleaner employer workflow built for modern L&D teams.",
    accent: "blue",
  });
}
