import { buildSharePreview, shareImageContentType, shareImageSize } from "@/lib/share-preview";

export const alt = "LXD Guild membership preview";
export const size = shareImageSize;
export const contentType = shareImageContentType;

export default function Image() {
  return buildSharePreview({
    eyebrow: "Membership",
    title: "Unlock premium L&D tools, resources, and growth support.",
    description:
      "Join the Guild for curated resources, member visibility, learning tools, and a sharper path through the marketplace.",
    accent: "gold",
  });
}
