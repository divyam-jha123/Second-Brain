import express from "express";
import cors from "cors";
import { clerkMiddleware } from "./middlewares/auth.js";
import notesRouter from "./routes/notes.js";
import userRouter from "./routes/user.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  const allowlist = (
    process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",")
      : [
          // production
          "https://brainexpo.me",
          "https://www.brainexpo.me",
          // local dev
          "http://localhost:5173",
          "http://localhost:3000",
        ]
  )
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowlist.length === 0 || allowlist.includes(origin)) {
          return cb(null, true);
        }
        // For now, don't hard-fail CORS; just deny the specific origin.
        return cb(null, false);
      },
      credentials: true,
    }),
  );
  app.use(clerkMiddleware());

  app.use("/notes", notesRouter);
  app.use("/user", userRouter);

  return app;
}

