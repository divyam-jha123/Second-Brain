import { Router, Request, Response } from "express";
import { requireAuth, getAuth } from "../middlewares/auth.js";
import { EmailPreference } from "../models/emailPreference.js";
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

      let pref = await EmailPreference.findOne({ clerkUserId: userId });

      // Auto-create preferences if they don't exist yet
      if (!pref) {
        const user = await User.findOne({ clerkUserId: userId });
        const email = req.query.email as string || user?.email;
        
        if (!email) {
            // We can't auto-create without an email, but we shouldn't throw 404 on GET.
            // Just return default preferences conceptually.
            return res.json({
                preferences: { featureAnnouncements: true, weeklyDigest: true, unsubscribedAll: false }
            });
        }

        pref = await EmailPreference.create({
          clerkUserId: userId,
          email: email,
        });
      }

      return res.json({
        preferences: {
          featureAnnouncements: pref.featureAnnouncements,
          weeklyDigest: pref.weeklyDigest,
          unsubscribedAll: pref.unsubscribedAll,
        },
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
      const { userId } = getAuth(req);

      if (!userId) {
        return res.status(401).json({ msg: "Not authenticated" });
      }

      const { featureAnnouncements, weeklyDigest, email } = req.body;

      let targetEmail = email;
      if (!targetEmail) {
        const user = await User.findOne({ clerkUserId: userId });
        targetEmail = user?.email;
      }

      if (!targetEmail) {
        return res.status(400).json({ msg: "Email must be provided or synced first" });
      }

      const pref = await EmailPreference.findOneAndUpdate(
        { clerkUserId: userId },
        {
          clerkUserId: userId,
          email: targetEmail,
          ...(typeof featureAnnouncements === "boolean" && {
            featureAnnouncements,
          }),
          ...(typeof weeklyDigest === "boolean" && { weeklyDigest }),
        },
        { upsert: true, new: true },
      );

      return res.json({
        msg: "Preferences updated",
        preferences: {
          featureAnnouncements: pref.featureAnnouncements,
          weeklyDigest: pref.weeklyDigest,
          unsubscribedAll: pref.unsubscribedAll,
        },
      });
    } catch (error) {
      console.error("Error updating email preferences:", error);
      return res.status(500).json({ msg: "Error updating preferences", error });
    }
  },
);

// ─── POST /email/send-announcement ──────────────────────────────────
router.post(
  "/send-announcement",
  requireAuth(),
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
