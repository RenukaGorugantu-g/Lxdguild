import { buildSharePreview, shareImageContentType, shareImageSize } from "@/lib/share-preview";
import { getPublicJobById, parseJobIdFromSlug, stripJobHtml } from "@/lib/public-jobs";

export const alt = "LXD Guild job preview";
export const size = shareImageSize;
export const contentType = shareImageContentType;

type JobImageProps = {
  params: Promise<{ slug: string }>;
};

function clampText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trim()}...`;
}

export default async function Image({ params }: JobImageProps) {
  const { slug } = await params;
  const jobId = parseJobIdFromSlug(slug);
  const job = jobId ? await getPublicJobById(jobId) : null;

  if (!job) {
    return buildSharePreview({
      eyebrow: "Job opening",
      title: "Explore verified L&D opportunities on LXD Guild.",
      description:
        "Browse India-focused instructional design, eLearning, and learning team roles through the LXD Guild marketplace.",
      accent: "blue",
    });
  }

  const title = clampText(job.title || "L&D job opening", 58);
  const company = job.company?.trim() || "Verified employer";
  const location = job.location?.trim() || "India";
  const descriptionSource = stripJobHtml(job.description);
  const description = descriptionSource
    ? clampText(descriptionSource, 140)
    : `Apply for ${title} at ${company} on the LXD Guild marketplace.`;

  return buildSharePreview({
    eyebrow: "Live job",
    title,
    description: `${company} • ${location} • ${description}`,
    accent: "blue",
  });
}
