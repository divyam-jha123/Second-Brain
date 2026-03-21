import { Router, Request, Response } from "express";
import { EmailPreference } from "../models/emailPreference.js";
import { verifyUnsubscribeToken } from "../services/emailService.js";

const router = Router();

// ─── POST /unsubscribe ──────────────────────────────────────────────
// Public route — no auth required (uses signed JWT token from email)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ msg: "Token is required" });
    }

    let payload: { userId: string; email: string; type: string };

    try {
      payload = verifyUnsubscribeToken(token);
    } catch {
      return res.status(400).json({ msg: "Invalid or expired token" });
    }

    const update: Record<string, boolean> = {};

    switch (payload.type) {
      case "all":
        update.unsubscribedAll = true;
        update.featureAnnouncements = false;
        update.weeklyDigest = false;
        break;
      case "digest":
        update.weeklyDigest = false;
        break;
      case "announcements":
        update.featureAnnouncements = false;
        break;
      default:
        return res.status(400).json({ msg: "Invalid unsubscribe type" });
    }

    await EmailPreference.findOneAndUpdate(
      { clerkUserId: payload.userId },
      update,
    );

    return res.json({
      msg: "Successfully unsubscribed",
      type: payload.type,
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return res.status(500).json({ msg: "Error processing unsubscribe" });
  }
});

export default router;
