import type { PublicJobRecord } from "@/lib/public-jobs";

export const MIN_INDEXABLE_LANDING_JOBS = 3;

export const JOB_ROLE_LANDINGS = [
  {
    slug: "instructional-designer",
    role: "Instructional Designer",
    title: "Instructional Designer Jobs in India",
    description:
      "Explore current instructional designer jobs in India, including learning design, course development, and performance-focused L&D roles.",
    aliases: ["instructional designer", "instructional design"],
  },
  {
    slug: "elearning-developer",
    role: "eLearning Developer",
    title: "eLearning Developer Jobs in India",
    description:
      "Find eLearning developer jobs in India working on digital courses, interactive learning, and modern learning platforms.",
    aliases: ["elearning developer", "e-learning developer", "elearning designer", "e-learning designer"],
  },
  {
    slug: "learning-experience-designer",
    role: "Learning Experience Designer",
    title: "Learning Experience Designer Jobs in India",
    description:
      "Browse Learning Experience Designer opportunities focused on learner-centered digital learning and L&D experiences.",
    aliases: ["learning experience designer", "learning experience design"],
  },
  {
    slug: "learning-designer",
    role: "Learning Designer",
    title: "Learning Designer Jobs in India",
    description:
      "Explore learning designer openings across instructional design, curriculum development, and workplace learning.",
    aliases: ["learning designer"],
  },
  {
    slug: "corporate-trainer",
    role: "Corporate Trainer",
    title: "Corporate Trainer Jobs in India",
    description:
      "Find corporate trainer roles in India across training delivery, facilitation, onboarding, and employee development.",
    aliases: ["corporate trainer", "training facilitator"],
  },
  {
    slug: "ld-manager",
    role: "L&D Manager",
    title: "L&D Manager Jobs in India",
    description:
      "Browse Learning and Development manager opportunities in talent development, learning strategy, and team leadership.",
    aliases: ["l&d manager", "learning and development manager", "learning & development manager"],
  },
  {
    slug: "curriculum-developer",
    role: "Curriculum Developer",
    title: "Curriculum Developer Jobs in India",
    description:
      "Explore curriculum developer jobs involving learning pathways, instructional content, and structured course design.",
    aliases: ["curriculum developer", "curriculum designer"],
  },
  {
    slug: "lms-administrator",
    role: "LMS Administrator",
    title: "LMS Administrator Jobs in India",
    description:
      "Find learning management system administrator roles in platform operations, reporting, and learning technology.",
    aliases: ["lms administrator", "learning management system administrator"],
  },
  {
    slug: "learning-technology",
    role: "Learning Technology",
    title: "Learning Technology Jobs in India",
    description:
      "Explore learning technology opportunities involving learning platforms, digital learning systems, and L&D technology.",
    aliases: ["learning technology", "learning technologist"],
  },
  {
    slug: "remote-ld",
    role: "Remote L&D",
    title: "Remote L&D Jobs",
    description:
      "Find remote learning and development opportunities, including instructional design and eLearning roles open to distributed teams.",
    aliases: [],
  },
] as const;

export type JobRoleLanding = (typeof JOB_ROLE_LANDINGS)[number];

export const JOB_LOCATION_LANDINGS = [
  { slug: "hyderabad", name: "Hyderabad", aliases: ["hyderabad"] },
  { slug: "bangalore", name: "Bengaluru", aliases: ["bengaluru", "bangalore"] },
  { slug: "pune", name: "Pune", aliases: ["pune"] },
  { slug: "mumbai", name: "Mumbai", aliases: ["mumbai"] },
  { slug: "delhi", name: "Delhi", aliases: ["delhi", "new delhi"] },
] as const;

export function getJobRoleLanding(slug: string) {
  return JOB_ROLE_LANDINGS.find((landing) => landing.slug === slug) || null;
}

export function getJobsForRoleLanding(jobs: PublicJobRecord[], landing: JobRoleLanding) {
  return jobs.filter((job) => {
    if (landing.slug === "remote-ld") {
      const remoteText = `${job.work_mode || ""} ${job.location || ""} ${job.title}`.toLowerCase();
      return job.work_mode?.toLowerCase() === "remote" || /\bremote\b|\bwork from home\b|\bwfh\b/.test(remoteText);
    }
    const title = job.title.toLowerCase();
    return landing.aliases.some((alias) => title.includes(alias));
  });
}

export function getJobsForRoleLocation(
  jobs: PublicJobRecord[],
  landing: JobRoleLanding,
  locationSlug: string
) {
  const location = JOB_LOCATION_LANDINGS.find((item) => item.slug === locationSlug);
  if (!location) return [];
  return getJobsForRoleLanding(jobs, landing).filter((job) => {
    const jobLocation = (job.location || "").toLowerCase();
    return location.aliases.some((alias) => jobLocation.includes(alias));
  });
}
