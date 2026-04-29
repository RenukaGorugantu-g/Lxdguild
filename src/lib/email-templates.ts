import { getSiteUrl } from "./site-url";

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
};

type TemplateSection = {
  label: string;
  value: string;
};

type TemplateContent = {
  preheader: string;
  heading: string;
  intro: string;
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
                  icon: "◆",
                  title: "Assessment-first visibility",
                  copy: "Your Guild assessment helps us map you to stronger-fit L&D opportunities and a sharper professional learning path.",
                },
                {
                  icon: "★",
                  title: "Membership unlocks more",
                  copy: "Explore membership to access premium resources, learning support, and deeper Guild tools once you are ready.",
                },
              ]
            : audience === "user"
              ? [
                  {
                    icon: "◌",
                    title: "Post faster",
                    copy: "Publish a role, review applicants, and track every hiring touchpoint inside one workflow.",
                  },
                  {
                    icon: "▲",
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
        spotlight: data.pass_status === "pass"
          ? [
              {
                icon: "✓",
                title: "You are now visible",
                copy: "Your verified status helps you appear with stronger trust signals across the Guild experience.",
              },
            ]
          : [
              {
                icon: "△",
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
                  icon: "◌",
                  title: "Applicant tracking included",
                  copy: "Every candidate application now flows into your employer view with ATS context and status actions.",
                },
              ]
            : [],
      };

    case "job_application":
      return {
        ...defaults,
        preheader: "Your job application has been recorded.",
        heading: "Application Submitted",
        intro: message,
        summary:
          data.application_mode === "external"
            ? "LXD Guild has tracked your intent to apply. If this role uses an employer-hosted application, make sure you finish the form on their site too."
            : "Your application is now inside the employer review queue on LXD Guild.",
        checklist:
          data.application_mode === "external"
            ? ["Complete the employer's application form if one opens.", "Return to LXD Guild to track future updates."]
            : ["Check your applications dashboard for updates.", "Keep your profile and resume current while the employer reviews your fit."],
      };

    case "job_application_received":
      return {
        ...defaults,
        preheader: "A new candidate has applied to your job.",
        heading: "New Candidate Application",
        intro: `${data.candidate_name || data.candidate_email || "A candidate"} has applied for ${data.title || "your role"} at ${data.company || "your company"}.`,
        summary: "Open the applicants view to review their resume, ATS fit, and decide whether to accept or reject the application.",
        checklist: ["Open the job's applicant list.", "Review the candidate profile and ATS notes.", "Record the next step so the candidate gets an update email immediately."],
        spotlight: [
          {
            icon: "◆",
            title: "Designed for employer flow",
            copy: "You can move from application to accept/reject without losing the trail of notifications or status changes.",
          },
        ],
      };

    case "job_application_reviewed":
      return {
        ...defaults,
        preheader: data.status === "shortlisted" ? "You moved to the next hiring step." : "Your job application has been updated.",
        heading: data.status === "shortlisted" ? "You Moved Forward" : "Application Update",
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
  const checklistHtml = content.checklist?.length
    ? `<div style="margin:24px 0 0;padding:20px;border-radius:20px;background:${content.theme.panel};">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${content.theme.accent};">Next Steps</p>
        <ul style="margin:0;padding-left:18px;color:#334155;font-size:14px;line-height:1.7;">
          ${content.checklist.map((item) => `<li style="margin:0 0 8px;">${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>`
    : "";

  const spotlightHtml = content.spotlight?.length
    ? `<div style="margin:24px 0 0;display:grid;gap:12px;">
        ${content.spotlight
          .map(
            (item) => `<div style="padding:18px;border-radius:20px;background:${content.theme.panel};border:1px solid #dbe3ea;">
              <div style="display:flex;align-items:flex-start;gap:12px;">
                <div style="flex-shrink:0;height:34px;width:34px;border-radius:999px;background:${content.theme.accent};color:#ffffff;font-size:16px;font-weight:700;line-height:34px;text-align:center;">${escapeHtml(item.icon)}</div>
                <div>
                  <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(item.title)}</p>
                  <p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:#475569;">${escapeHtml(item.copy)}</p>
                </div>
              </div>
            </div>`
          )
          .join("")}
      </div>`
    : "";

  const resourcesHtml = content.resources?.length
    ? `<div style="margin:24px 0 0;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Suggested Next Moves</p>
        <div style="display:grid;gap:12px;">
          ${content.resources
            .map(
              (item) => `<div style="padding:18px;border-radius:20px;border:1px solid #dbe3ea;background:#ffffff;">
                <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(item.title)}</p>
                <p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:#475569;">${escapeHtml(item.copy)}</p>
                ${item.href ? `<div style="margin-top:12px;"><a href="${escapeHtml(item.href)}" style="color:${content.theme.accent};font-size:13px;font-weight:700;text-decoration:none;">Open resource</a></div>` : ""}
              </div>`
            )
            .join("")}
        </div>
      </div>`
    : "";

  const detailsHtml = content.details.length
    ? `<div style="margin:24px 0 0;padding:20px;border:1px solid #dbe3ea;border-radius:20px;background:#ffffff;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Snapshot</p>
        ${content.details
          .map(
            (detail) =>
              `<div style="margin:0 0 10px;"><strong style="color:#0f172a;">${escapeHtml(detail.label)}:</strong> <span style="color:#334155;">${escapeHtml(detail.value)}</span></div>`
          )
          .join("")}
      </div>`
    : "";

  const statusHtml = content.status
    ? `<div style="margin:18px 0 0;">
        <span style="display:inline-block;padding:8px 14px;border-radius:999px;background:${content.theme.accentSoft};color:${content.theme.accent};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
          ${escapeHtml(content.status)}
        </span>
      </div>`
    : "";

  const summaryHtml = content.summary
    ? `<p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#475569;">${escapeHtml(content.summary)}</p>`
    : "";

  const ctaHtml = content.cta
    ? `<div style="margin:28px 0 0;">
        <a href="${escapeHtml(content.cta.href)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:${content.theme.accent};color:#ffffff;text-decoration:none;font-weight:700;">
          ${escapeHtml(content.cta.label)}
        </a>
      </div>`
    : "";

  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${escapeHtml(content.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:#edf3f6;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
      ${escapeHtml(content.preheader)}
    </span>
    <div style="max-width:680px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border-radius:30px;overflow:hidden;border:1px solid #d8e2e8;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
        <div style="padding:30px 30px 22px;background:linear-gradient(135deg,#081225 0%,${content.theme.accent} 100%);color:#ffffff;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="height:44px;width:44px;border-radius:14px;background:rgba(255,255,255,0.16);text-align:center;line-height:44px;font-size:14px;font-weight:800;letter-spacing:0.12em;">LXD</div>
            <div>
              <div style="font-size:16px;font-weight:800;letter-spacing:0.04em;">LXD Guild</div>
              <div style="font-size:11px;opacity:0.8;letter-spacing:0.16em;text-transform:uppercase;">Learning Experience Talent Network</div>
            </div>
          </div>
          <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.85;font-weight:700;">${escapeHtml(content.theme.eyebrow)}</div>
          <h1 style="margin:16px 0 0;font-size:30px;line-height:1.18;">${escapeHtml(content.heading)}</h1>
        </div>
        <div style="padding:30px;">
          <p style="margin:0;font-size:16px;line-height:1.8;color:#334155;">${escapeHtml(content.intro)}</p>
          ${statusHtml}
          ${summaryHtml}
          ${ctaHtml}
          ${detailsHtml}
          ${spotlightHtml}
          ${resourcesHtml}
          ${checklistHtml}
          <div style="margin:28px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;">${escapeHtml(content.footer)}</p>
            <p style="margin:12px 0 0;font-size:12px;line-height:1.7;color:#64748b;">
              Website: <a href="${escapeHtml(getSiteUrl())}" style="color:${content.theme.accent};text-decoration:none;">${escapeHtml(getSiteUrl())}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
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
      accent: "#7c3aed",
      accentSoft: "#ede9fe",
      panel: "#f5f3ff",
    };
  }

  if (type === "exam_result" || type === "certificate_reviewed") {
    return {
      eyebrow: "LXD Guild Candidate Update",
      accent: "#0f766e",
      accentSoft: "#ccfbf1",
      panel: "#f0fdfa",
    };
  }

  if (type === "job_application_received" || type === "job_posted" || type.startsWith("job_delete_")) {
    return {
      eyebrow: "LXD Guild Employer Update",
      accent: "#0f766e",
      accentSoft: "#d1fae5",
      panel: "#ecfdf5",
    };
  }

  return {
    eyebrow: "LXD Guild",
    accent: "#0f766e",
    accentSoft: "#d1fae5",
    panel: "#f8fafc",
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
  if (!title) return null
  return {
    title,
    href: href || null,
    copy: copy || "Continue learning through this recommended next step.",
  }
}

function compactResources(
  items: Array<{ title: string; href: string | null; copy: string } | null>
): Array<{ title: string; href: string | null; copy: string }> {
  return items.filter((item): item is { title: string; href: string | null; copy: string } => item !== null)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
