import express from "express";
import cors from "cors";
import { clerkMiddleware } from "./middlewares/auth.js";
import notesRouter from "./routes/notes.js";
import userRouter from "./routes/user.js";
import emailRouter from "./routes/email.js";
import unsubscribeRouter from "./routes/unsubscribe.js";


export function createApp() {
  const app = express();

  app.use(express.json());

  const allowlist = (
    process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",")
      : [
          "https://brainexpo.me",
          "https://www.brainexpo.me",
          "http://localhost:5173",
          "http://localhost",
          "http://localhost:3000",
        ]
  )
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, cb) => {
        // Non-browser/same-origin requests may have no Origin header.
        if (!origin) return cb(null, true);
        if (allowlist.includes(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(clerkMiddleware());

  app.use("/user", userRouter);
  app.use("/notes", notesRouter);
  app.use("/email", emailRouter);
  app.use("/unsubscribe", unsubscribeRouter);

  return app;
}

