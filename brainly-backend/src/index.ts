import dotenv from "dotenv";
import mongoose from "mongoose";
import { createApp } from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URI || "";

async function connectDatabase() {
  // 1) Prefer explicit Mongo URI if provided
  if (MONGO_URL) {
    await mongoose.connect(MONGO_URL);
    console.log("MongoDB connected via MONGO_URI");
    return;
  }

  // 2) For local development only, fall back to in-memory MongoDB
  if (process.env.NODE_ENV !== "production") {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
    console.log("MongoDB connected via mongodb-memory-server (in-memory)");

    // Optional: clean shutdown on SIGINT in dev
    process.on("SIGINT", async () => {
      await mongoose.disconnect();
      await mongoServer.stop();
      process.exit(0);
    });
    return;
  }

  // 3) In production with no MONGO_URI, fail fast
  throw new Error("MONGO_URI must be set in production");
}

async function startServer() {
  const app = createApp();

  try {
    await connectDatabase();
  } catch (err) {
    console.error("Error while connecting to MongoDB:", err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
}

startServer();