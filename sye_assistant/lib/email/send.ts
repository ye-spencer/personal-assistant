import { Resend } from "resend";
import { env } from "@/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail(opts: {
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const { error } = await resend.emails.send({
    from: env.RESEND_FROM,
    to: env.ALLOWED_EMAIL,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  if (error) throw new Error(`Resend send failed: ${error.message}`);
}
