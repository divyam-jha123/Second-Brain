import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin, getAuth } from "../middlewares/auth.js";
import { EmailPreference } from "../models/emailPreference.js";
import {
  DEFAULT_PREFS,
  getOrCreateEmailPrefs,
  serializePrefs,
} from "../services/emailPreferences.js";
import { User } from "../models/user.js";
import { sendFeatureAnnouncement } from "../services/emailService.js";

const router = Router();

// ─── GET /email/preferences ─────────────────────────────────────────
router.get(
  "/preferences",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      const { userId } = getAuth(req);

      if (!userId) {
        return res.status(401).json({ msg: "Not authenticated" });
      }

      const pref = await getOrCreateEmailPrefs(userId, {
        email: req.query.email as string | undefined,
        timezone: req.query.timezone as string | undefined,
      });

      // No address on file yet — report defaults rather than 404 a settings page.
      return res.json({
        preferences: pref ? serializePrefs(pref) : DEFAULT_PREFS,
      });
    } catch (error) {
      console.error("Error fetching email preferences:", error);
      return res.status(500).json({ msg: "Error fetching preferences", error });
    }
  },
);

// ─── PUT /email/preferences ─────────────────────────────────────────
router.put(
  "/preferences",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      // Identity comes from the session only; a user id in the body is ignored.
      const { userId } = getAuth(req);

      if (!userId) {
        return res.status(401).json({ msg: "Not authenticated" });
      }

      const {
        featureAnnouncements,
        weeklyDigest,
        digestSections,
        digestDay,
        digestHour,
        timezone,
        email,
      } = req.body;

      let targetEmail = email;
      if (!targetEmail) {
        const user = await User.findOne({ clerkUserId: userId });
        targetEmail = user?.email;
      }

      if (!targetEmail) {
        return res.status(400).json({ msg: "Email must be provided or synced first" });
      }

      const update: Record<string, unknown> = {
        clerkUserId: userId,
        email: targetEmail,
        ...(typeof featureAnnouncements === "boolean" && { featureAnnouncements }),
        ...(typeof digestDay === "number" && { digestDay }),
        ...(typeof digestHour === "number" && { digestHour }),
        ...(typeof timezone === "string" && timezone && { timezone }),
      };

      // Section checkboxes only pick what a digest contains. Clearing all three
      // is not an unsubscribe — that is the weekly toggle's job alone.
      if (digestSections && typeof digestSections === "object") {
        for (const key of ["savedThisWeek", "untaggedNudge", "recallQuestions"]) {
          if (typeof digestSections[key] === "boolean") {
            update[`digestSections.${key}`] = digestSections[key];
          }
        }
      }

      if (typeof weeklyDigest === "boolean") {
        update.weeklyDigest = weeklyDigest;
        if (weeklyDigest) {
          update.consentedAt = new Date();
          update.unsubscribedAt = null;
          update.unsubscribedAll = false;
        } else {
          update.unsubscribedAt = new Date();
        }
      }

      const pref = await EmailPreference.findOneAndUpdate(
        { clerkUserId: userId },
        update,
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      return res.json({
        msg: "Preferences updated",
        preferences: serializePrefs(pref),
      });
    } catch (error) {
      console.error("Error updating email preferences:", error);
      return res.status(500).json({ msg: "Error updating preferences", error });
    }
  },
);

// ─── POST /email/send-now ───────────────────────────────────────────
// TODO: send the weekly digest on demand. The cron and the digest template are
// a separate task; the settings page wires the button against this contract.
router.post("/send-now", requireAuth(), async (req: Request, res: Response) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ msg: "Not authenticated" });
  }

  return res.status(501).json({ msg: "Preview sending isn't built yet" });
});

// ─── POST /email/send-announcement ──────────────────────────────────
router.post(
  "/send-announcement",
  requireAuth(),
  requireAdmin(),
  async (req: Request, res: Response) => {
    try {
      const { subject, title, body, ctaText, ctaUrl } = req.body;

      if (!subject || !title || !body) {
        return res
          .status(400)
          .json({ msg: "subject, title, and body are required" });
      }

      const result = await sendFeatureAnnouncement({
        subject,
        title,
        body,
        ctaText,
        ctaUrl,
      });

      return res.json({
        msg: "Announcement sent",
        ...result,
      });
    } catch (error) {
      console.error("Error sending announcement:", error);
      return res
        .status(500)
        .json({ msg: "Error sending announcement", error });
    }
  },
);

export default router;
