import nodemailer, { type Transporter } from "nodemailer";

// Lazily constructed, same pattern as src/lib/stripe.ts — a missing config
// fails loudly at the point of use rather than crashing every route on
// boot, since most of the app has nothing to do with sending email.
let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) {
    throw new Error(
      "SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be set — add your Zoho Mail credentials to .env."
    );
  }
  const port = Number(process.env.SMTP_PORT) || 465;
  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return _transporter;
}

export function emailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

export async function sendPaymentLinkEmail(args: {
  to: string;
  customerName: string;
  amount: number;
  checkoutUrl: string;
  eventName?: string | null;
}): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM_EMAIL || "Studio Melissa Rental <info@studiomelissarental.com>";
  const subject = `Payment request — $${args.amount.toFixed(2)}${
    args.eventName ? ` for ${args.eventName}` : ""
  }`;

  await transporter.sendMail({
    from,
    to: args.to,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Hi ${escapeHtml(args.customerName)},</p>
        <p>
          Here's your payment request from Studio Melissa Rental${
            args.eventName ? ` for <strong>${escapeHtml(args.eventName)}</strong>` : ""
          }:
        </p>
        <p style="font-size: 20px; font-weight: 600; margin: 20px 0;">
          $${args.amount.toFixed(2)}
        </p>
        <p>
          <a href="${args.checkoutUrl}"
             style="display: inline-block; background: #0a2540; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">
            Pay now
          </a>
        </p>
        <p style="color: #666; font-size: 13px; margin-top: 24px;">
          If the button doesn't work, copy and paste this link into your browser:<br />
          ${args.checkoutUrl}
        </p>
      </div>
    `,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
