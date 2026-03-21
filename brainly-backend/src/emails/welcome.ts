export interface WelcomeData {
  username: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
}

export function buildWelcomeHtml(data: WelcomeData): string {
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
          <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:40px 24px;text-align:center;">
            <h1 style="margin:0 0 8px;color:#ffffff;font-size:28px;">🧠 Welcome to BrainExpo!</h1>
            <p style="margin:0;color:rgba(255,255,255,0.85);font-size:16px;">Your second brain starts here</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:28px 24px 12px;">
            <p style="margin:0;font-size:18px;color:#374151;">Hey <strong>${escapeHtml(data.username)}</strong> 👋</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:8px 24px 20px;">
            <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
              Thanks for joining BrainExpo! We're excited to have you on board.
            </p>
            <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.7;">
              BrainExpo is your personal knowledge hub — save notes, links, tweets, and documents all in one place. Think of it as your second brain that never forgets.
            </p>
            <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.7;">
              Here's what you can do:
            </p>
          </td>
        </tr>

        <!-- Features list -->
        <tr>
          <td style="padding:0 24px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 16px;background:#f3f0ff;border-radius:8px;margin-bottom:8px;">
                  <p style="margin:0;font-size:14px;color:#4b5563;">📝 <strong>Save Notes</strong> — Capture ideas instantly</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:10px 16px;background:#f3f0ff;border-radius:8px;">
                  <p style="margin:0;font-size:14px;color:#4b5563;">🔗 <strong>Bookmark Links</strong> — Never lose an important URL</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:10px 16px;background:#f3f0ff;border-radius:8px;">
                  <p style="margin:0;font-size:14px;color:#4b5563;">🐦 <strong>Save Tweets</strong> — Keep tweets that matter</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:10px 16px;background:#f3f0ff;border-radius:8px;">
                  <p style="margin:0;font-size:14px;color:#4b5563;">📄 <strong>Store Documents</strong> — Organize everything</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:8px 24px 28px;text-align:center;">
            <a href="${data.dashboardUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Go to Your Dashboard →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 24px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You're receiving this because you signed up for BrainExpo.
              <br/>
              <a href="${data.unsubscribeUrl}" style="color:#7c3aed;">Unsubscribe</a>
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
