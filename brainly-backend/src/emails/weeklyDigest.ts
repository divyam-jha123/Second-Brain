export interface WeeklyDigestData {
  username: string;
  noteCount: number;
  notes: { title: string; content?: string; createdAt: string }[];
  unsubscribeUrl: string;
  dashboardUrl: string;
}

export function buildWeeklyDigestHtml(data: WeeklyDigestData): string {
  const noteRows = data.notes
    .map(
      (n) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
          <a href="${n.content || "#"}" style="color:#7c3aed;text-decoration:none;font-weight:600;">${escapeHtml(n.title)}</a>
          <br/>
          <span style="font-size:12px;color:#9ca3af;">Saved ${n.createdAt}</span>
        </td>
      </tr>`,
    )
    .join("");

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
          <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;">🧠 Your Weekly Brain Digest</h1>
            <p style="margin:8px 0 0;color:#e9d5ff;font-size:14px;">Here's what you saved this week</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:24px 24px 8px;">
            <p style="margin:0;font-size:16px;color:#374151;">Hey <strong>${escapeHtml(data.username)}</strong> 👋</p>
            <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">
              You saved <strong>${data.noteCount}</strong> note${data.noteCount !== 1 ? "s" : ""} this past week. Here's a quick recap:
            </p>
          </td>
        </tr>

        <!-- Notes Table -->
        <tr>
          <td style="padding:16px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf5ff;border-radius:8px;overflow:hidden;">
              ${noteRows || `<tr><td style="padding:24px;text-align:center;color:#9ca3af;">No notes saved this week — time to start collecting!</td></tr>`}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:16px 24px 24px;text-align:center;">
            <a href="${data.dashboardUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              Open Your Brain →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 24px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You're receiving this because you signed up for BrainExpo.
              <br/>
              <a href="${data.unsubscribeUrl}" style="color:#7c3aed;">Unsubscribe from weekly digests</a>
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
