import { Resend } from "resend";
import jwt from "jsonwebtoken";
import { EmailPreference } from "../models/emailPreference.js";
import { Notes } from "../models/notes.js";
import { User } from "../models/user.js";
import {
  buildWeeklyDigestHtml,
  type DigestNoteType,
  type WeeklyDigestData,
} from "../emails/weeklyDigest.js";
import {
  buildAnnouncementHtml,
  type AnnouncementData,
} from "../emails/featureAnnouncement.js";
import {
  buildWelcomeHtml,
  type WelcomeData,
} from "../emails/welcome.js";

// Lazy-init so tests don't crash when RESEND_API_KEY is absent
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const EMAIL_FROM = process.env.EMAIL_FROM || "BrainExpo <onboarding@resend.dev>";
const CORS_ORIGINS = process.env.CORS_ORIGINS || "http://localhost:5173";
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || "default-secret";

// ─── Unsubscribe URL ────────────────────────────────────────────────

export function generateUnsubscribeToken(
  userId: string,
  email: string,
  type: "all" | "digest" | "announcements",
): string {
  return jwt.sign({ userId, email, type }, UNSUBSCRIBE_SECRET, {
    expiresIn: "90d",
  });
}

export function verifyUnsubscribeToken(token: string): {
  userId: string;
  email: string;
  type: "all" | "digest" | "announcements";
} {
  return jwt.verify(token, UNSUBSCRIBE_SECRET) as {
    userId: string;
    email: string;
    type: "all" | "digest" | "announcements";
  };
}

export function generateUnsubscribeUrl(
  userId: string,
  email: string,
  type: "all" | "digest" | "announcements",
): string {
  const token = generateUnsubscribeToken(userId, email, type);
  return `${CORS_ORIGINS}/unsubscribe?token=${encodeURIComponent(token)}&type=${type}`;
}

// ─── Weekly Digest ──────────────────────────────────────────────────

const NOTES_IN_DIGEST = 6;

function noteType(content: string | undefined): DigestNoteType {
  if (content?.includes("youtube") || content?.includes("youtu.be")) return "video";
  if (content?.includes("twitter") || content?.includes("x.com")) return "tweet";
  if (content?.includes("linkedin.com")) return "linkedin";
  return "document";
}

/** "18–24 Aug", or "28 Aug – 3 Sep" when the week straddles two months. */
function formatRange(start: Date, end: Date, timeZone: string): string {
  const day = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric" }).format(d);
  const month = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", { timeZone, month: "short" }).format(d);

  return month(start) === month(end)
    ? `${day(start)}–${day(end)} ${month(end)}`
    : `${day(start)} ${month(start)} – ${day(end)} ${month(end)}`;
}

export async function sendWeeklyDigest(
  userId: string,
  email: string,
  username: string,
  options: {
    timeZone?: string;
    sections?: {
      savedThisWeek: boolean;
      untaggedNudge: boolean;
      recallQuestions: boolean;
    };
  } = {},
): Promise<boolean> {
  const timeZone = options.timeZone || "UTC";
  const sections = options.sections ?? {
    savedThisWeek: true,
    untaggedNudge: true,
    recallQuestions: false,
  };

  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weekNotes = await Notes.find({
    userId,
    createdAt: { $gte: oneWeekAgo },
  })
    .sort({ createdAt: -1 })
    .lean();

  const untaggedThisWeek = weekNotes.filter((n) => !n.tags?.length).length;
  const totalSaved = await Notes.countDocuments({ userId });

  const listed = sections.savedThisWeek ? weekNotes.slice(0, NOTES_IN_DIGEST) : [];

  const templateData: WeeklyDigestData = {
    username,
    dateRange: formatRange(oneWeekAgo, now, timeZone),
    savedThisWeek: weekNotes.length,
    untaggedThisWeek,
    totalSaved,
    notes: listed.map((n) => ({
      title: n.title,
      url: n.content,
      type: noteType(n.content),
      source: n.sourceDomain,
      // Weekday in the reader's timezone, not the server's.
      savedOn: new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "long",
      }).format(new Date(n.createdAt)),
    })),
    moreCount: Math.max(0, weekNotes.length - listed.length),
    // Generating these needs an LLM pass over saved content; until that exists
    // the section stays empty and therefore never renders.
    recallQuestions: [],
    sections,
    unsubscribeUrl: generateUnsubscribeUrl(userId, email, "digest"),
    dashboardUrl: `${CORS_ORIGINS}/dashboard`,
    settingsUrl: `${CORS_ORIGINS}/settings/email`,
  };

  // An empty week is not worth an email.
  if (weekNotes.length === 0) {
    return false;
  }

  const html = buildWeeklyDigestHtml(templateData);

  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Your week, organized — ${weekNotes.length} save${weekNotes.length === 1 ? "" : "s"}`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message} (${error.name})`);
  }

  await EmailPreference.findOneAndUpdate(
    { clerkUserId: userId },
    { lastDigestSentAt: new Date() },
  );

  return true;
}

// ─── Feature Announcement ───────────────────────────────────────────

export async function sendFeatureAnnouncement(params: {
  subject: string;
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}): Promise<{ sent: number; errors: number; skipped: number; details?: any }> {
  // 1. Get ALL users from the database
  const allUsers = await User.find({}).lean();

  // 2. Get the explicit opt-out list (users who turned off announcements or unsubscribed)
  const optedOut = await EmailPreference.find({
    $or: [
      { featureAnnouncements: false },
      { unsubscribedAll: true },
    ],
  }).lean();

  const optedOutIds = new Set(optedOut.map((p) => p.clerkUserId));

  let sent = 0;
  let errors = 0;
  let skipped = 0;
  let lastError = null;

  for (const user of allUsers) {
    // Skip users who explicitly unsubscribed
    if (optedOutIds.has(user.clerkUserId)) {
      skipped++;
      continue;
    }

    // Skip users without an email address
    if (!user.email) {
      skipped++;
      continue;
    }

    try {
      const templateData: AnnouncementData = {
        username: user.username || "there",
        subject: params.subject,
        title: params.title,
        body: params.body,
        ctaText: params.ctaText,
        ctaUrl: params.ctaUrl,
        dashboardUrl: `${CORS_ORIGINS}/dashboard`,
        settingsUrl: `${CORS_ORIGINS}/settings/email`,
        unsubscribeUrl: generateUnsubscribeUrl(
          user.clerkUserId,
          user.email,
          "announcements",
        ),
      };

      const html = buildAnnouncementHtml(templateData);

      const { error } = await getResend().emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: params.subject,
        html,
      });

      if (error) {
        console.error(
          `Failed to send announcement to ${user.email}:`,
          error,
        );
        errors++;
        lastError = error;
      } else {
        sent++;
      }
    } catch (err) {
      console.error(
        `Failed to process announcement for ${user.email}:`,
        err,
      );
      errors++;
      lastError = err;
    }
  }

  if (errors > 0 && sent === 0 && allUsers.length > 0) {
    throw new Error((lastError as any)?.message || "Failed to send all emails");
  }

  return { sent, errors, skipped };
}

// ─── Welcome Email ──────────────────────────────────────────────────

export async function sendWelcomeEmail(
  userId: string,
  email: string,
  username: string,
): Promise<void> {
  const templateData: WelcomeData = {
    username,
    dashboardUrl: `${CORS_ORIGINS}/dashboard`,
    settingsUrl: `${CORS_ORIGINS}/settings/email`,
    unsubscribeUrl: generateUnsubscribeUrl(userId, email, "all"),
  };

  const html = buildWelcomeHtml(templateData);

  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "🧠 Welcome to BrainExpo — Your second brain starts here!",
    html,
  });

  if (error) {
    console.error(`Failed to send welcome email to ${email}:`, error);
  } else {
    console.log(`Welcome email sent to ${email}`);
  }
}
