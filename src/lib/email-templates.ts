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
      return {
        ...defaults,
        preheader:
          data.application_mode === "external"
            ? "Finish your application on the employer site."
            : "Your application is now with the employer.",
        heading:
          data.application_mode === "external"
            ? "Finish Your Application"
            : "Application Submitted",
        kicker:
          data.application_mode === "external"
            ? "One more step to complete"
            : "You are officially in motion",
        heroNote:
          data.application_mode === "external"
            ? "The employer still needs the final submission on their own site."
            : "Your profile is now visible to the hiring team in their review flow.",
        layoutVariant: data.application_mode === "external" ? "urgent" : "celebration",
        intro:
          data.application_mode === "external"
            ? `You started your application for ${data.title || "the role"} at ${data.company || "the employer"}. Complete the final step on the employer's page so your application goes through fully.`
            : `Your application for ${data.title || "the role"} at ${data.company || "the employer"} is now inside the employer review queue on LXD Guild.`,
        summary:
          data.application_mode === "external"
            ? "We saved your application intent in LXD Guild so you can return and track your progress, but you still need to finish the employer form."
            : "You are officially in the employer's pipeline. Keep your profile polished while they review your fit.",
        checklist:
          data.application_mode === "external"
            ? [
                "Open the employer application and complete every required field.",
                "Use the same resume and contact details for consistency.",
                "Return to LXD Guild later to track updates and next steps.",
              ]
            : [
                "Watch your applications dashboard for shortlist or rejection updates.",
                "Keep your resume, headline, and portfolio links current.",
                "Be ready for a recruiter follow-up if the employer moves fast.",
              ],
        spotlight:
          data.application_mode === "external"
            ? [
                {
                  icon: "01",
                  title: "Important",
                  copy: "This role finishes on the employer's own site. Until that final form is submitted, the application may remain incomplete.",
                },
              ]
            : [
                {
                  icon: "LIVE",
                  title: "You are in the review flow",
                  copy: "Your profile, resume, and match context are now available to the employer inside the LXD Guild hiring workflow.",
                },
              ],
        resources:
          data.application_mode === "external"
            ? [
                {
                  title: "Review the role once more",
                  copy: "Double-check the job context before completing the employer's page.",
                  href: data.job_url || `${getSiteUrl()}/dashboard/jobs`,
                },
              ]
            : [
                {
                  title: "Track this application",
                  copy: "Open your applications dashboard to follow every employer update.",
                  href: `${getSiteUrl()}/dashboard/candidate/applications`,
                },
              ],
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

    case "job_application_reviewed":
      return {
        ...defaults,
        preheader: data.status === "shortlisted" ? "You moved to the next hiring step." : "Your job application has been updated.",
        heading: data.status === "shortlisted" ? "You Moved Forward" : "Application Update",
        kicker: data.status === "shortlisted" ? "Momentum is building" : "Keep your momentum anyway",
        heroNote:
          data.status === "shortlisted"
            ? "This employer wants to continue the conversation with you."
            : "One no should not interrupt your larger opportunity path.",
        layoutVariant: data.status === "shortlisted" ? "celebration" : "support",
        intro:
          data.status === "shortlisted"
            ? `Your application for ${data.title || "the role"} at ${data.company || "the company"} has been accepted for the next hiring step.`
            : `Your application for ${data.title || "the role"} at ${data.company || "the company"} was not selected for the next stage.`,
        status: data.status === "shortlisted" ? "Accepted for next stage" : "Not selected",
        summary:
          data.status === "shortlisted"
            ? "Keep an eye on your inbox and dashboard for the employer's follow-up."
            : "Your profile remains active for future opportunities, and you can continue exploring similar jobs from the dashboard.",
        resources:
          data.status === "shortlisted"
            ? [
                {
                  title: "Review the role again",
                  copy: "Refresh yourself on the job context and keep your profile polished for the next conversation.",
                  href: data.job_url || `${getSiteUrl()}/dashboard/jobs`,
                },
              ]
            : [],
      };

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
  const isUrgentHero = content.layoutVariant === "urgent";
  const heroTitleTone = "#f8fafc";
  const heroBodyTone = "#dbe7f3";
  const heroKickerText = "#f8fafc";
  const heroKickerBg =
    content.layoutVariant === "support"
      ? "#134e4a"
      : isUrgentHero
        ? "#18324b"
        : "#18462d";
  const heroKickerBorder =
    content.layoutVariant === "support"
      ? "#1d7f76"
      : isUrgentHero
        ? "#2d4e73"
        : "#2f7b47";
  const heroNoteBg = "#1f2937";
  const heroNoteBorder = "#31475f";
  const heroSurfaceStart = "#0f172a";
  const heroSurfaceEnd =
    content.layoutVariant === "support"
      ? "#15384d"
      : isUrgentHero
        ? "#19324b"
        : "#10301e";

  const ctaBg =
    content.layoutVariant === "urgent"
      ? "#b7791f"
      : content.layoutVariant === "support"
        ? "#0f766e"
        : content.theme.accent;

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
    (link) => `<a href="${escapeHtml(link.href)}" style="display:inline-block;margin-right:8px;margin-bottom:8px;padding:10px;width:18px;height:18px;border-radius:999px;background:rgba(248,244,241,0.08);border:1px solid rgba(248,244,241,0.16);text-decoration:none;" aria-label="${escapeHtml(link.name)}"><img src="${escapeHtml(link.icon)}" alt="${escapeHtml(link.name)}" width="18" height="18" style="display:block;width:18px;height:18px;border:0;" /></a>`
  ).join("");

  const footerLinksHtml = [
    { label: "Academy", href: ACADEMY_URL },
    { label: "LXDVerse", href: LXDVERSE_URL },
    { label: "lxdguild@gmail.com", href: CONTACT_EMAIL },
  ]
    .map(
      (link) =>
        `<a href="${escapeHtml(link.href)}" style="display:inline-block;margin-right:16px;margin-bottom:8px;color:#f8fafc;font-size:13px;font-weight:700;text-decoration:none;">${escapeHtml(link.label)}</a>`
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
        <a class="cta-button" href="${escapeHtml(content.cta.href)}" style="display:inline-block;padding:16px 28px;border-radius:999px;background:${ctaBg};color:${ctaTextColor} !important;text-decoration:none;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;box-shadow:0 14px 28px rgba(15,23,42,0.14);min-width:260px;text-align:center;-webkit-text-fill-color:${ctaTextColor};">
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
          font-size: 40px !important;
          line-height: 1.05 !important;
        }

        .hero-copy {
          font-size: 16px !important;
          line-height: 1.65 !important;
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
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
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
    <body style="margin:0;padding:0;background:#eee5db;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
      ${escapeHtml(content.preheader)}
    </span>
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#eee5db;border-collapse:collapse;">
      <tr>
        <td class="outer-pad" align="center" style="padding:26px 12px;">
          <table class="shell" role="presentation" width="700" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:700px;border-collapse:separate;border-spacing:0;background:#f6efe6;border:1px solid #dbcfc4;border-radius:30px;overflow:hidden;box-shadow:0 22px 50px rgba(15,23,42,0.08);">
            <tr>
              <td align="center" style="padding:16px 20px 10px;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#6b7280;">
                LXD Guild Notification
              </td>
            </tr>
            <tr>
              <td class="hero-pad" style="background-color:${heroSurfaceStart};background-image:radial-gradient(circle at top right, rgba(15,118,110,0.08) 0%, rgba(15,118,110,0) 34%),linear-gradient(135deg,${heroSurfaceStart} 0%,${heroSurfaceEnd} 100%);padding:28px 34px 54px;border-top:1px solid #f4ede4;border-bottom:1px solid #d9e5df;">
                <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td align="center" style="padding-bottom:18px;">
                      <a href="${escapeHtml(getSiteUrl())}" style="display:inline-block;padding:12px 18px;border-radius:18px;background:rgba(248,244,241,0.95);text-decoration:none;box-shadow:0 10px 24px rgba(8,18,37,0.18);">
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
                      <div class="hero-title" style="font-family:Georgia,'Times New Roman',serif;font-size:54px;line-height:1.02;color:${heroTitleTone} !important;font-style:italic;-webkit-text-fill-color:${heroTitleTone};">
                        ${escapeHtml(content.heading)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <div class="hero-copy" style="max-width:520px;margin:0 auto;font-size:18px;line-height:1.75;color:${heroBodyTone} !important;-webkit-text-fill-color:${heroBodyTone};">
                        ${escapeHtml(content.intro)}
                      </div>
                    </td>
                  </tr>
                  ${content.heroNote ? `<tr><td align="center" style="padding-top:18px;"><div class="email-card hero-note" style="max-width:480px;margin:0 auto;padding:12px 16px;border:1px solid ${heroNoteBorder};background:${heroNoteBg};font-size:13px;line-height:1.75;color:${heroBodyTone} !important;border-radius:16px;-webkit-text-fill-color:${heroBodyTone};">${escapeHtml(content.heroNote)}</div></td></tr>` : ""}
                  ${ctaHtml ? `<tr><td align="center">${ctaHtml}</td></tr>` : ""}
                </table>
              </td>
            </tr>
            <tr>
              <td class="body-pad" style="background:#f6efe6;padding:0 0 22px;">
                <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 18px;">
                      <table class="content-shell" role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:-20px;border-collapse:separate;border-spacing:0;background:#f9f4ed;border:1px solid #ddd2c7;border-radius:26px;box-shadow:0 20px 46px rgba(15,23,42,0.08);">
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
              <td style="background:#f6efe6;padding:0 18px 18px;">
                <table class="footer-shell" role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#0d1823;border:1px solid #1f3344;border-radius:22px;box-shadow:0 14px 30px rgba(15,23,42,0.12);">
                  <tr>
                    <td style="padding:22px 24px;">
                      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                        <tr>
                          <td class="footer-stack" style="vertical-align:top;">
                            <a href="${escapeHtml(getSiteUrl())}" style="display:inline-block;padding:10px 14px;border-radius:14px;background:rgba(248,244,241,0.92);text-decoration:none;">
                              <img src="${BRAND_LOGO_URL}" alt="LXD Guild" width="150" style="display:block;height:auto;border:0;max-width:150px;" />
                            </a>
                            <div style="margin-top:12px;font-size:12px;line-height:1.8;color:#d4dde3;max-width:390px;">
                              ${escapeHtml(content.footer)}
                            </div>
                            <div style="margin-top:16px;">
                              ${socialLinksHtml}
                            </div>
                          </td>
                          <td class="footer-stack-right" align="right" style="vertical-align:top;">
                            <div style="font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#f5f0c5;">Explore</div>
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

  if (type === "exam_result") {
    return { label: "View Scorecard", href: data.scorecard_url || `${getSiteUrl()}/dashboard/candidate/scorecard` };
  }

  if (type === "job_application_received") {
    return { label: "Review Applicants", href: data.employer_job_url || `${getSiteUrl()}/dashboard/employer` };
  }

  if (type === "job_application_reviewed") {
    return { label: "View Job", href: data.job_url || `${getSiteUrl()}/dashboard/jobs` };
  }

  if (type === "job_application") {
    return {
      label: data.application_mode === "external" && data.apply_url ? "Complete on Employer Site" : "View Application",
      href: data.application_mode === "external" && data.apply_url ? data.apply_url : data.job_url || `${getSiteUrl()}/dashboard/candidate/applications`,
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
      eyebrow: "LXD Guild Admin Alert",
      accent: "#0f766e",
      accentSoft: "#ccfbf1",
      panel: "#f0fdfa",
      headerStart: "#081225",
      headerEnd: "#0f766e",
      border: "#cfe8e4",
      textMuted: "#5b6b78",
    };
  }

  if (type === "exam_result" || type === "certificate_reviewed") {
    return {
      eyebrow: "LXD Guild Candidate Update",
      accent: "#0f766e",
      accentSoft: "#ccfbf1",
      panel: "#f0fdfa",
      headerStart: "#0b1b34",
      headerEnd: "#0f766e",
      border: "#cfe8e4",
      textMuted: "#5b6b78",
    };
  }

  if (type === "job_application_received" || type === "job_posted" || type.startsWith("job_delete_")) {
    return {
      eyebrow: "LXD Guild Employer Update",
      accent: "#0f766e",
      accentSoft: "#d1fae5",
      panel: "#ecfdf5",
      headerStart: "#081225",
      headerEnd: "#14845f",
      border: "#d5eadf",
      textMuted: "#5b6b78",
    };
  }

  return {
    eyebrow: "LXD Guild",
    accent: "#0f766e",
    accentSoft: "#d1fae5",
    panel: "#f8fafc",
    headerStart: "#081225",
    headerEnd: "#14532d",
    border: "#dbe7eb",
    textMuted: "#5b6b78",
  };
}

function beautifyStatus(value: string) {
  if (value === "shortlisted") return "Accepted for next stage";
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
