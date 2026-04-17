export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn("sendEmail skipped because RESEND_API_KEY or RESEND_FROM_EMAIL is not configured.");
    console.info("Email payload:", { to, subject, text, html });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const plainText = text || html.replace(/<[^>]+>/g, "");

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: plainText,
    });

    if (error) {
      console.error("Resend sendEmail failed:", error);
    }
  } catch (err) {
    console.error("Resend sendEmail threw:", err);
  }
}
