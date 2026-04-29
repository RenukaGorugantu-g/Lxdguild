export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    console.warn("sendEmail skipped because RESEND_API_KEY or RESEND_FROM_EMAIL is not configured.", {
      hasApiKey: Boolean(apiKey),
      hasFrom: Boolean(from),
      to,
      subject,
    });
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const plainText = text || html.replace(/<[^>]+>/g, "");

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: plainText,
    });

    if (error) {
      console.error("Resend sendEmail failed:", {
        to,
        subject,
        from,
        error,
      });
      return;
    }

    console.info("Resend sendEmail succeeded:", {
      to,
      subject,
      from,
      id: data?.id ?? null,
    });
  } catch (err) {
    console.error("Resend sendEmail threw:", {
      to,
      subject,
      from,
      err,
    });
  }
}
