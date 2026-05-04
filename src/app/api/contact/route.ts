import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { buildNotificationEmail } from "@/lib/email-templates";

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
    const adminEmailTemplate = buildNotificationEmail({
      audience: "admin",
      type: "contact_submission_admin",
      title: "New contact request",
      message: `${name} sent a new contact request about "${subject}".`,
      data: {
        name,
        email,
        company: company || "Not provided",
        subject,
        message,
      },
    });
    const userEmailTemplate = buildNotificationEmail({
      audience: "user",
      type: "contact_submission",
      title: "We received your message",
      message: `Thanks ${name}, we received your message and our team will get back to you soon.`,
      data: {
        name,
        email,
        company: company || "Not provided",
        subject,
        message,
      },
    });

    await Promise.all([
      sendEmail({
        to: adminEmail,
        subject: `[LXD Guild Contact] ${subject}`,
        html: adminEmailTemplate.html,
        text: adminEmailTemplate.text,
      }),
      sendEmail({
        to: email,
        subject: "We received your message - LXD Guild",
        html: userEmailTemplate.html,
        text: userEmailTemplate.text,
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to send message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
