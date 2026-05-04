import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Name, email, subject, and message are required." }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAILS?.split(",").map((value) => value.trim()).find(Boolean) || "lxdguild@gmail.com";

    await Promise.all([
      sendEmail({
        to: adminEmail,
        subject: `[LXD Guild Contact] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <h2>New Contact Request</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Company:</strong> ${escapeHtml(company || "Not provided")}</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
          </div>
        `,
        text: `New Contact Request

Name: ${name}
Email: ${email}
Company: ${company || "Not provided"}
Subject: ${subject}

Message:
${message}`,
      }),
      sendEmail({
        to: email,
        subject: "We received your message - LXD Guild",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111827;">
            <h2 style="margin-bottom: 12px;">Thanks for reaching out to LXD Guild</h2>
            <p>Hi ${escapeHtml(name)},</p>
            <p>We received your message and our team will get back to you soon.</p>
            <div style="margin: 20px 0; padding: 16px; border: 1px solid #d7e2dc; border-radius: 14px; background: #f7faf8;">
              <p style="margin: 0 0 8px;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
              <p style="margin: 0 0 8px;"><strong>Company:</strong> ${escapeHtml(company || "Not provided")}</p>
              <p style="margin: 0;"><strong>Your message:</strong><br />${escapeHtml(message).replace(/\n/g, "<br />")}</p>
            </div>
            <p>You can also reach us directly at <a href="mailto:lxdguild@gmail.com">lxdguild@gmail.com</a>.</p>
            <p>Regards,<br />LXD Guild</p>
          </div>
        `,
        text: `Thanks for reaching out to LXD Guild

Hi ${name},

We received your message and our team will get back to you soon.

Subject: ${subject}
Company: ${company || "Not provided"}

Your message:
${message}

You can also reach us directly at lxdguild@gmail.com.

Regards,
LXD Guild`,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to send message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
