import { C, FONT, button, emailShell, escapeHtml } from "./layout.js";

export interface AnnouncementData {
  username: string;
  subject: string;
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeUrl: string;
  dashboardUrl: string;
  settingsUrl: string;
}

export function buildAnnouncementHtml(data: AnnouncementData): string {
  // Author-supplied. Escaped first, then newlines become breaks — doing it the
  // other way round would let the author inject markup.
  const body = escapeHtml(data.body).replace(/\n/g, "<br/>");

  const ctaBlock = data.ctaUrl
    ? `<tr><td style="padding:4px 28px 8px;">
         ${button(data.ctaText || "Check it out", data.ctaUrl, data.dashboardUrl)}
       </td></tr>`
    : "";

  const content = `
  <tr><td style="padding:24px 28px 8px;">
    <p style="margin:0 0 4px;font-size:18px;font-weight:500;color:${C.textPrimary};font-family:${FONT};">${escapeHtml(data.title)}</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${C.textSecondary};font-family:${FONT};">
      Hi ${escapeHtml(data.username)},
    </p>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${C.textSecondary};font-family:${FONT};">${body}</p>
  </td></tr>
  ${ctaBlock}`;

  return emailShell({
    preheader: data.title,
    title: data.subject,
    content,
    unsubscribeUrl: data.unsubscribeUrl,
    unsubscribeLabel: "Unsubscribe from announcements",
    settingsUrl: data.settingsUrl,
  });
}
