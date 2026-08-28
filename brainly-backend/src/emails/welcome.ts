import { C, FONT, button, emailShell, escapeHtml } from "./layout.js";

export interface WelcomeData {
  username: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
  settingsUrl: string;
}

const STEPS = [
  "Save a link — paste anything worth keeping.",
  "Tag it, or leave it in the Inbox for later.",
  "Group your saves into collections.",
];

export function buildWelcomeHtml(data: WelcomeData): string {
  const steps = STEPS.map(
    (step, index) => `
    <tr>
      <td width="24" valign="top" style="padding:0 0 10px;">
        <span style="font-size:13px;font-weight:600;color:${C.brand};font-family:${FONT};">${index + 1}</span>
      </td>
      <td valign="top" style="padding:0 0 10px;">
        <span style="font-size:14px;line-height:1.5;color:${C.textSecondary};font-family:${FONT};">${escapeHtml(step)}</span>
      </td>
    </tr>`,
  ).join("");

  const content = `
  <tr><td style="padding:24px 28px 8px;">
    <p style="margin:0 0 4px;font-size:18px;font-weight:500;color:${C.textPrimary};font-family:${FONT};">Welcome to BrainExpo</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${C.textSecondary};font-family:${FONT};">
      Hi ${escapeHtml(data.username)} — this is where the things you save stop disappearing.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:${C.tileBg};border-radius:8px;">
      <tr><td style="padding:16px 18px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:500;color:${C.textMuted};letter-spacing:0.04em;font-family:${FONT};">GETTING STARTED</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">${steps}</table>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:20px 28px 8px;">
    ${button("Open your brain", data.dashboardUrl, data.dashboardUrl)}
  </td></tr>`;

  return emailShell({
    preheader: "Your second brain starts here.",
    title: "Welcome to BrainExpo",
    content,
    unsubscribeUrl: data.unsubscribeUrl,
    settingsUrl: data.settingsUrl,
  });
}
