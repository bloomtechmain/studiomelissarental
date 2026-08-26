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

  const eventLine = args.eventName ? ` for ${args.eventName}` : "";

  await transporter.sendMail({
    from,
    to: args.to,
    subject,
    text: `Hi ${args.customerName},

Here's your payment request from Studio Melissa Rental${eventLine}: $${args.amount.toFixed(2)}

Pay here: ${args.checkoutUrl}

If you weren't expecting this, please contact us before paying.

Studio Melissa Rental — Audio & PA Equipment Rentals`,
    html: renderPaymentLinkEmail(args),
  });
}

// Brand palette/type from Studio_Melissa_Rental_Style_Guide.docx — navy for
// headings, steel gray for body copy, amber as the one CTA accent (email
// clients strip web fonts, so Sora/Inter fall back to a system sans stack).
function renderPaymentLinkEmail(args: {
  customerName: string;
  amount: number;
  checkoutUrl: string;
  eventName?: string | null;
}): string {
  const eventLine = args.eventName
    ? ` for <strong style="color:#0c2d4d;">${escapeHtml(args.eventName)}</strong>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:0; background-color:#f6f4ef; font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f4ef; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #dad6cb;">
            <tr>
              <td style="background-color:#0c2d4d; padding:20px 32px;">
                <span style="color:#ffffff; font-size:15px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;">
                  Studio Melissa Rental
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px; color:#0c2d4d; font-size:16px;">Hi ${escapeHtml(args.customerName)},</p>
                <p style="margin:0 0 24px; color:#5b6672; font-size:15px; line-height:1.6;">
                  Here&rsquo;s your payment request from Studio Melissa Rental${eventLine}.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f4ef; border-radius:12px; margin-bottom:24px;">
                  <tr>
                    <td style="padding:20px; text-align:center;">
                      <span style="display:block; color:#5b6672; font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase;">Amount due</span>
                      <span style="display:block; color:#0c2d4d; font-size:32px; font-weight:700; margin-top:4px;">$${args.amount.toFixed(2)}</span>
                    </td>
                  </tr>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                  <tr>
                    <td style="border-radius:999px; background-color:#e8a33d;">
                      <a href="${args.checkoutUrl}"
                         style="display:inline-block; padding:14px 36px; color:#8a5a16; font-size:15px; font-weight:700; text-decoration:none; border-radius:999px;">
                        Pay now
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px; color:#5b6672; font-size:13px; line-height:1.5;">
                  If the button doesn&rsquo;t work, copy and paste this link into your browser:
                </p>
                <p style="margin:0; word-break:break-all;">
                  <a href="${args.checkoutUrl}" style="color:#1d6fbf; font-size:13px;">${args.checkoutUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f6f4ef; padding:16px 32px; border-top:1px solid #dad6cb;">
                <p style="margin:0; color:#5b6672; font-size:12px;">
                  Studio Melissa Rental — Audio &amp; PA Equipment Rentals. If you weren&rsquo;t expecting this email, please contact us before paying.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
