import cron from "node-cron";
import { EmailPreference } from "../models/emailPreference.js";
import { User } from "../models/user.js";
import { sendWeeklyDigest } from "../services/emailService.js";

/**
 * Runs every Monday at 9:00 AM UTC.
 * Sends a weekly digest email to all subscribed users.
 */
export function startWeeklyDigestCron(): void {
  // cron: minute(0) hour(9) day-of-month(*) month(*) day-of-week(1=Monday)
  cron.schedule("0 9 * * 1", async () => {
    console.log("[cron] Weekly digest job started");

    try {
      const subscribers = await EmailPreference.find({
        weeklyDigest: true,
        unsubscribedAll: false,
      }).lean();

      console.log(
        `[cron] Sending weekly digest to ${subscribers.length} subscriber(s)`,
      );

      for (const pref of subscribers) {
        try {
          const user = await User.findOne({
            clerkUserId: pref.clerkUserId,
          }).lean();

          if (!user) {
            console.warn(
              `[cron] User not found for clerkUserId: ${pref.clerkUserId}`,
            );
            continue;
          }

          await sendWeeklyDigest(
            pref.clerkUserId,
            pref.email,
            user.username,
          );

          console.log(`[cron] Digest sent to ${pref.email}`);
        } catch (err) {
          console.error(
            `[cron] Failed to send digest to ${pref.email}:`,
            err,
          );
        }
      }

      console.log("[cron] Weekly digest job completed");
    } catch (err) {
      console.error("[cron] Weekly digest job failed:", err);
    }
  });

  console.log("[cron] Weekly digest cron scheduled (Monday 9:00 AM UTC)");
}
