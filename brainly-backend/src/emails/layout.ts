/**
 * Shared chrome for every BrainExpo email.
 *
 * Email clients are not browsers, so everything here is table layout and
 * literal hex: Gmail strips CSS custom properties, Outlook's Word engine
 * ignores flexbox and grid, and webfonts are blocked. Templates compose these
 * helpers rather than hand-rolling a shell, which is how the digest, the
 * announcement and the welcome mail drifted apart in the first place.
 */

export const C = {
  pageBg: "#F4F4F5",
  cardBg: "#FFFFFF",
  tileBg: "#FAFAFA",
  border: "#E4E4E7",
  textPrimary: "#18181B",
  textSecondary: "#52525B",
  textMuted: "#A1A1AA",
  brand: "#7F77DD",
  link: "#534AB7",
  cta: "#8C21F1",
  recallBg: "#EEEDFE",
  recallLabel: "#3C3489",
  recallText: "#26215C",
};

export const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Only http(s) survives. Anything else — javascript:, data:, a stray quote
 * that would break out of the href attribute — falls back.
 */
export function safeUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? escapeHtml(url)
      : fallback;
  } catch {
    return fallback;
  }
}

export function button(label: string, url: string, fallbackUrl: string): string {
  return `<a href="${safeUrl(url, fallbackUrl)}" style="display:inline-block;background:${C.cta};color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;padding:10px 20px;border-radius:8px;font-family:${FONT};">${escapeHtml(label)}</a>`;
}

export interface ShellOptions {
  /** Preview line shown in the inbox list, hidden in the body. */
  preheader: string;
  title: string;
  /** Small right-aligned text in the header, e.g. a date range. */
  headerMeta?: string;
  /** Table rows — each block is its own <tr>. */
  content: string;
  unsubscribeUrl: string;
  unsubscribeLabel?: string;
  settingsUrl: string;
}

export function emailShell(options: ShellOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="color-scheme" content="light"/>
<title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:${C.pageBg};font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.preheader)}</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:${C.pageBg};padding:32px 0;">
<tr><td align="center">

<table width="560" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:560px;max-width:560px;background:${C.cardBg};border:1px solid ${C.border};border-radius:12px;">

  <tr><td style="padding:20px 28px;border-bottom:1px solid ${C.border};">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
      <tr>
        <td align="left" style="font-size:15px;font-weight:500;color:${C.textPrimary};font-family:${FONT};">
          <span style="color:${C.brand};">&#10022;</span>&nbsp;BrainExpo
        </td>
        ${
          options.headerMeta
            ? `<td align="right" style="font-size:12px;color:${C.textMuted};font-family:${FONT};">${escapeHtml(options.headerMeta)}</td>`
            : ""
        }
      </tr>
    </table>
  </td></tr>

  ${options.content}

  <tr><td style="padding:24px 28px;border-top:1px solid ${C.border};text-align:center;">
    <p style="margin:0 0 8px;font-size:12px;color:${C.textMuted};font-family:${FONT};">brainexpo.me · Your internet, organized</p>
    <p style="margin:0;font-size:12px;color:${C.textMuted};font-family:${FONT};">
      <a href="${escapeHtml(options.settingsUrl)}" style="color:${C.textSecondary};text-decoration:none;">Email settings</a>
      &nbsp;·&nbsp;
      <a href="${escapeHtml(options.unsubscribeUrl)}" style="color:${C.textSecondary};text-decoration:none;">${escapeHtml(options.unsubscribeLabel || "Unsubscribe")}</a>
    </p>
  </td></tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}
