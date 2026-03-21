import { Resend } from "resend";
import jwt from "jsonwebtoken";
import { EmailPreference } from "../models/emailPreference.js";
import { Notes } from "../models/notes.js";
import { User } from "../models/user.js";
import {
  buildWeeklyDigestHtml,
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

export async function sendWeeklyDigest(
  userId: string,
  email: string,
  username: string,
): Promise<void> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentNotes = await Notes.find({
    userId,
    createdAt: { $gte: oneWeekAgo },
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const templateData: WeeklyDigestData = {
    username,
    noteCount: recentNotes.length,
    notes: recentNotes.map((n) => ({
      title: n.title,
      content: n.content,
      createdAt: new Date(n.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    })),
    unsubscribeUrl: generateUnsubscribeUrl(userId, email, "digest"),
    dashboardUrl: `${CORS_ORIGINS}/dashboard`,
  };

  const html = buildWeeklyDigestHtml(templateData);

  const { error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `🧠 Your Weekly Brain Digest — ${recentNotes.length} note${recentNotes.length !== 1 ? "s" : ""} saved`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message} (${error.name})`);
  }

  await EmailPreference.findOneAndUpdate(
    { clerkUserId: userId },
    { lastDigestSentAt: new Date() },
  );
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
