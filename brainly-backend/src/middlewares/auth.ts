import type { Request, Response, NextFunction } from "express";
import {
  clerkMiddleware as realClerkMiddleware,
  requireAuth as realRequireAuth,
  getAuth as realGetAuth,
} from "@clerk/express";

type AuthLike = { userId: string | null };

const isTest = process.env.NODE_ENV === "test";

function testRequireAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.header("x-user-id");
    if (!userId) {
      return res.status(401).json({ msg: "Not authenticated" });
    }
    (req as Request & { __testAuth?: AuthLike }).__testAuth = { userId };
    next();
  };
}

function testGetAuth(req: Request): AuthLike {
  return ((req as Request & { __testAuth?: AuthLike }).__testAuth ?? { userId: null }) as AuthLike;
}

function testClerkMiddleware() {
  return (_req: Request, _res: Response, next: NextFunction) => next();
}

export const clerkMiddleware = isTest ? testClerkMiddleware : realClerkMiddleware;
export const requireAuth = isTest ? testRequireAuth : realRequireAuth;
export const getAuth = isTest ? testGetAuth : realGetAuth;
/**
 * Admin allowlist, from ADMIN_USER_IDS (comma-separated Clerk user ids).
 *
 * requireAuth() only proves someone is signed in. Routes that act on *every*
 * user — sending mail to the whole base, for one — need more than that, or any
 * account that can sign up can use them.
 *
 * Read at call time, not module load, so tests and deploys can change it
 * without a restart.
 */
export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;

  const allowlist = (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  // An empty allowlist admits nobody. Failing closed matters more here than
  // convenience: the alternative is a route that mails every user.
  return allowlist.includes(userId);
}

export function requireAdmin() {
  return (req: Request, res: Response, next: NextFunction) => {
    const { userId } = (isTest ? testGetAuth : realGetAuth)(req) as AuthLike;

    if (!isAdmin(userId)) {
      // 404, not 403 — an unauthorised caller learns nothing about the route.
      return res.status(404).json({ msg: "Not found" });
    }

    next();
  };
}
