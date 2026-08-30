import { Router, Request, Response } from "express";
import { requireAuth, getAuth } from "../middlewares/auth.js";
import { User } from "../models/user.js";
import { Collection } from "../models/collection.js";
import { EmailPreference } from "../models/emailPreference.js";
import { sendWelcomeEmail } from "../services/emailService.js";
import { normalizeTags } from "../utils/util.js";

const router = Router();

// Sync user from Clerk to MongoDB (called after first sign-in)
router.post("/sync", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        msg: "User not authenticated",
      });
    }

    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        msg: "Please provide username and email",
      });
    }

    // Check if this is a brand new user
    const existingUser = await User.findOne({ clerkUserId: userId });
    const isNewUser = !existingUser;

    const user = await User.findOneAndUpdate(
      { clerkUserId: userId },
      { clerkUserId: userId, username, email },
      { upsert: true, new: true }
    );

    // Send welcome email only for first-time signups
    if (isNewUser) {
      sendWelcomeEmail(userId, email, username).catch((err) =>
        console.error("Welcome email failed:", err),
      );
    }

    return res.status(200).json({
      msg: "User synced successfully",
      user,
    });
  } catch (error) {
    console.error("User sync error:", error);
    return res.status(500).json({
      msg: "Error syncing user",
      error,
    });
  }
});

// ─── GET /user/me ───────────────────────────────────────────────────
// Drives the onboarding gate. A user with no document yet has simply never
// been onboarded, so this answers with nulls rather than 404.
router.get("/me", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    const user = await User.findOne({ clerkUserId: userId });

    return res.json({
      msg: "success",
      user: {
        username: user?.username ?? null,
        email: user?.email ?? null,
        topics: user?.topics ?? [],
        onboardingCompletedAt: user?.onboardingCompletedAt ?? null,
        tourCompletedAt: user?.tourCompletedAt ?? null,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ msg: "Error fetching user", error });
  }
});

// ─── POST /user/onboarding ──────────────────────────────────────────
// Seeds collections and tag suggestions from the picked topics, stores the
// weekly-email choices, and stamps the flow as done. Idempotent: re-running it
// will not duplicate collections.
router.post("/onboarding", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    const { skip, topics, weeklyEmail } = req.body ?? {};

    const user = await User.findOne({ clerkUserId: userId });
    if (!user) {
      // /user/sync owns creation, so that the welcome email still fires once.
      return res.status(409).json({ msg: "Sync the user before onboarding" });
    }

    const picked = skip ? [] : normalizeTags(topics);
    const created: string[] = [];

    for (const topic of picked) {
      // One collection per topic. A name the user already has is left alone.
      const exists = await Collection.findOne({ userId, name: topic });
      if (exists) continue;

      const order = await Collection.countDocuments({ userId });
      await Collection.create({ userId, name: topic, order });
      created.push(topic);
    }

    if (!skip && weeklyEmail && typeof weeklyEmail === "object") {
      const sections = weeklyEmail.sections ?? {};
      const update: Record<string, unknown> = {
        weeklyDigest: Boolean(weeklyEmail.enabled),
        email: user.email,
      };

      if (typeof sections.savedThisWeek === "boolean") {
        update["digestSections.savedThisWeek"] = sections.savedThisWeek;
      }
      if (typeof sections.untaggedNudge === "boolean") {
        update["digestSections.untaggedNudge"] = sections.untaggedNudge;
      }
      if (typeof sections.recallQuestions === "boolean") {
        update["digestSections.recallQuestions"] = sections.recallQuestions;
      }
      if (Number.isInteger(weeklyEmail.day)) update.digestDay = weeklyEmail.day;
      if (Number.isInteger(weeklyEmail.hour)) update.digestHour = weeklyEmail.hour;
      if (typeof weeklyEmail.timezone === "string") {
        update.timezone = weeklyEmail.timezone;
      }

      await EmailPreference.findOneAndUpdate(
        { clerkUserId: userId },
        { $set: update, $setOnInsert: { clerkUserId: userId } },
        { upsert: true, new: true },
      );
    }

    user.topics = picked;
    user.onboardingCompletedAt = new Date();
    await user.save();

    return res.json({
      msg: "success",
      collectionsCreated: created,
      onboardingCompletedAt: user.onboardingCompletedAt,
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return res.status(500).json({ msg: "Error completing onboarding", error });
  }
});

// ─── POST /user/tour-complete ───────────────────────────────────────
// Stamps the dashboard tour as seen, whether it was finished or skipped.
router.post("/tour-complete", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    const user = await User.findOneAndUpdate(
      { clerkUserId: userId },
      { tourCompletedAt: new Date() },
      { new: true },
    );

    if (!user) {
      return res.status(409).json({ msg: "Sync the user before completing the tour" });
    }

    return res.json({ msg: "success", tourCompletedAt: user.tourCompletedAt });
  } catch (error) {
    console.error("Tour completion error:", error);
    return res.status(500).json({ msg: "Error completing tour", error });
  }
});

export default router;