import express from "express";
import cors from "cors";
import { clerkMiddleware } from "./middlewares/auth.js";
import notesRouter from "./routes/notes.js";
import userRouter from "./routes/user.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.use(clerkMiddleware());

  app.use("/notes", notesRouter);
  app.use("/user", userRouter);

  return app;
}

