export interface AnnouncementData {
  username: string;
  subject: string;
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeUrl: string;
}

export function buildAnnouncementHtml(data: AnnouncementData): string {
  const ctaBlock = data.ctaUrl
    ? `<tr>
        <td style="padding:8px 24px 24px;text-align:center;">
          <a href="${data.ctaUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            ${escapeHtml(data.ctaText || "Check It Out")} →
          </a>
        </td>
      </tr>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;">✨ ${escapeHtml(data.title)}</h1>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:24px 24px 8px;">
            <p style="margin:0;font-size:16px;color:#374151;">Hey <strong>${escapeHtml(data.username)}</strong> 👋</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:8px 24px 16px;">
            <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">
              ${escapeHtml(data.body).replace(/\n/g, "<br/>")}
            </p>
          </td>
        </tr>

        <!-- CTA -->
        ${ctaBlock}

        <!-- Footer -->
        <tr>
          <td style="padding:16px 24px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You're receiving this because you signed up for BrainExpo.
              <br/>
              <a href="${data.unsubscribeUrl}" style="color:#7c3aed;">Unsubscribe from feature announcements</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
