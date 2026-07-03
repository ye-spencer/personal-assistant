import { Resend } from "resend";
import { env } from "@/env";
import type { Lesson, Reminder } from "@/lib/db/schema";
import type { BirthdayDigest } from "@/lib/people/daily";
import { renderMorningEmail } from "./templates/morning";

type SendArgs = {
  subject: string;
  html: string;
  text: string;
};

// All outbound mail goes through this service. Single instance per process —
// the Resend SDK is lightweight, but centralizing makes it easy to swap
// providers later or add retries / queueing without touching call sites.
class EmailService {
  private readonly client: Resend;

  constructor() {
    this.client = new Resend(env.RESEND_API_KEY);
  }

  // Low-level: send an arbitrary email to ALLOWED_EMAIL. Callers should
  // prefer the higher-level methods below; this is the escape hatch.
  async send(args: SendArgs): Promise<void> {
    const { error } = await this.client.emails.send({
      from: env.RESEND_FROM,
      to: env.ALLOWED_EMAIL,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (error) throw new Error(`Resend send failed: ${error.message}`);
  }

  // High-level: render and send the daily morning digest. New tools that want
  // a section in this email plug into renderMorningEmail's args.
  async sendMorningDigest(args: {
    lesson: Lesson | null;
    birthdays: BirthdayDigest;
    reminders: Reminder[];
    date: Date;
  }): Promise<void> {
    const rendered = renderMorningEmail(args);
    await this.send(rendered);
  }
}

export const emailService = new EmailService();
