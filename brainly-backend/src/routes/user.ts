import { Router, Request, Response } from "express";
import { requireAuth, getAuth } from "../middlewares/auth.js";
import { User } from "../models/user.js";

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

    // Upsert: create if doesn't exist, update if it does
    const user = await User.findOneAndUpdate(
      { clerkUserId: userId },
      { clerkUserId: userId, username, email },
      { upsert: true, new: true }
    );

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