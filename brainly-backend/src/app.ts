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
        // Non-browser / same-origin requests may have no Origin header.
        if (!origin) return cb(null, true);
        if (allowlist.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(clerkMiddleware());

  app.use("/notes", notesRouter);
  app.use("/user", userRouter);

  return app;
}

