import { getSiteUrl } from "./site-url";

const BRAND_LOGO_URL =
  "https://cdn.jsdelivr.net/gh/RenukaGorugantu-g/Lxdguild@main/public/lxd-guild-email-logo.png";
const ACADEMY_URL = "https://lxdguildacademy.com";
const LXDVERSE_URL = "https://lxdguild.com";
const CONTACT_EMAIL = "mailto:lxdguild@gmail.com";

const EMAIL_SOCIAL_LINKS = [
  {
    name: "LinkedIn",
    href: "https://in.linkedin.com/company/lxd-guild",
    icon: "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-white/linkedin@2x.png",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@lxdguild",
    icon: "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-white/youtube@2x.png",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/lxd_guild/",
    icon: "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-white/instagram@2x.png",
  },
  {
    name: "X",
    href: "https://x.com/GuildLxd20077",
    icon: "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-white/twitter@2x.png",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/100648556092707/",
    icon: "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-white/facebook@2x.png",
  },
] as const;

type NotificationAudience = "user" | "admin";

type NotificationTemplateInput = {
  audience: NotificationAudience;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

type NotificationTemplate = {
  html: string;
  text: string;
};

type EmailCta = {
  label: string;
  href: string;
};

type EmailTheme = {
  eyebrow: string;
  accent: string;
  accentSoft: string;
  panel: string;
  headerStart: string;
  headerEnd: string;
  border: string;
  textMuted: string;
};

type TemplateSection = {
  label: string;
  value: string;
};

type TemplateContent = {
  preheader: string;
  heading: string;
  intro: string;
  kicker?: string | null;
  heroNote?: string | null;
  layoutVariant?: "editorial" | "celebration" | "urgent" | "support";
  status?: string | null;
  summary?: string | null;
  checklist?: string[];
  details: TemplateSection[];
  cta: EmailCta | null;
  footer: string;
  theme: EmailTheme;
  spotlight?: Array<{ icon: string; title: string; copy: string }>;
  resources?: Array<{ title: string; copy: string; href?: string | null }>;
};

export function buildNotificationEmail({
  audience,
  type,
  title,
  message,
  data = {},
}: NotificationTemplateInput): NotificationTemplate {
  const normalizedData = normalizeData(data);
  const content = buildContent({
    audience,
    type,
    title,
    message,
    data: normalizedData,
  });

  return {
    html: renderEmailHtml(content),
    text: renderText(content),
  };
}

function buildContent({
  audience,
  type,
  title,
  message,
  data,
}: {
  audience: NotificationAudience;
  type: string;
  title: string;
  message: string;
  data: Record<string, string>;
}): TemplateContent {
  const theme = getTheme(audience, type);
  const footer =
    audience === "admin"
      ? "You are receiving this because this inbox is configured for LXD Guild admin operations."
      : "You are receiving this because of activity tied to your LXD Guild account.";

  const defaults: TemplateContent = {
    preheader: message,
    heading: title,
    intro: message,
    kicker: theme.eyebrow,
    heroNote: null,
    layoutVariant: "editorial",
    status: data.status ? beautifyStatus(data.status) : null,
    summary: null,
    checklist: [],
    details: buildDetailRows(type, data, audience),
    cta: getPrimaryCta(type, data, audience),
    footer,
    theme,
    spotlight: [],
    resources: [],
  };

  switch (type) {
    case "user_registered":
      return {
        ...defaults,
        preheader: "Your LXD Guild account is ready.",
        heading: "Welcome to LXD Guild",
        kicker: "Your journey starts here",
        heroNote: "Build your profile. Prove your skills. Unlock sharper opportunities.",
        layoutVariant: "celebration",
        intro: `Your ${beautifyRole(data.role || "member")} account has been created successfully. We now have the information needed to guide your learning and hiring journey.`,
        summary:
          audience === "admin"
            ? `A new ${beautifyRole(data.role || "member")} account has been created.`
            : "You can now continue into your dashboard and complete the next steps for your profile.",
        checklist:
          audience === "user"
            ? [
                "Open your dashboard and complete the missing profile details.",
                "If you are a candidate, keep your target role and assessment track up to date.",
                "If you are an employer, start by polishing your company profile and posting your first role.",
              ]
            : [],
        spotlight:
          audience === "user" && (data.role || "").startsWith("candidate")
            ? [
                {
                  icon: "CV",
                  title: "Assessment-first visibility",
                  copy: "Your Guild assessment helps us map you to stronger-fit L&D opportunities and a sharper professional learning path.",
                },
                {
                  icon: "PRO",
                  title: "Membership unlocks more",
                  copy: "Explore membership to access premium resources, learning support, and deeper Guild tools once you are ready.",
                },
              ]
            : audience === "user"
              ? [
                  {
                    icon: "POST",
                    title: "Post faster",
                    copy: "Publish a role, review applicants, and track every hiring touchpoint inside one workflow.",
                  },
                  {
                    icon: "VIP",
                    title: "Need MVP talent?",
                    copy: "If you want verified MVP candidates and richer hiring support, reach out and we will guide you through the right plan.",
                  },
                ]
              : [],
        resources:
          audience === "user" && (data.role || "").startsWith("candidate")
            ? [
                {
                  title: "Start your assessment",
                  copy: "Use the dashboard to begin the validation journey that unlocks your recommendation path and candidate visibility.",
                  href: `${getSiteUrl()}/dashboard/candidate/exam`,
                },
                {
                  title: "Explore membership",
                  copy: "Membership opens the deeper Guild experience beyond the core candidate flow.",
                  href: `${getSiteUrl()}/membership`,
                },
              ]
            : audience === "user"
              ? [
                  {
                    title: "Post your first role",
                    copy: "Create a job listing and start attracting Guild candidates immediately.",
                    href: `${getSiteUrl()}/dashboard/employer/post-job`,
                  },
                  {
                    title: "Talk to us about MVP hiring",
                    copy: "Need premium candidate access or tailored hiring help? Our team can help you set that up.",
                    href: `${getSiteUrl()}/contact`,
                  },
                ]
              : [],
      };

    case "email_verification_reminder":
      return {
        ...defaults,
        preheader: "Verify your email to see your matched L&D jobs.",
        heading: "You're almost in",
        kicker: "One quick step left",
        heroNote: "Your free applications are ready. Email verification is the last unlock.",
        layoutVariant: "support",
        intro: `Verify ${data.email || "your email address"} to open your LXD Guild dashboard and start exploring matched learning and development roles right away.`,
        status: "Verification pending",
        summary:
          "You already have free application access waiting for you. Open the verification page, resend the email if needed, and check your spam folder if the first message is missing.",
        checklist: [
          "Open the verification page.",
          "Tap resend if you do not see the first message.",
          "Check spam, promotions, or updates folders.",
        ],
        spotlight: [
          {
            icon: "JOB",
            title: "Matched roles are waiting",
            copy: "As soon as you verify, we can take you straight into the dashboard experience with your first job matches ready to browse.",
          },
          {
            icon: "FREE",
            title: "Start before assessment",
            copy: "You can use your free job applications first, then choose verification later to unlock stronger visibility and premium roles.",
          },
        ],
        resources: [
          {
            title: "Need another email?",
            copy: "Open the verification page to resend the confirmation message to the same inbox.",
            href: data.verify_page_url || `${getSiteUrl()}/verify-email`,
          },
        ],
      };

    case "exam_result":
      return {
        ...defaults,
        preheader: data.pass_status === "pass" ? "You passed your LXD Guild assessment." : "Your LXD Guild assessment result is ready.",
        heading: data.pass_status === "pass" ? "Assessment Passed" : "Assessment Result Ready",
        kicker: data.pass_status === "pass" ? "You unlocked a new stage" : "Your scorecard is ready",
        heroNote:
          data.pass_status === "pass"
            ? "This result increases your trust signal across the Guild ecosystem."
            : "This is not a dead end. It is your clearest map for what to strengthen next.",
        layoutVariant: data.pass_status === "pass" ? "celebration" : "support",
        intro:
          data.pass_status === "pass"
            ? `You scored ${data.score || "0"}% and unlocked MVP candidate status for the ${data.designation_bucket || "selected"} track.`
            : `You scored ${data.score || "0"}% on the ${data.designation_bucket || "selected"} track. Your scorecard and recommended learning path are ready for review.`,
        status: data.pass_status === "pass" ? "Passed" : "Needs reattempt",
        summary:
          data.pass_status === "pass"
            ? "You can now move ahead with verified candidate access and begin applying to matching roles."
            : "Use the scorecard to see which skills need work, complete the recommended course path, and return with your certificate when you are ready.",
        checklist:
          data.pass_status === "pass"
            ? ["Open your scorecard to review your breakdown.", "Browse matching jobs from the candidate dashboard."]
            : ["Review your scorecard.", "Complete the suggested course path.", "Submit your course certificate to unlock your reattempt."],
        spotlight:
          data.pass_status === "pass"
            ? [
                {
                  icon: "MVP",
                  title: "You are now visible",
                  copy: "Your verified status helps you appear with stronger trust signals across the Guild experience.",
                },
              ]
            : [
                {
                  icon: "NEXT",
                  title: "What to strengthen next",
                  copy: data.recommendation_rationale || "Your score suggests focused work on core L&D capability before the next attempt.",
                },
              ],
        resources: compactResources([
          buildResource(data.recommended_course_1_title, data.recommended_course_1_link, "Recommended learning path"),
          buildResource(data.recommended_course_2_title, data.recommended_course_2_link, "Continue building capability"),
          buildResource(data.recommended_course_3_title, data.recommended_course_3_link, "Optional next step"),
        ]),
      };

    case "job_posted":
      return {
        ...defaults,
        preheader: "Your job posting is now live.",
        heading: audience === "admin" ? "New Job Posted" : "Job Posted Successfully",
        intro:
          audience === "admin"
            ? `${data.title || "A new role"} at ${data.company || "an employer"} was published on LXD Guild.`
            : `${data.title || "Your role"} at ${data.company || "your company"} is now live on LXD Guild.`,
        summary:
          audience === "admin"
            ? "You can review the posting if needed, but it is already available to candidates."
            : "Candidates can now discover the role, apply, and trigger employer-side applicant notifications.",
        checklist:
          audience === "user"
            ? ["Open the job page to review the live listing.", "Watch for applicant notifications in your dashboard and inbox."]
            : [],
        spotlight:
          audience === "user"
            ? [
                {
                  icon: "ATS",
                  title: "Applicant tracking included",
                  copy: "Every candidate application now flows into your employer view with ATS context and status actions.",
                },
              ]
            : [],
      };

    case "job_application":
      const isVerifiedCandidate = data.candidate_role === "candidate_mvp";
      const isCandidateOnHold = data.candidate_role === "candidate_onhold";
      const matchedJobResources = getMatchedJobResources(data);
      const roleSpecificChecklist = isCandidateOnHold
        ? [
            "Take your assessment to unlock stronger employer visibility and more complete access.",
            "Explore Guild membership for deeper hiring support and premium opportunities.",
            "Use Academy courses to sharpen the exact skills employers want to see next.",
          ]
        : [
            "Watch your applications dashboard for shortlist or rejection updates.",
            "Keep your resume, headline, and portfolio links current.",
            "Be ready for a recruiter follow-up if the employer moves fast.",
          ];
      const roleSpecificSpotlight = isCandidateOnHold
        ? [
            {
              icon: "TEST",
              title: "Assessment unlock",
              copy: "Completing your assessment helps us position you for stronger-fit roles and gives employers more confidence in your profile.",
            },
            {
              icon: "PLUS",
              title: "Membership and courses",
              copy: "Membership and Academy learning paths keep you progressing instead of waiting passively for one application outcome.",
            },
          ]
        : [
            {
              icon: "LIVE",
              title: "You are in the review flow",
              copy: "Your profile, resume, and match context are now available to the employer inside the LXD Guild hiring workflow.",
            },
            ...(isVerifiedCandidate
              ? [
                  {
                    icon: "MATCH",
                    title: "More roles for your profile",
                    copy: "Because you are verified, we can keep surfacing stronger-fit roles that align with your target designation while this application moves.",
                  },
                ]
              : []),
          ];
      const roleSpecificResources = isCandidateOnHold
        ? [
            {
              title: "Take your assessment",
              copy: "Move beyond candidate-on-hold status and unlock stronger role access.",
              href: data.assessment_url || `${getSiteUrl()}/dashboard/candidate/exam`,
            },
            {
              title: "Explore membership",
              copy: "Membership helps you stay visible, supported, and ready for premium-fit opportunities.",
              href: data.membership_url || `${getSiteUrl()}/membership`,
            },
            {
              title: "Browse Academy courses",
              copy: "Build the exact skills employers look for while you continue applying.",
              href: data.academy_courses_url || ACADEMY_URL,
            },
          ]
        : isVerifiedCandidate
          ? [
              {
                title: "Track this application",
                copy: "Open your applications dashboard to follow every employer update.",
                href: `${getSiteUrl()}/dashboard/candidate/applications`,
              },
              ...matchedJobResources,
            ]
          : [
              {
                title: "Track this application",
                copy: "Open your applications dashboard to follow every employer update.",
                href: `${getSiteUrl()}/dashboard/candidate/applications`,
              },
            ];
      return {
        ...defaults,
        preheader:
          data.application_mode === "external"
            ? "Finish your application on the employer site."
            : isCandidateOnHold
              ? "Your application is in motion and your next growth step is ready."
              : "Your application is now with the employer.",
        heading:
          data.application_mode === "external"
            ? "Finish Your Application"
            : "Application Submitted",
        kicker:
          data.application_mode === "external"
            ? "One more step to complete"
            : isCandidateOnHold
              ? "Keep building your edge"
              : "You are officially in motion",
        heroNote:
          data.application_mode === "external"
            ? "The employer still needs the final submission on their own site."
            : isCandidateOnHold
              ? "Use this momentum to complete your assessment, unlock stronger visibility, and open more premium-fit roles."
              : "Your profile is now visible to the hiring team in their review flow.",
        layoutVariant: data.application_mode === "external" ? "urgent" : "celebration",
        intro:
          data.application_mode === "external"
            ? `You started your application for ${data.title || "the role"} at ${data.company || "the employer"}. Complete the final step on the employer's page so your application goes through fully.`
            : `Your application for ${data.title || "the role"} at ${data.company || "the employer"} is now inside the employer review queue on LXD Guild.`,
        summary:
          data.application_mode === "external"
            ? "We saved your application intent in LXD Guild so you can return and track your progress, but you still need to finish the employer form."
            : isCandidateOnHold
              ? `You are officially in the employer's pipeline. While they review this application, we want to help you unlock more opportunities${data.free_access_remaining ? ` and make the most of your remaining ${data.free_access_remaining} free applications` : ""}.`
              : isVerifiedCandidate
                ? "You are officially in the employer's pipeline. We also pulled a few more roles that fit your verified profile so you can keep your momentum high."
                : "You are officially in the employer's pipeline. Keep your profile polished while they review your fit.",
        checklist:
          data.application_mode === "external"
            ? [
                "Open the employer application and complete every required field.",
                "Use the same resume and contact details for consistency.",
                "Return to LXD Guild later to track updates and next steps.",
                ...roleSpecificChecklist,
              ]
            : roleSpecificChecklist,
        spotlight:
          data.application_mode === "external"
            ? [
                {
                  icon: "01",
                  title: "Important",
                  copy: "This role finishes on the employer's own site. Until that final form is submitted, the application may remain incomplete.",
                },
                ...roleSpecificSpotlight,
              ]
            : roleSpecificSpotlight,
        resources:
          data.application_mode === "external"
            ? [
                {
                  title: "Review the role once more",
                  copy: "Double-check the job context before completing the employer's page.",
                  href: data.job_url || `${getSiteUrl()}/dashboard/jobs`,
                },
                ...roleSpecificResources,
              ]
            : roleSpecificResources,
      };

    case "job_application_received":
      return {
        ...defaults,
        preheader: "A new candidate has applied to your job.",
        heading: "New Candidate Application",
        kicker: "Fresh candidate interest",
        heroNote: "Review fast while intent is high and momentum is still on your side.",
        intro: `${data.candidate_name || data.candidate_email || "A candidate"} has applied for ${data.title || "your role"} at ${data.company || "your company"}.`,
        summary: "Open the applicants view to review their resume, ATS fit, and decide whether to accept or reject the application.",
        checklist: ["Open the job's applicant list.", "Review the candidate profile and ATS notes.", "Record the next step so the candidate gets an update email immediately."],
        spotlight: [
          {
            icon: "FLOW",
            title: "Designed for employer flow",
            copy: "You can move from application to accept or reject without losing the trail of notifications or status changes.",
          },
        ],
      };

    case "job_application_reviewed": {
      const matchedResources = getMatchedJobResources(data);
      return {
        ...defaults,
        preheader:
          data.status === "shortlisted"
            ? "You moved to the next hiring step."
            : data.status === "on_hold"
              ? "Your application is still in consideration."
              : "Your job application has been updated.",
        heading:
          data.status === "shortlisted"
            ? "You Moved Forward"
            : data.status === "on_hold"
              ? "Still In Consideration"
              : "Application Update",
        kicker:
          data.status === "shortlisted"
            ? "Momentum is building"
            : data.status === "on_hold"
              ? "Stay visible for the next fit"
              : "Keep your momentum anyway",
        heroNote:
          data.status === "shortlisted"
            ? "This employer wants to continue the conversation with you."
            : data.status === "on_hold"
              ? "This role is paused for now, but your profile can still be matched to stronger-fit openings across the Guild."
              : "One no should not interrupt your larger opportunity path.",
        layoutVariant: data.status === "shortlisted" ? "celebration" : "support",
        intro:
          data.status === "shortlisted"
            ? `Your application for ${data.title || "the role"} at ${data.company || "the company"} has been accepted for the next hiring step.`
            : data.status === "on_hold"
              ? `Your application for ${data.title || "the role"} at ${data.company || "the company"} is on hold while the hiring team looks for a different fit for this position right now.`
              : `Your application for ${data.title || "the role"} at ${data.company || "the company"} was not selected for the next stage.`,
        status:
          data.status === "shortlisted"
            ? "Accepted for next stage"
            : data.status === "on_hold"
              ? "On hold"
              : "Not selected",
        summary:
          data.status === "shortlisted"
            ? "Keep an eye on your inbox and dashboard for the employer's follow-up."
            : data.status === "on_hold"
              ? `We are still working to keep you engaged with better-fit opportunities${data.target_role ? ` for ${data.target_role}` : ""}. Keep your profile current and explore the matched roles below while this position stays paused.`
              : "Your profile remains active for future opportunities, and you can continue exploring similar jobs from the dashboard.",
        checklist:
          data.status === "on_hold"
            ? [
                "Open your candidate dashboard and review the latest matched jobs.",
                "Refresh your profile headline, resume, and portfolio so employers see your strongest fit.",
                "Watch your inbox for new Guild updates and better-matched openings.",
              ]
            : defaults.checklist,
        resources:
          data.status === "shortlisted"
            ? [
                {
                  title: "Review the role again",
                  copy: "Refresh yourself on the job context and keep your profile polished for the next conversation.",
                  href: data.job_url || `${getSiteUrl()}/dashboard/jobs`,
                },
              ]
            : data.status === "on_hold"
              ? matchedResources
              : [],
      };
    }

    case "certificate_uploaded":
      return {
        ...defaults,
        preheader: data.status === "approved" ? "Your certificate was verified." : "Your certificate is under review.",
        heading: data.status === "approved" ? "Certificate Approved" : "Certificate Submitted",
        kicker: data.status === "approved" ? "Access restored" : "We received your proof",
        heroNote:
          data.status === "approved"
            ? "You can now return to your validation journey with the next gate unlocked."
            : "Our team or validation flow is now checking the details you submitted.",
        layoutVariant: data.status === "approved" ? "celebration" : "support",
        intro:
          data.status === "approved"
            ? "Your certificate has been verified successfully."
            : "Your certificate has been received and is waiting for review or fallback validation.",
        status: data.status ? beautifyStatus(data.status) : null,
        summary:
          data.status === "approved"
            ? "Your reattempt access is now unlocked."
            : data.validation_notes || "If the certificate code could not be matched, the upload stays pending until reviewed.",
        checklist:
          data.status === "approved"
            ? ["Open your candidate dashboard.", "Start your reattempt when you are ready."]
            : ["Wait for review if the code or document could not be validated automatically."],
      };

    case "certificate_reviewed":
      return {
        ...defaults,
        preheader: `Your certificate was ${beautifyStatus(data.status || "reviewed")}.`,
        heading: data.status === "approved" ? "Certificate Approved" : "Certificate Review Complete",
        kicker: data.status === "approved" ? "You can move ahead now" : "Your review is complete",
        heroNote:
          data.status === "approved"
            ? "Your candidate journey is open again."
            : "Check the notes below and take the next best step.",
        layoutVariant: data.status === "approved" ? "celebration" : "support",
        intro:
          data.status === "approved"
            ? "Your certificate was approved and your candidate reattempt is now unlocked."
            : "Your certificate review is complete.",
        summary:
          data.status === "approved"
            ? "Return to the candidate dashboard to continue your learning and assessment path."
            : "If you need help correcting or resubmitting your certificate, contact the LXD Guild team.",
      };

    case "job_delete_approved":
    case "job_delete_rejected":
      return {
        ...defaults,
        preheader: type === "job_delete_approved" ? "Your job deletion request was approved." : "Your job deletion request was reviewed.",
        heading: type === "job_delete_approved" ? "Job Removed" : "Job Kept Live",
        intro: message,
        summary:
          type === "job_delete_approved"
            ? "The role is no longer visible on the live board."
            : "The role remains active and visible to candidates.",
      };

    case "contact_submission":
      return {
        ...defaults,
        preheader: "We received your message.",
        heading: "Message Received",
        kicker: "We will get back to you soon",
        heroNote: "Your note is now with the LXD Guild team.",
        layoutVariant: "celebration",
        intro: `Thanks for reaching out. We received your message about ${data.subject || "your request"} and will reply as soon as possible.`,
        summary: "We have saved your message details below so you have a clear record of what was submitted.",
        checklist: [
          "Watch your inbox for our reply.",
          "If your request is urgent, you can also reach us directly at lxdguild@gmail.com.",
        ],
      };

    case "contact_submission_admin":
      return {
        ...defaults,
        preheader: "A new contact request has arrived.",
        heading: "New Contact Request",
        kicker: "Inbox update",
        heroNote: "A website visitor has submitted the contact form and is waiting for a response.",
        layoutVariant: "editorial",
        intro: `${data.name || "A visitor"} sent a new contact request regarding ${data.subject || "a general enquiry"}.`,
        summary: "Review the enquiry details below and reply to the sender from the admin inbox.",
        checklist: [
          "Review the message details.",
          "Reply to the sender at the email provided below.",
        ],
      };

    default:
      return defaults;
  }
}

function renderEmailHtml(content: TemplateContent) {
  const heroTitleTone = "#f8fafc";
  const heroBodyTone = "#dbe7f3";
  const heroKickerText = "#f8fafc";
  const heroKickerBg = "#18462d";
  const heroKickerBorder = "#2f7b47";
  const heroNoteBg = "#1f2937";
  const heroNoteBorder = "#31475f";
  const heroSurfaceStart = "#0f172a";
  const heroSurfaceEnd = "#10301e";

  const ctaBg = "linear-gradient(180deg,#33d61f 0%,#25bb1c 100%)";
  const ctaTextColor = "#ffffff";

  const leadCardHtml = content.summary
    ? `<table class="email-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:separate;border-spacing:0;background:#f8f3ec;border:1px solid ${content.theme.border};border-radius:24px;box-shadow:0 12px 26px rgba(15,23,42,0.05);">
        <tr>
          <td style="padding:22px 24px;border-left:4px solid ${content.theme.accent};">
            <div style="font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${content.theme.accent};">What matters now</div>
            <div style="margin-top:10px;font-size:17px;line-height:1.75;color:#273443;">
              ${escapeHtml(content.summary)}
            </div>
          </td>
        </tr>
      </table>`
    : "";

  const factCards = content.details.slice(0, 4);
  const remainingDetails = factCards.length ? content.details.slice(4) : content.details;
  const factCardRows = chunkItems(factCards, 2);

  const factCardsHtml = factCardRows.length
    ? `<div style="margin-top:24px;">
        <div style="margin:0 0 12px;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">Quick snapshot</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:10px 10px;">
          ${factCardRows
            .map(
              (row) => `<tr>
                ${row
                  .map(
                    (detail) => `<td class="stack-card email-tile" valign="top" width="50%" style="background:#fffdf9;border:1px solid ${content.theme.border};padding:18px 17px;border-radius:18px;box-shadow:0 8px 18px rgba(15,23,42,0.04);">
                      <div style="font-size:10px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#7b8794;">${escapeHtml(detail.label)}</div>
                      <div style="margin-top:9px;font-size:15px;line-height:1.65;font-weight:700;color:#13202d;">${escapeHtml(detail.value)}</div>
                    </td>`
                  )
                  .join("")}
                ${row.length === 1 ? `<td class="stack-card" width="50%" style="font-size:0;line-height:0;">&nbsp;</td>` : ""}
              </tr>`
            )
            .join("")}
        </table>
      </div>`
    : "";

  const checklistHtml = content.checklist?.length
    ? `<table class="email-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-collapse:separate;border-spacing:0;background:#f8f3ec;border:1px solid ${content.theme.border};border-radius:24px;">
        <tr>
          <td style="padding:22px 24px;">
            <div style="margin:0 0 12px;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${content.theme.accent};">Next steps</div>
            <ul style="margin:0;padding-left:18px;color:#334155;font-size:14px;line-height:1.85;">
              ${content.checklist.map((item) => `<li style="margin:0 0 8px;">${escapeHtml(item)}</li>`).join("")}
            </ul>
          </td>
        </tr>
      </table>`
    : "";

  const spotlightHtml = content.spotlight?.length
    ? `<div style="margin:22px 0 0;">
        ${content.spotlight
          .map(
            (item) => `<table class="email-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;border-collapse:separate;border-spacing:0;background:#f8f3ec;border:1px solid ${content.theme.border};border-radius:22px;">
              <tr>
                <td style="padding:18px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    <tr>
                      <td width="64" style="vertical-align:top;">
                        <div class="email-chip" style="width:46px;height:46px;border-radius:14px;background:${content.theme.accent};color:#ffffff;font-size:11px;font-weight:800;line-height:46px;text-align:center;letter-spacing:0.08em;box-shadow:0 10px 18px rgba(15,23,42,0.14);">${escapeHtml(item.icon)}</div>
                      </td>
                      <td style="vertical-align:top;">
                        <p class="content-title" style="margin:0;font-size:15px;font-weight:700;color:#13202d;">${escapeHtml(item.title)}</p>
                        <p class="content-copy" style="margin:8px 0 0;font-size:14px;line-height:1.8;color:#475569;">${escapeHtml(item.copy)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>`
          )
          .join("")}
      </div>`
    : "";

  const resourcesHtml = content.resources?.length
    ? `<div style="margin:22px 0 0;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Suggested next moves</p>
        <div>
          ${content.resources
            .map(
              (item) => `<table class="email-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;border-collapse:separate;border-spacing:0;background:#fffdf9;border:1px solid ${content.theme.border};border-radius:22px;">
                <tr>
                  <td style="padding:18px;">
                    <p class="content-title" style="margin:0;font-size:15px;font-weight:700;color:#13202d;">${escapeHtml(item.title)}</p>
                    <p class="content-copy" style="margin:8px 0 0;font-size:14px;line-height:1.8;color:#475569;">${escapeHtml(item.copy)}</p>
                    ${item.href ? `<div style="margin-top:12px;"><a href="${escapeHtml(item.href)}" style="color:${content.theme.accent};font-size:13px;font-weight:800;text-decoration:none;">Open resource</a></div>` : ""}
                  </td>
                </tr>
              </table>`
            )
            .join("")}
        </div>
      </div>`
    : "";

  const detailsHtml = remainingDetails.length
    ? `<div style="margin:22px 0 0;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Details</p>
        <table class="email-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#fffdf9;border:1px solid ${content.theme.border};border-radius:24px;">
          <tr>
            <td style="padding:22px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          ${remainingDetails
            .map(
              (detail) =>
                `<tr>
                  <td class="content-label" style="padding:10px 0;border-bottom:1px solid #eef2f7;font-size:13px;font-weight:700;color:#64748b;vertical-align:top;width:34%;">${escapeHtml(detail.label)}</td>
                  <td class="content-value" style="padding:10px 0;border-bottom:1px solid #eef2f7;font-size:14px;line-height:1.7;color:#0f172a;vertical-align:top;">${escapeHtml(detail.value)}</td>
                </tr>`
            )
            .join("")}
        </table>
            </td>
          </tr>
        </table>
      </div>`
    : "";

  const socialLinksHtml = EMAIL_SOCIAL_LINKS.map(
    (link) => `<a class="social-pill" href="${escapeHtml(link.href)}" style="display:inline-block;margin-right:8px;margin-bottom:8px;padding:10px;width:18px;height:18px;border-radius:999px;background:#15991f;border:1px solid #15991f;text-decoration:none;box-shadow:0 10px 22px rgba(21,153,31,0.16);" aria-label="${escapeHtml(link.name)}"><img src="${escapeHtml(link.icon)}" alt="${escapeHtml(link.name)}" width="18" height="18" style="display:block;width:18px;height:18px;border:0;" /></a>`
  ).join("");

  const footerLinksHtml = [
    { label: "Academy", href: ACADEMY_URL },
    { label: "LXDVerse", href: LXDVERSE_URL },
    { label: "lxdguild@gmail.com", href: CONTACT_EMAIL },
  ]
    .map(
      (link) =>
        `<a href="${escapeHtml(link.href)}" style="display:inline-block;margin-right:16px;margin-bottom:8px;color:#0f172a;font-size:13px;font-weight:700;text-decoration:none;">${escapeHtml(link.label)}</a>`
    )
    .join("");

  const statusHtml = content.status
    ? `<div style="margin:0 0 14px;">
        <span class="status-pill" style="display:inline-block;padding:8px 14px;border-radius:999px;background:${content.theme.accent};color:#ffffff !important;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;border:1px solid ${content.theme.accent};">
          ${escapeHtml(content.status)}
        </span>
      </div>`
    : "";

  const ctaHtml = content.cta
    ? `<div style="margin:24px 0 0;">
        <a class="cta-button" href="${escapeHtml(content.cta.href)}" style="display:inline-block;padding:16px 28px;border-radius:999px;background:${ctaBg};color:${ctaTextColor} !important;text-decoration:none;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;box-shadow:0 14px 28px rgba(15,23,42,0.08);min-width:260px;text-align:center;-webkit-text-fill-color:${ctaTextColor};border:1px solid ${content.theme.accent};">
          ${escapeHtml(content.cta.label)}
        </a>
      </div>`
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(content.heading)}</title>
    <style>
      :root {
        color-scheme: light only;
        supported-color-schemes: light;
      }

      @media only screen and (max-width: 680px) {
        .shell {
          width: 100% !important;
        }

        .outer-pad {
          padding: 12px 8px !important;
        }

        .hero-pad {
          padding: 20px 18px 36px !important;
        }

        .body-pad {
          padding: 0 0 18px !important;
        }

        .content-pad {
          padding: 22px 18px 16px !important;
        }

        .hero-title {
          font-size: 34px !important;
          line-height: 1.12 !important;
        }

        .hero-copy {
          font-size: 15px !important;
          line-height: 1.7 !important;
        }

        .cta-button {
          display: block !important;
          width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          border-radius: 18px !important;
          font-size: 14px !important;
          line-height: 1.4 !important;
        }

        .stack-card,
        .footer-stack {
          display: block !important;
          width: 100% !important;
        }

        .content-shell {
          margin-top: -14px !important;
        }

        .shell {
          border-radius: 22px !important;
        }

        .content-shell,
        .footer-shell,
        .email-card {
          border-radius: 18px !important;
        }

        .email-tile,
        .email-chip,
        .status-pill {
          border-radius: 14px !important;
        }

        .footer-stack-right {
          display: block !important;
          width: 100% !important;
          padding-top: 22px !important;
          text-align: left !important;
        }
      }

      [data-ogsc] .cta-button,
      [data-ogsb] .cta-button {
        color: ${ctaTextColor} !important;
        -webkit-text-fill-color: ${ctaTextColor} !important;
        background: ${ctaBg} !important;
        border-color: ${content.theme.accent} !important;
      }

      [data-ogsc] .status-pill,
      [data-ogsb] .status-pill {
        color: #ffffff !important;
        background: ${content.theme.accent} !important;
        border-color: ${content.theme.accent} !important;
      }

      [data-ogsc] .hero-kicker,
      [data-ogsb] .hero-kicker {
        color: ${heroKickerText} !important;
        -webkit-text-fill-color: ${heroKickerText} !important;
        background: ${heroKickerBg} !important;
        border-color: ${heroKickerBorder} !important;
      }

      [data-ogsc] .hero-title,
      [data-ogsb] .hero-title {
        color: ${heroTitleTone} !important;
        -webkit-text-fill-color: ${heroTitleTone} !important;
      }

      [data-ogsc] .hero-copy,
      [data-ogsb] .hero-copy,
      [data-ogsc] .hero-note,
      [data-ogsb] .hero-note {
        color: ${heroBodyTone} !important;
        -webkit-text-fill-color: ${heroBodyTone} !important;
      }

      [data-ogsc] .hero-note,
      [data-ogsb] .hero-note {
        background: ${heroNoteBg} !important;
        border-color: ${heroNoteBorder} !important;
      }

      [data-ogsc] .shell,
      [data-ogsb] .shell,
      [data-ogsc] .content-shell,
      [data-ogsb] .content-shell,
      [data-ogsc] .footer-shell,
      [data-ogsb] .footer-shell,
      [data-ogsc] .logo-pill,
      [data-ogsb] .logo-pill {
        background: #ffffff !important;
        background-image: none !important;
        border-color: #dbe7d3 !important;
      }

      [data-ogsc] .hero-pad,
      [data-ogsb] .hero-pad {
        background-color: ${heroSurfaceStart} !important;
        background-image: radial-gradient(circle at top right, rgba(21,153,31,0.16) 0%, rgba(21,153,31,0) 34%), linear-gradient(135deg, ${heroSurfaceStart} 0%, ${heroSurfaceEnd} 100%) !important;
      }

      [data-ogsc] .social-pill,
      [data-ogsb] .social-pill {
        background: #15991f !important;
        border-color: #15991f !important;
      }

      [data-ogsc] .footer-copy,
      [data-ogsb] .footer-copy,
      [data-ogsc] .footer-link,
      [data-ogsb] .footer-link,
      [data-ogsc] .eyebrow-label,
      [data-ogsb] .eyebrow-label {
        color: #0f172a !important;
        -webkit-text-fill-color: #0f172a !important;
      }

      [data-ogsc] .content-title,
      [data-ogsb] .content-title {
        color: #13202d !important;
        -webkit-text-fill-color: #13202d !important;
      }

      [data-ogsc] .content-copy,
      [data-ogsb] .content-copy {
        color: #475569 !important;
        -webkit-text-fill-color: #475569 !important;
      }

      [data-ogsc] .content-label,
      [data-ogsb] .content-label {
        color: #64748b !important;
        -webkit-text-fill-color: #64748b !important;
      }

      [data-ogsc] .content-value,
      [data-ogsb] .content-value {
        color: #0f172a !important;
        -webkit-text-fill-color: #0f172a !important;
      }
    </style>
  </head>
    <body style="margin:0;padding:0;background:#f4efe8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#0f172a;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
      ${escapeHtml(content.preheader)}
    </span>
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f4efe8;border-collapse:collapse;">
      <tr>
        <td class="outer-pad" align="center" style="padding:26px 12px;">
          <table class="shell" role="presentation" width="700" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:700px;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e2dbd1;border-radius:30px;overflow:hidden;box-shadow:0 22px 50px rgba(15,23,42,0.08);">
            <tr>
              <td align="center" style="padding:16px 20px 10px;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#6b7280;">
                LXD Guild Notification
              </td>
            </tr>
            <tr>
              <td class="hero-pad" style="background-color:${heroSurfaceStart};background-image:radial-gradient(circle at top right, rgba(21,153,31,0.08) 0%, rgba(21,153,31,0) 34%),linear-gradient(135deg,${heroSurfaceStart} 0%,${heroSurfaceEnd} 100%);padding:28px 34px 54px;border-top:1px solid #f4ede4;border-bottom:1px solid #d9e5df;">
                <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td align="center" style="padding-bottom:18px;">
                      <a class="logo-pill" href="${escapeHtml(getSiteUrl())}" style="display:inline-block;padding:12px 18px;border-radius:18px;background:#ffffff;text-decoration:none;border:1px solid #e4ddd3;box-shadow:0 10px 24px rgba(8,18,37,0.06);">
                        <img src="${BRAND_LOGO_URL}" alt="LXD Guild" width="190" style="display:block;height:auto;border:0;max-width:190px;" />
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:12px;">
                      <div class="status-pill hero-kicker" style="display:inline-block;padding:8px 14px;background:${heroKickerBg};border:1px solid ${heroKickerBorder};color:${heroKickerText} !important;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;border-radius:8px;-webkit-text-fill-color:${heroKickerText};">
                        ${escapeHtml(content.kicker || content.theme.eyebrow)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:10px;">
                      <div class="hero-title" style="font-family:'Trebuchet MS','Segoe UI',Arial,sans-serif;font-size:44px;line-height:1.08;color:${heroTitleTone} !important;font-weight:800;letter-spacing:-0.02em;-webkit-text-fill-color:${heroTitleTone};text-shadow:0 1px 0 rgba(4,12,18,0.28),0 0 1px rgba(248,250,252,0.6);">
                        <span style="color:${heroTitleTone} !important;-webkit-text-fill-color:${heroTitleTone};">
                          ${escapeHtml(content.heading)}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <div class="hero-copy" style="max-width:520px;margin:0 auto;font-size:18px;line-height:1.75;color:${heroBodyTone} !important;-webkit-text-fill-color:${heroBodyTone};text-shadow:0 1px 0 rgba(4,12,18,0.18);">
                        <span style="color:${heroBodyTone} !important;-webkit-text-fill-color:${heroBodyTone};">
                          ${escapeHtml(content.intro)}
                        </span>
                      </div>
                    </td>
                  </tr>
                  ${content.heroNote ? `<tr><td align="center" style="padding-top:18px;"><div class="email-card hero-note" style="max-width:480px;margin:0 auto;padding:12px 16px;border:1px solid ${heroNoteBorder};background:${heroNoteBg};font-size:13px;line-height:1.75;color:${heroBodyTone} !important;border-radius:16px;-webkit-text-fill-color:${heroBodyTone};">${escapeHtml(content.heroNote)}</div></td></tr>` : ""}
                  ${ctaHtml ? `<tr><td align="center">${ctaHtml}</td></tr>` : ""}
                </table>
              </td>
            </tr>
            <tr>
              <td class="body-pad" style="background:#ffffff;padding:0 0 22px;">
                <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 18px;">
                      <table class="content-shell" role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:-20px;border-collapse:separate;border-spacing:0;background:#fbf8f3;border:1px solid #e2dbd1;border-radius:26px;box-shadow:0 20px 46px rgba(15,23,42,0.06);">
                        <tr>
                          <td class="content-pad" style="padding:28px 26px 16px;">
                            ${statusHtml}
                            ${leadCardHtml}
                            ${factCardsHtml}
                            ${detailsHtml}
                            ${spotlightHtml}
                            ${resourcesHtml}
                            ${checklistHtml}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;padding:0 18px 18px;">
                <table class="footer-shell" role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8fbf5;border:1px solid #dce7d5;border-radius:22px;box-shadow:0 14px 30px rgba(15,23,42,0.06);">
                  <tr>
                    <td style="padding:22px 24px;">
                      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                        <tr>
                          <td class="footer-stack" style="vertical-align:top;">
                            <a href="${escapeHtml(getSiteUrl())}" style="display:inline-block;padding:10px 14px;border-radius:14px;background:rgba(248,244,241,0.92);text-decoration:none;">
                              <img src="${BRAND_LOGO_URL}" alt="LXD Guild" width="150" style="display:block;height:auto;border:0;max-width:150px;" />
                            </a>
                              <div class="footer-copy" style="margin-top:12px;font-size:13px;line-height:1.8;color:#5b6b78;max-width:390px;">
                              ${escapeHtml(content.footer)}
                            </div>
                            <div style="margin-top:16px;">
                              ${socialLinksHtml}
                            </div>
                          </td>
                          <td class="footer-stack-right" align="right" style="vertical-align:top;">
                            <div class="eyebrow-label" style="font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#15991f;">Explore</div>
                            <div style="margin-top:10px;max-width:220px;">
                              ${footerLinksHtml}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderText(content: TemplateContent) {
  return [
    content.heading,
    content.intro,
    content.status ? `Status: ${content.status}` : "",
    content.summary || "",
    ...content.details.map((detail) => `${detail.label}: ${detail.value}`),
    ...(content.checklist?.length ? ["Next steps:", ...content.checklist.map((item) => `- ${item}`)] : []),
    content.cta ? `${content.cta.label}: ${content.cta.href}` : "",
    content.footer,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildDetailRows(type: string, data: Record<string, string>, audience: NotificationAudience) {
  const rows: TemplateSection[] = [];

  if (data.name && audience === "user") rows.push({ label: "Name", value: data.name });
  if (data.email && audience === "admin") rows.push({ label: "Recipient", value: data.email });
  if (data.company) rows.push({ label: "Company", value: data.company });
  if (data.title) rows.push({ label: "Role", value: data.title });
  if (data.target_role) rows.push({ label: "Target role", value: data.target_role });
  if (data.designation_bucket) rows.push({ label: "Track", value: data.designation_bucket });
  if (data.score) rows.push({ label: "Score", value: `${data.score}%` });
  if (data.ats_score) rows.push({ label: "ATS score", value: `${data.ats_score}%` });
  if (data.application_mode) rows.push({ label: "Application mode", value: beautifyStatus(data.application_mode) });
  if (data.file_kind) rows.push({ label: "File type", value: data.file_kind.toUpperCase() });
  if (data.candidate_name && audience === "admin") rows.push({ label: "Candidate", value: data.candidate_name });
  if (data.candidate_email && audience === "admin") rows.push({ label: "Candidate email", value: data.candidate_email });
  if (data.certificate_code) rows.push({ label: "Certificate code", value: data.certificate_code });
  if (data.certificate_url && audience === "admin") rows.push({ label: "Certificate URL", value: data.certificate_url });
  if (data.validation_source && audience === "admin") rows.push({ label: "Validation source", value: beautifyStatus(data.validation_source) });
  if (data.validation_notes && audience === "admin") rows.push({ label: "Validation notes", value: data.validation_notes });
  if (data.subject) rows.push({ label: "Subject", value: data.subject });
  if (data.message) rows.push({ label: "Message", value: data.message });

  if (type === "job_posted" && data.job_url) {
    rows.push({ label: "Listing", value: data.job_url });
  }

  return rows;
}

function getPrimaryCta(type: string, data: Record<string, string>, audience: NotificationAudience): EmailCta | null {
  if (audience === "admin") {
    if (data.admin_review_url) return { label: "Open Admin Review", href: data.admin_review_url };
    if (data.employer_job_url) return { label: "Open Employer Job", href: data.employer_job_url };
    if (data.job_url) return { label: "Open Job", href: data.job_url };
    return { label: "Open Admin Dashboard", href: `${getSiteUrl()}/dashboard/admin` };
  }

  if (type === "user_registered") {
    return { label: "Open Dashboard", href: data.dashboard_url || `${getSiteUrl()}/dashboard` };
  }

  if (type === "email_verification_reminder") {
    return { label: "Verify email and see my matched jobs →", href: data.verify_page_url || `${getSiteUrl()}/verify-email` };
  }

  if (type === "exam_result") {
    return { label: "View Scorecard", href: data.scorecard_url || `${getSiteUrl()}/dashboard/candidate/scorecard` };
  }

  if (type === "job_application_received") {
    return { label: "Review Applicants", href: data.employer_job_url || `${getSiteUrl()}/dashboard/employer` };
  }

  if (type === "job_application_reviewed") {
    return {
      label: data.status === "on_hold" ? "Browse matched jobs" : "View Job",
      href:
        data.status === "on_hold"
          ? data.matched_jobs_url || `${getSiteUrl()}/dashboard/candidate`
          : data.job_url || `${getSiteUrl()}/dashboard/jobs`,
    };
  }

  if (type === "job_application") {
    return {
      label:
        data.application_mode === "external" && data.apply_url
          ? "Complete on Employer Site"
          : data.candidate_role === "candidate_onhold"
            ? "Take Assessment"
            : data.candidate_role === "candidate_mvp"
              ? "Browse Matched Jobs"
              : "View Application",
      href:
        data.application_mode === "external" && data.apply_url
          ? data.apply_url
          : data.candidate_role === "candidate_onhold"
            ? data.assessment_url || `${getSiteUrl()}/dashboard/candidate/exam`
            : data.candidate_role === "candidate_mvp"
              ? data.matched_jobs_url || `${getSiteUrl()}/dashboard/candidate`
              : data.job_url || `${getSiteUrl()}/dashboard/candidate/applications`,
    };
  }

  if (type === "job_posted") {
    return { label: "Open Job Posting", href: data.employer_job_url || data.job_url || `${getSiteUrl()}/dashboard/employer` };
  }

  if (type === "certificate_uploaded" || type === "certificate_reviewed") {
    return { label: "Open Candidate Dashboard", href: `${getSiteUrl()}/dashboard/candidate` };
  }

  if (type === "contact_submission" || type === "contact_submission_admin") {
    return {
      label: type === "contact_submission" ? "Contact LXD Guild" : "Reply to Sender",
      href: type === "contact_submission" ? CONTACT_EMAIL : `mailto:${data.email || "lxdguild@gmail.com"}`,
    };
  }

  if (type === "job_delete_approved" || type === "job_delete_rejected") {
    return { label: "Open Employer Dashboard", href: `${getSiteUrl()}/dashboard/employer` };
  }

  return data.job_url ? { label: "Open in LXD Guild", href: data.job_url } : null;
}

function getTheme(audience: NotificationAudience, type: string): EmailTheme {
  if (audience === "admin") {
    return {
      eyebrow: "LXDGUILD Admin Alert",
      accent: "#1f5fbf",
      accentSoft: "#dbeafe",
      panel: "#f4f8ff",
      headerStart: "#f8fbf5",
      headerEnd: "#eef7e8",
      border: "#d8e5f6",
      textMuted: "#5b6b78",
    };
  }

  if (type === "exam_result" || type === "certificate_reviewed") {
    return {
      eyebrow: "LXDGUILD Candidate Update",
      accent: "#15991f",
      accentSoft: "#e7f7df",
      panel: "#f7fbf4",
      headerStart: "#f8fbf5",
      headerEnd: "#eef7e8",
      border: "#dbe7d3",
      textMuted: "#5b6b78",
    };
  }

  if (type === "job_application_received" || type === "job_posted" || type.startsWith("job_delete_")) {
    return {
      eyebrow: "LXDGUILD Employer Update",
      accent: "#15991f",
      accentSoft: "#e7f7df",
      panel: "#f7fbf4",
      headerStart: "#f8fbf5",
      headerEnd: "#eef7e8",
      border: "#dbe7d3",
      textMuted: "#5b6b78",
    };
  }

  return {
    eyebrow: "LXDGUILD",
    accent: "#15991f",
    accentSoft: "#e7f7df",
    panel: "#f8fbf5",
    headerStart: "#f8fbf5",
    headerEnd: "#eef7e8",
    border: "#dbe7d3",
    textMuted: "#5b6b78",
  };
}

function beautifyStatus(value: string) {
  if (value === "shortlisted") return "Accepted for next stage";
  if (value === "on_hold") return "On hold";
  if (value === "registry_code") return "Registry code";
  if (value === "design_similarity") return "Design similarity";
  return value.replaceAll("_", " ");
}

function beautifyRole(value: string) {
  return value.replaceAll("_", " ");
}

function normalizeData(data: Record<string, unknown>) {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      normalized[key] = String(value);
    }
  }

  return normalized;
}

function buildResource(title?: string, href?: string, copy?: string) {
  if (!title) return null;
  return {
    title,
    href: href || null,
    copy: copy || "Continue learning through this recommended next step.",
  };
}

function getMatchedJobResources(data: Record<string, string>) {
  const resources: Array<{ title: string; href: string | null; copy: string }> = [];

  for (let index = 1; index <= 3; index += 1) {
    const title = data[`matched_job_${index}_title`];
    if (!title) continue;

    const company = data[`matched_job_${index}_company`];
    const location = data[`matched_job_${index}_location`];
    resources.push({
      title,
      href: data[`matched_job_${index}_url`] || data.matched_jobs_url || `${getSiteUrl()}/dashboard/candidate`,
      copy: [company, location].filter(Boolean).join(" • ") || "A role selected to stay aligned with your profile.",
    });
  }

  if (resources.length === 0) {
    resources.push({
      title: "See your latest matched jobs",
      href: data.matched_jobs_url || `${getSiteUrl()}/dashboard/candidate`,
      copy: "We are continuing to surface fresh opportunities that better match your role direction and designation.",
    });
  }

  return resources;
}

function compactResources(
  items: Array<{ title: string; href: string | null; copy: string } | null>
): Array<{ title: string; href: string | null; copy: string }> {
  return items.filter((item): item is { title: string; href: string | null; copy: string } => item !== null);
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
