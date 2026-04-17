import { createAdminClient } from "@/utils/supabase/admin";

type ResourceSeed = {
  category: string;
  title: string;
  fileLink: string;
  premiumOnly: boolean;
};

export const RESOURCE_CATALOG: ResourceSeed[] = [
  {
    category: "Free Resource",
    title: "The F-O-I-D Model",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/06/lxd-the-f-o-i-d-model.pdf",
    premiumOnly: false,
  },
  {
    category: "Free Resource",
    title: "Learning Frameworks Reference Guide",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/06/lxd-learning-frameworks-reference-guide.pdf",
    premiumOnly: false,
  },
  {
    category: "Free Resource",
    title: "Learning Technology Needs Assessment",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/06/Learning-Technology-Needs-Assessment.pdf",
    premiumOnly: false,
  },
  {
    category: "Free Resource",
    title: "Comparison of Learning on the Job Formats",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/06/Comparison-of-Learning-on-the-Job-Formats.pdf",
    premiumOnly: false,
  },
  {
    category: "Talent Strategy and Management",
    title: "How to Collaborate With Clients",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/06/how-to-collaborate-with-clients-job-aid-final.pdf",
    premiumOnly: true,
  },
  {
    category: "Talent Strategy and Management",
    title: "Sample Individual Development Plan",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/08/sample-individual-development-plan-final.docx-1.pdf",
    premiumOnly: true,
  },
  {
    category: "My Career",
    title: "Find Your Career Path",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/08/find-your-career-path.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "My Career",
    title: "Top Ten Tips to Prepare for a Job Interview",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/08/top-ten-tips-to-prepare-for-a-job-interview-templates-and-tools-final-1.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Training Delivery and Facilitation",
    title: "Icebreaker Success Questionnaire",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/icebreaker-success-questionnaire.pdf",
    premiumOnly: true,
  },
  {
    category: "Training Delivery and Facilitation",
    title: "5-Step Model for Structuring and Conducting Know-How Training",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/5-step-model-for-structuring-and-conducting-know-how-training-final.pdf",
    premiumOnly: true,
  },
  {
    category: "Training Delivery and Facilitation",
    title: "Techniques to Encourage Discussion",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/atd-techniques-to-encourage-discussion.pdf",
    premiumOnly: true,
  },
  {
    category: "Technology Application",
    title: "Sample Design Standards Checklist for Virtual Training",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Sample-Design-Standards-Checklist-for-Virtual-Training.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Technology Application",
    title: "Virtual Classroom Icebreakers",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Virtual-Classroom-Icebreakers.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Technology Application",
    title: "Accessibility Considerations for User Interface Design",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Accessibility-Considerations-for-User-Interface-UI-Design.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Managing the Learning Function",
    title: "Discussion Guides",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/discussion-guides-final.docx-1.pdf",
    premiumOnly: true,
  },
  {
    category: "Managing the Learning Function",
    title: "Starting a Talent Development Program Book Summary",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Starting-a-Talent-Development-Program-Book-Summary.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Instructional Design",
    title: "Thinking of Prototyping",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Thinking-of-Prototyping_.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Instructional Design",
    title: "The Six Steps of Needs Assessment",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/atd-the-six-steps-of-needs-assessment.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Instructional Design",
    title: "Instructional Design Models",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/instructional-design-models.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Career and Leadership Development",
    title: "Leadership Development Program Discussion Guide for Managers",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/leadership-development-program-discussion-guide-for-managers.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Career and Leadership Development",
    title: "Personal Development Action Plan",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/personal-development-action-plan-job-aid-final.docx-1.pdf",
    premiumOnly: true,
  },
  {
    category: "Sales Enablement",
    title: "Maximizing the Effectiveness of Sales Training",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/maximizing-the-effectiveness-of-sales-training-job-aid-final.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Sales Enablement",
    title: "Sales Coaching Process",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/sales-coaching-process-job-aid-final.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Organization Development and Culture",
    title: "Staff Engagement Survey",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/staff-engagement-survey-templates-and-tools-final.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Organization Development and Culture",
    title: "Positive Performance Checklist",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/positive-performance-checklist-job-aid-final.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Learning Sciences",
    title: "Learning Action Plan",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/learning-action-plan-template.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Learning Sciences",
    title: "Writing Better Learning Objectives",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/writing-better-learning-objectives-templates-and-tools-final.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Management Development",
    title: "Managing Up Meeting",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/managing-up-meeting-template.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Management Development",
    title: "Manager Onboarding Checklist",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/manager-onboarding-checklist-job-aid-final.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Cultural Awareness and Inclusion",
    title: "Workplace Inclusion Strategic Plan",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/workplace-inclusion-strategic-plan-template.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Cultural Awareness and Inclusion",
    title: "DEI Business Plan",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/dei-business-plan-template.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Communication & Evaluating Impact",
    title: "Persuasion Preparation Worksheet",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/persuasion-preparation-worksheet.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Communication & Evaluating Impact",
    title: "The 5 Whys Analysis",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/the-5-whys-analysis.pptx.pdf",
    premiumOnly: true,
  },
  {
    category: "Collaboration,Leadership & Business Insight",
    title: "Three Bold Steps",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Three-bold-steps.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Collaboration,Leadership & Business Insight",
    title: "Action List Template",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/action-list-template-final.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Coaching",
    title: "Sample Agenda for First Peer Coaching Session",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/sample-agenda-for-first-peer-coaching-session-templates-and-tools-final.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Coaching",
    title: "Coaching Plan for Business Impact",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/coaching-plan-for-business-impact-templates-and-tools-final.pptx-1.pdf",
    premiumOnly: true,
  },
  {
    category: "Performance Improvement",
    title: "Sample Individual Development Plan Final",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/sample-individual-development-plan-final.docx-2-1.pdf",
    premiumOnly: true,
  },
  {
    category: "Performance Improvement",
    title: "Mentoring Program Outline Planner",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Mentoring-Program-Outline_Planner.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Consulting and Business Partnering",
    title: "Learning Contract",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/learning-contract-final.docx.pdf",
    premiumOnly: true,
  },
  {
    category: "Consulting and Business Partnering",
    title: "Training Intake Request Form",
    fileLink: "https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/training-intake-request-form-job-aid-final.docx.pdf",
    premiumOnly: true,
  },
];

export function getResourceSlug(fileLink: string) {
  try {
    const pathname = new URL(fileLink).pathname;
    return pathname.split("/").filter(Boolean).pop() || fileLink;
  } catch {
    return fileLink.split("/").filter(Boolean).pop() || fileLink;
  }
}

export function getMemberResourceUrl(fileLink: string) {
  const slug = getResourceSlug(fileLink);
  return `https://lxdguild.com/members/resources/${slug}`;
}

export async function syncResourceCatalog() {
  const supabase = createAdminClient();
  if (!supabase) {
    return { synced: 0, skipped: true, reason: "Missing service role credentials." };
  }

  const { data: existing, count: existingCount } = await supabase
    .from("resources")
    .select("id, file_link", { count: "exact" })
    .limit(5);

  const shouldCleanDemoData =
    (existing || []).length > 0 && (existing || []).every((resource) => resource.file_link.includes("example.com"));

  if (shouldCleanDemoData) {
    await supabase.from("resources").delete().like("file_link", "%example.com%");
  }

  if ((existingCount || 0) > 0 && !shouldCleanDemoData) {
    return { synced: 0, skipped: true, reason: "Resources already managed in the database." };
  }

  const payload = RESOURCE_CATALOG.map((resource) => ({
    category: resource.category,
    title: resource.title,
    file_link: getMemberResourceUrl(resource.fileLink),
    source_file_link: resource.fileLink,
    premium_only: resource.premiumOnly,
  }));

  const { error } = await supabase.from("resources").upsert(payload, {
    onConflict: "file_link",
    ignoreDuplicates: false,
  });

  if (error) throw error;

  return {
    synced: payload.length,
    skipped: false,
    reason: existingCount ? "Catalog synchronized with upsert." : undefined,
  };
}
