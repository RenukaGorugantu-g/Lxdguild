import { buildSharePreview, shareImageContentType, shareImageSize } from "@/lib/share-preview";

export const alt = "LXD Guild contact preview";
export const size = shareImageSize;
export const contentType = shareImageContentType;

export default function Image() {
  return buildSharePreview({
    eyebrow: "Contact",
    title: "Talk to the LXD Guild team.",
    description:
      "Reach out for employer pricing, hiring support, partnership details, or product help across the Guild ecosystem.",
    accent: "blue",
  });
}
