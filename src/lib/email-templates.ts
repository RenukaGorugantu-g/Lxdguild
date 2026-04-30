import { getSiteUrl } from "./site-url";

const BRAND_LOGO_URL = "https://lxdguild.com/img/z-1.webp";

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

    default:
      return defaults;
  }
}

function renderEmailHtml(content: TemplateContent) {
  const heroAccentColor =
    content.layoutVariant === "celebration"
      ? "#e8ff87"
      : content.layoutVariant === "urgent"
        ? "#ffd38a"
        : content.layoutVariant === "support"
          ? "#c7f0ff"
          : "#e8ff87";

  const heroBodyTone =
    content.layoutVariant === "support"
      ? "rgba(230,240,247,0.95)"
      : "rgba(255,255,255,0.92)";

  const ctaBg =
    content.layoutVariant === "urgent"
      ? "#ffd38a"
      : content.layoutVariant === "support"
        ? "#c7f0ff"
        : content.theme.accent;

  const ctaTextColor =
    content.layoutVariant === "urgent" || content.layoutVariant === "support"
      ? "#081225"
      : "#081225";

  const leadCardHtml = content.summary
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;border-collapse:separate;border-spacing:0;background:linear-gradient(135deg,#f8fafc 0%,#ffffff 100%);border:1px solid ${content.theme.border};border-radius:24px;">
        <tr>
          <td style="padding:20px 22px;">
            <div style="font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${content.theme.accent};">What matters now</div>
            <div style="margin-top:10px;font-size:18px;line-height:1.7;color:#1f2937;">
              ${escapeHtml(content.summary)}
            </div>
          </td>
        </tr>
      </table>`
    : "";

  const factCards = content.details.slice(0, 4);
  const remainingDetails = factCards.length ? content.details.slice(4) : content.details;

  const factCardsHtml = factCards.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:separate;border-spacing:12px 12px;">
        <tr>
          ${factCards
            .map(
              (detail) => `<td valign="top" width="${Math.max(25, Math.floor(100 / factCards.length))}%" style="background:${content.theme.panel};border:1px solid ${content.theme.border};padding:16px 14px;border-radius:18px;">
                <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;">${escapeHtml(detail.label)}</div>
                <div style="margin-top:8px;font-size:15px;line-height:1.6;font-weight:700;color:#0f172a;">${escapeHtml(detail.value)}</div>
              </td>`
            )
            .join("")}
        </tr>
      </table>`
    : "";

  const checklistHtml = content.checklist?.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:separate;border-spacing:0;background:${content.theme.panel};border:1px solid ${content.theme.border};border-radius:24px;">
        <tr>
          <td style="padding:22px 24px;">
            <div style="margin:0 0 12px;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${content.theme.accent};">Next Steps</div>
            <ul style="margin:0;padding-left:18px;color:#334155;font-size:14px;line-height:1.8;">
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
            (item) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;border-collapse:separate;border-spacing:0;background:${content.theme.panel};border:1px solid ${content.theme.border};border-radius:22px;">
              <tr>
                <td style="padding:18px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    <tr>
                      <td width="64" style="vertical-align:top;">
                        <div style="width:46px;height:46px;border-radius:14px;background:${content.theme.accent};color:#ffffff;font-size:11px;font-weight:800;line-height:46px;text-align:center;letter-spacing:0.08em;">${escapeHtml(item.icon)}</div>
                      </td>
                      <td style="vertical-align:top;">
                        <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(item.title)}</p>
                        <p style="margin:8px 0 0;font-size:14px;line-height:1.8;color:#475569;">${escapeHtml(item.copy)}</p>
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
        <p style="margin:0 0 12px;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Suggested Next Moves</p>
        <div>
          ${content.resources
            .map(
              (item) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid ${content.theme.border};border-radius:22px;">
                <tr>
                  <td style="padding:18px;">
                    <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(item.title)}</p>
                    <p style="margin:8px 0 0;font-size:14px;line-height:1.8;color:#475569;">${escapeHtml(item.copy)}</p>
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
        <p style="margin:0 0 12px;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Snapshot</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid ${content.theme.border};border-radius:24px;">
          <tr>
            <td style="padding:22px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          ${remainingDetails
            .map(
              (detail) =>
                `<tr>
                  <td style="padding:10px 0;border-bottom:1px solid #eef2f7;font-size:13px;font-weight:700;color:#64748b;vertical-align:top;width:34%;">${escapeHtml(detail.label)}</td>
                  <td style="padding:10px 0;border-bottom:1px solid #eef2f7;font-size:14px;line-height:1.7;color:#0f172a;vertical-align:top;">${escapeHtml(detail.value)}</td>
                </tr>`
            )
            .join("")}
        </table>
            </td>
          </tr>
        </table>
      </div>`
    : "";

  const statusHtml = content.status
    ? `<div style="margin:0 0 14px;">
        <span style="display:inline-block;padding:8px 14px;border-radius:999px;background:${content.theme.accentSoft};color:${content.theme.accent};font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">
          ${escapeHtml(content.status)}
        </span>
      </div>`
    : "";

  const summaryHtml = content.summary
    ? ``
    : "";

  const ctaHtml = content.cta
    ? `<div style="margin:22px 0 0;">
        <a href="${escapeHtml(content.cta.href)}" style="display:inline-block;padding:15px 24px;border-radius:0;background:${ctaBg};color:${ctaTextColor};text-decoration:none;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;box-shadow:0 10px 24px rgba(15,118,110,0.18);min-width:260px;text-align:center;">
          ${escapeHtml(content.cta.label)}
        </a>
      </div>`
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(content.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:#e7d1c8;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
      ${escapeHtml(content.preheader)}
    </span>
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#e7d1c8;border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="650" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:650px;border-collapse:collapse;">
            <tr>
              <td align="center" style="padding-bottom:12px;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;">
                LXD Guild Notification
              </td>
            </tr>
            <tr>
              <td style="background:#08131f;background-image:linear-gradient(135deg,${content.theme.headerStart} 0%,${content.theme.headerEnd} 100%);padding:22px 32px 72px;border-top:1px solid #2d3a45;border-bottom:1px solid #2d3a45;">
                <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td align="left" style="padding-bottom:18px;">
                      <a href="${escapeHtml(getSiteUrl())}" style="text-decoration:none;">
                        <img src="${BRAND_LOGO_URL}" alt="LXD Guild" width="150" style="display:block;height:auto;border:0;max-width:150px;" />
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:12px;">
                      <div style="display:inline-block;padding:8px 14px;background:rgba(255,255,255,0.12);color:#ffffff;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">
                        ${escapeHtml(content.kicker || content.theme.eyebrow)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:10px;">
                      <div style="font-family:Georgia,'Times New Roman',serif;font-size:54px;line-height:1.02;color:${heroAccentColor};font-style:italic;">
                        ${escapeHtml(content.heading)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <div style="max-width:520px;margin:0 auto;font-size:18px;line-height:1.7;color:${heroBodyTone};">
                        ${escapeHtml(content.intro)}
                      </div>
                    </td>
                  </tr>
                  ${content.heroNote ? `<tr><td align="center" style="padding-top:18px;"><div style="max-width:460px;margin:0 auto;padding:12px 16px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.08);font-size:13px;line-height:1.7;color:${heroBodyTone};">${escapeHtml(content.heroNote)}</div></td></tr>` : ""}
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#08131f;padding:0 0 24px;">
                <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:0 28px;">
                      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:-42px;border-collapse:separate;border-spacing:0;background:#ffffff;">
                        <tr>
                          <td style="padding:28px 26px 16px;">
                            ${statusHtml}
                            ${leadCardHtml}
                            ${ctaHtml}
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
              <td style="background:#08131f;padding:0 28px 28px;">
                <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#0b1826;">
                  <tr>
                    <td style="padding:22px 24px;">
                      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                        <tr>
                          <td style="vertical-align:top;">
                            <a href="${escapeHtml(getSiteUrl())}" style="display:inline-block;text-decoration:none;">
                              <img src="${BRAND_LOGO_URL}" alt="LXD Guild" width="120" style="display:block;height:auto;border:0;max-width:120px;" />
                            </a>
                            <div style="margin-top:12px;font-size:12px;line-height:1.8;color:#d4dde3;max-width:390px;">
                              ${escapeHtml(content.footer)}
                            </div>
                          </td>
                          <td align="right" style="vertical-align:top;">
                            <div style="font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#e8ff87;">Visit</div>
                            <div style="margin-top:8px;">
                              <a href="${escapeHtml(getSiteUrl())}" style="color:#ffffff;font-size:13px;font-weight:800;text-decoration:none;">${escapeHtml(getSiteUrl())}</a>
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
