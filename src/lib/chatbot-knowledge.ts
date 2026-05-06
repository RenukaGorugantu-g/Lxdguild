export type ChatbotRole = "guest" | "candidate" | "employer" | "admin";

export type ChatbotFaq = {
  id: string;
  title: string;
  roles: ChatbotRole[];
  keywords: string[];
  answer: string;
  quickReplies?: string[];
};

export const CHATBOT_QUICK_PROMPTS = [
  "How do I unlock job applications?",
  "How does the ATS score work?",
  "How do I schedule an interview?",
  "How do I upload my certificate?",
];

export const CHATBOT_FAQS: ChatbotFaq[] = [
  {
    id: "unlock-applications",
    title: "Unlock job applications",
    roles: ["guest", "candidate"],
    keywords: ["unlock", "job applications", "apply", "assessment", "verified", "mvp"],
    answer:
      "Candidates can browse jobs first, but applying is tied to verification. Complete your assessment flow, keep your profile and resume updated, and once your candidate status is unlocked you can start applying inside the marketplace.",
    quickReplies: ["Where do I take the assessment?", "How does ATS scoring work?"],
  },
  {
    id: "assessment-location",
    title: "Take the assessment",
    roles: ["guest", "candidate"],
    keywords: ["assessment", "exam", "take test", "where assessment", "write assessment"],
    answer:
      "You can start the candidate assessment from the candidate dashboard. Once completed, your scorecard and recommended next steps will appear in the dashboard, and passing helps unlock stronger marketplace access.",
    quickReplies: ["How do I upload my certificate?", "How do I unlock job applications?"],
  },
  {
    id: "certificate-upload",
    title: "Upload certificate",
    roles: ["candidate"],
    keywords: ["certificate", "upload certificate", "reattempt", "retry exam", "proof"],
    answer:
      "If your scorecard asks for a learning-path completion before a retry, upload your certificate from the candidate dashboard. Once approved, your retry access can be restored.",
    quickReplies: ["How does the scorecard work?", "How do I improve my ATS score?"],
  },
  {
    id: "ats-score",
    title: "ATS scoring",
    roles: ["guest", "candidate", "employer"],
    keywords: ["ats", "score", "resume", "match", "job description", "skills match"],
    answer:
      "The ATS flow compares a resume against the job context using skills, experience, and keyword relevance. A stronger match generally means better alignment with the job description, but employers can still review candidates manually.",
    quickReplies: ["How do I improve my ATS score?", "Why was I put on hold?"],
  },
  {
    id: "ats-improve",
    title: "Improve ATS score",
    roles: ["candidate"],
    keywords: ["improve ats", "increase score", "better score", "resume improvement", "skill gap"],
    answer:
      "To improve ATS results, align your resume with the job description more directly: add relevant L&D skills, clarify outcomes, keep role titles clear, and use the profile skill suggestions and academy recommendations to close visible gaps.",
    quickReplies: ["How does the ATS score work?", "What courses are recommended?"],
  },
  {
    id: "employer-post-job",
    title: "Post a job",
    roles: ["employer", "admin"],
    keywords: ["post job", "create job", "add job", "employer posting"],
    answer:
      "Employers can post roles from the employer dashboard. Once a role is live, candidates can apply, ATS scoring can run against resumes, and applications will appear in the employer review flow.",
    quickReplies: ["How do I review applicants?", "How do I schedule an interview?"],
  },
  {
    id: "review-applicants",
    title: "Review applicants",
    roles: ["employer", "admin"],
    keywords: ["review applicants", "shortlist", "reject", "accept candidate", "applicant list"],
    answer:
      "Open the job inside the employer dashboard to review applicants. You can inspect profile details, ATS context, and then move candidates forward, reject them, or schedule interviews from the same flow.",
    quickReplies: ["How do I schedule an interview?", "What does the pipeline board mean?"],
  },
  {
    id: "schedule-interview",
    title: "Schedule interview",
    roles: ["employer", "admin", "candidate"],
    keywords: ["schedule interview", "interview round", "calendly", "google calendar", "meeting link"],
    answer:
      "Employers can schedule interview rounds directly from the applicant card. The flow supports direct meeting links, Calendly links, and Google Calendar draft links, and candidates receive both in-app updates and email notifications.",
    quickReplies: ["How do I review applicants?", "Will candidates get notified?"],
  },
  {
    id: "notifications",
    title: "Notifications",
    roles: ["candidate", "employer", "admin"],
    keywords: ["notification", "email", "mail", "in-app", "alert", "update"],
    answer:
      "Important hiring and workflow updates are designed to go through both email and in-app notifications. That includes applications, shortlist or rejection updates, and interview scheduling where the related flow is enabled.",
    quickReplies: ["How do I schedule an interview?", "How do I unlock job applications?"],
  },
  {
    id: "membership",
    title: "Membership",
    roles: ["guest", "candidate", "employer"],
    keywords: ["membership", "plan", "upgrade", "premium", "subscription"],
    answer:
      "Membership is the upgrade path for deeper Guild access. Depending on role, it can unlock premium resources, richer candidate visibility, or stronger employer-side hiring tools.",
    quickReplies: ["How do I unlock job applications?", "How do I post a job?"],
  },
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function getChatbotFactsForRole(role: ChatbotRole) {
  const commonFacts = [
    "LXD Guild is a skill-first marketplace for Learning and Development professionals and employers.",
    "Candidates can maintain profiles, resumes, assessments, applications, and ATS-related insights.",
    "Employers can post jobs, review applicants, track candidates, and schedule interviews where those flows are enabled.",
    "The chatbot should answer concisely, use only product-safe claims, and avoid inventing features that are not clearly described.",
  ];

  if (role === "candidate") {
    return [
      ...commonFacts,
      "Candidates can use resume-based skill suggestions and academy course recommendations inside profile workflows.",
      "Candidate updates may include ATS score visibility, application tracking, and interview notifications.",
    ];
  }

  if (role === "employer") {
    return [
      ...commonFacts,
      "Employers can manage jobs, applicants, ATS context, and interview scheduling from the dashboard.",
      "Applicant actions can include shortlist, rejection, and interview-round movement where the workflow is enabled.",
    ];
  }

  if (role === "admin") {
    return [
      ...commonFacts,
      "Admins may review operational flows, notifications, job posting activity, and candidate/employer support requests.",
    ];
  }

  return commonFacts;
}

export function matchChatbotFaq(query: string, role: ChatbotRole) {
  const normalizedQuery = normalizeText(query);
  const queryTokens = new Set(normalizedQuery.split(" ").filter(Boolean));

  let bestMatch: (ChatbotFaq & { score: number }) | null = null;

  for (const faq of CHATBOT_FAQS) {
    if (!faq.roles.includes(role) && !faq.roles.includes("guest")) {
      continue;
    }

    const keywordScore = faq.keywords.reduce((score, keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      if (normalizedQuery.includes(normalizedKeyword)) {
        return score + 3;
      }

      const parts = normalizedKeyword.split(" ");
      const partialHits = parts.filter((part) => queryTokens.has(part)).length;
      return score + partialHits;
    }, 0);

    if (keywordScore <= 0) {
      continue;
    }

    const candidate = { ...faq, score: keywordScore };
    if (!bestMatch || candidate.score > bestMatch.score) {
      bestMatch = candidate;
    }
  }

  if (!bestMatch || bestMatch.score < 3) {
    return null;
  }

  return bestMatch;
}
