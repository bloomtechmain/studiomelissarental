import { Resend } from "resend";

// Lazily constructed, same pattern as src/lib/stripe.ts — a missing key
// fails loudly at the point of use rather than crashing every route on
// boot, since most of the app has nothing to do with sending email.
let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set — add your Resend API key to .env.");
  }
  _resend = new Resend(key);
  return _resend;
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendPaymentLinkEmail(args: {
  to: string;
  customerName: string;
  amount: number;
  checkoutUrl: string;
  eventName?: string | null;
}): Promise<void> {
  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL || "Studio Melissa Rental <onboarding@resend.dev>";
  const subject = `Payment request — $${args.amount.toFixed(2)}${
    args.eventName ? ` for ${args.eventName}` : ""
  }`;

  const { error } = await resend.emails.send({
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

  if (error) {
    throw new Error(error.message || "Resend failed to send the email.");
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
