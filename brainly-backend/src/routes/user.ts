import { Router, Request, Response } from "express";
import { requireAuth, getAuth } from "../middlewares/auth.js";
import { User } from "../models/user.js";
import { sendWelcomeEmail } from "../services/emailService.js";

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

export default router;