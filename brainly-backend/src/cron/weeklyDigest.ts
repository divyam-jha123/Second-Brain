import cron from "node-cron";
import { EmailPreference } from "../models/emailPreference.js";
import { User } from "../models/user.js";
import { sendWeeklyDigest } from "../services/emailService.js";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** A digest sent less than this ago means this slot already fired. */
const RESEND_GUARD_MS = 6 * 24 * 60 * 60 * 1000;

/**
 * The weekday (0 = Sunday) and hour it currently is *for that user*.
 * An unknown or malformed timezone falls back to UTC rather than throwing and
 * taking the whole run down with it.
 */
export function localSlot(
  now: Date,
  timeZone: string,
): { day: number; hour: number } {
  let parts;
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      hour: "numeric",
      hour12: false,
    }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "long",
      hour: "numeric",
      hour12: false,
    }).formatToParts(now);
  }

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sunday";
  // hour12:false yields "24" at midnight in some ICU versions.
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;

  return { day: Math.max(0, WEEKDAYS.indexOf(weekday)), hour };
}

/** Whether this subscriber's chosen slot is the hour we are currently in. */
export function isDue(
  pref: {
    digestDay?: number;
    digestHour?: number;
    timezone?: string;
    lastDigestSentAt?: Date | null;
  },
  now: Date,
): boolean {
  const { day, hour } = localSlot(now, pref.timezone || "UTC");

  if (day !== (pref.digestDay ?? 0)) return false;
  if (hour !== (pref.digestHour ?? 9)) return false;

  // Guards against a restart or an overlapping tick sending twice.
  if (pref.lastDigestSentAt) {
    const since = now.getTime() - new Date(pref.lastDigestSentAt).getTime();
    if (since < RESEND_GUARD_MS) return false;
  }

  return true;
}

/**
 * Runs hourly and sends to whoever is currently at their chosen day and hour,
 * in their own timezone. A single global schedule cannot do this: 9:00 Sunday
 * in Asia/Kolkata and 9:00 Sunday in America/New_York are ten and a half hours
 * apart, so the job has to wake up every hour and ask who is due.
 */
export function startWeeklyDigestCron(): void {
  cron.schedule("0 * * * *", () => runWeeklyDigest());

  console.log("[cron] Weekly digest scheduled (hourly, per-user local time)");
}

export async function runWeeklyDigest(now: Date = new Date()): Promise<{
  sent: number;
  skipped: number;
  failed: number;
}> {
  const result = { sent: 0, skipped: 0, failed: 0 };

  try {
    const subscribers = await EmailPreference.find({
      weeklyDigest: true,
      unsubscribedAll: false,
    }).lean();

    const due = subscribers.filter((pref) => isDue(pref, now));

    if (due.length === 0) return result;

    console.log(`[cron] ${due.length} subscriber(s) due this hour`);

    for (const pref of due) {
      try {
        const user = await User.findOne({
          clerkUserId: pref.clerkUserId,
        }).lean();

        if (!user) {
          console.warn(`[cron] No user for clerkUserId: ${pref.clerkUserId}`);
          result.skipped++;
          continue;
        }

        const sent = await sendWeeklyDigest(
          pref.clerkUserId,
          pref.email,
          user.username,
          {
            timeZone: pref.timezone,
            sections: pref.digestSections,
          },
        );

        if (sent) {
          result.sent++;
          console.log(`[cron] Digest sent to ${pref.email}`);
        } else {
          // Nothing saved this week — silence beats an empty email.
          result.skipped++;
        }
      } catch (err) {
        result.failed++;
        console.error(`[cron] Failed to send digest to ${pref.email}:`, err);
      }
    }
  } catch (err) {
    console.error("[cron] Weekly digest job failed:", err);
  }

  return result;
}
