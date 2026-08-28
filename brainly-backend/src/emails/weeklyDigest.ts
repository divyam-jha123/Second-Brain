/**
 * The weekly digest. Chrome and colours come from ./layout; this file owns the
 * stats, the saves list and the nudge. Type is shown with a colour dot because
 * icon fonts never load in email.
 */

import {
  C,
  FONT,
  button,
  emailShell,
  escapeHtml,
  safeUrl,
} from "./layout.js";

export type DigestNoteType = "video" | "tweet" | "linkedin" | "document";

const TYPE_DOT: Record<DigestNoteType, string> = {
  video: "#EF4444",
  tweet: "#18181B",
  linkedin: "#0A66C2",
  document: "#A1A1AA",
};

export interface DigestNote {
  title: string;
  url?: string;
  type: DigestNoteType;
  /** Domain the save came from, e.g. "youtube.com". */
  source?: string;
  /** Weekday it was saved, in the reader's own timezone. */
  savedOn: string;
}

export interface WeeklyDigestData {
  username: string;
  /** Human range for the header, e.g. "18–24 Aug". */
  dateRange: string;
  savedThisWeek: number;
  untaggedThisWeek: number;
  totalSaved: number;
  notes: DigestNote[];
  /** Saves beyond the ones listed. */
  moreCount: number;
  recallQuestions: string[];
  /** Per-user toggles; a section that is off never renders. */
  sections: {
    savedThisWeek: boolean;
    untaggedNudge: boolean;
    recallQuestions: boolean;
  };
  unsubscribeUrl: string;
  dashboardUrl: string;
  settingsUrl: string;
}

function statTile(label: string, value: number): string {
  return `
    <td width="33%" style="background:${C.tileBg};border-radius:8px;padding:12px;" valign="top">
      <p style="margin:0 0 4px;font-size:12px;color:${C.textSecondary};font-family:${FONT};">${label}</p>
      <p style="margin:0;font-size:22px;font-weight:500;color:${C.textPrimary};font-family:${FONT};">${value}</p>
    </td>`;
}

function noteRow(note: DigestNote, dashboardUrl: string): string {
  const meta = [note.source, note.savedOn]
    .filter((part): part is string => Boolean(part))
    .map(escapeHtml)
    .join(" · ");
  const href = safeUrl(note.url, dashboardUrl);

  return `
    <tr>
      <td style="border-top:1px solid ${C.border};padding:12px 0;" valign="top">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td width="20" valign="top" style="padding-top:5px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:8px;background:${TYPE_DOT[note.type]};"></span>
            </td>
            <td valign="top">
              <p style="margin:0 0 2px;font-size:14px;line-height:1.45;font-family:${FONT};">
                <a href="${href}" style="color:${C.textPrimary};text-decoration:none;">${escapeHtml(note.title)}</a>
              </p>
              <p style="margin:0;font-size:12px;color:${C.textMuted};font-family:${FONT};">${meta}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function buildWeeklyDigestHtml(data: WeeklyDigestData): string {
  const showSaves = data.sections.savedThisWeek && data.notes.length > 0;
  const showRecall =
    data.sections.recallQuestions && data.recallQuestions.length > 0;
  const showNudge = data.sections.untaggedNudge && data.untaggedThisWeek > 0;

  const savesBlock = showSaves
    ? `
      <tr><td style="padding:0 28px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:500;color:${C.textMuted};letter-spacing:0.04em;font-family:${FONT};">THIS WEEK'S SAVES</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
          ${data.notes.map((n) => noteRow(n, data.dashboardUrl)).join("")}
          ${
            data.moreCount > 0
              ? `<tr><td style="border-top:1px solid ${C.border};padding:12px 0 4px;">
                   <a href="${escapeHtml(data.dashboardUrl)}" style="font-size:13px;color:${C.link};text-decoration:none;font-family:${FONT};">+ ${data.moreCount} more</a>
                 </td></tr>`
              : ""
          }
        </table>
      </td></tr>`
    : "";

  const recallBlock = showRecall
    ? `
      <tr><td style="padding:24px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:${C.recallBg};border-radius:8px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:500;color:${C.recallLabel};letter-spacing:0.04em;font-family:${FONT};">DO YOU STILL REMEMBER</p>
            ${data.recallQuestions
              .map(
                (q) =>
                  `<p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:${C.recallText};font-family:${FONT};">${escapeHtml(q)}</p>`,
              )
              .join("")}
          </td></tr>
        </table>
      </td></tr>`
    : "";

  const nudgeBlock = showNudge
    ? `
      <tr><td style="padding:24px 28px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border:1px solid ${C.border};border-radius:8px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${C.textSecondary};font-family:${FONT};">
              ${data.untaggedThisWeek} item${data.untaggedThisWeek === 1 ? "" : "s"} from this week ${data.untaggedThisWeek === 1 ? "has" : "have"} no tags. Two minutes now saves you a search later.
            </p>
            <a href="${escapeHtml(data.dashboardUrl)}" style="display:inline-block;background:${C.cta};color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;padding:10px 20px;border-radius:8px;font-family:${FONT};">Tag them now</a>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  // Nothing to say is a reason not to write, so the caller checks this too.
  const emptyBlock =
    !showSaves && !showRecall && !showNudge
      ? `
      <tr><td style="padding:0 28px 8px;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:${C.textSecondary};font-family:${FONT};">
          Nothing new this week. Your brain is still here when you need it.
        </p>
      </td></tr>`
      : "";

  const content = `
  <tr><td style="padding:24px 28px 8px;">
    <p style="margin:0 0 4px;font-size:18px;font-weight:500;color:${C.textPrimary};font-family:${FONT};">Your week, organized</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${C.textSecondary};font-family:${FONT};">
      You saved ${data.savedThisWeek} thing${data.savedThisWeek === 1 ? "" : "s"}. Here's what's worth a second look.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:separate;border-spacing:10px 0;margin:0 -10px 14px;">
      <tr>
        ${statTile("Saved", data.savedThisWeek)}
        ${statTile("Untagged", data.untaggedThisWeek)}
        ${statTile("Total", data.totalSaved)}
      </tr>
    </table>
  </td></tr>

  ${savesBlock}
  ${recallBlock}
  ${nudgeBlock}
  ${emptyBlock}`;

  return emailShell({
    preheader: `You saved ${data.savedThisWeek} thing${data.savedThisWeek === 1 ? "" : "s"} this week.`,
    title: "Your week, organized",
    headerMeta: data.dateRange,
    content,
    unsubscribeUrl: data.unsubscribeUrl,
    unsubscribeLabel: "Unsubscribe",
    settingsUrl: data.settingsUrl,
  });
}
