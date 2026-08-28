import { EmailPreference } from "../models/emailPreference.js";
import type { IEmailPreference } from "../models/emailPreference.js";
import { User } from "../models/user.js";

type Seed = {
  /** Captured from the browser, never asked for. */
  timezone?: string;
  email?: string;
};

/**
 * Every read of a user's email preferences goes through here, so the row exists
 * from the first visit to Settings rather than the first write.
 */
export const getOrCreateEmailPrefs = async (
  userId: string,
  seed: Seed = {},
): Promise<IEmailPreference | null> => {
  const existing = await EmailPreference.findOne({ clerkUserId: userId });

  if (existing) {
    // The browser knows the zone; adopt it if we were still defaulting to UTC.
    if (seed.timezone && existing.timezone !== seed.timezone) {
      if (existing.timezone === "UTC") {
        existing.timezone = seed.timezone;
        await existing.save();
      }
    }
    return existing;
  }

  const user = await User.findOne({ clerkUserId: userId });
  const email = seed.email ?? user?.email;

  // Without an address there is nothing to send to, so the caller falls back to
  // defaults rather than writing a row it can't use.
  if (!email) return null;

  return EmailPreference.create({
    clerkUserId: userId,
    email,
    ...(seed.timezone ? { timezone: seed.timezone } : {}),
  });
};

/** The shape the settings page reads. */
export const serializePrefs = (pref: IEmailPreference) => ({
  featureAnnouncements: pref.featureAnnouncements,
  weeklyDigest: pref.weeklyDigest,
  unsubscribedAll: pref.unsubscribedAll,
  digestSections: pref.digestSections,
  digestDay: pref.digestDay,
  digestHour: pref.digestHour,
  timezone: pref.timezone,
  consentedAt: pref.consentedAt ?? null,
  unsubscribedAt: pref.unsubscribedAt ?? null,
  lastDigestSentAt: pref.lastDigestSentAt,
  email: pref.email,
});

export const DEFAULT_PREFS = {
  featureAnnouncements: true,
  weeklyDigest: true,
  unsubscribedAll: false,
  digestSections: {
    savedThisWeek: true,
    untaggedNudge: true,
    recallQuestions: false,
  },
  digestDay: 0,
  digestHour: 9,
  timezone: "UTC",
  consentedAt: null,
  unsubscribedAt: null,
  lastDigestSentAt: null,
  email: null,
};
