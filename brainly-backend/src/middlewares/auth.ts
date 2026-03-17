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