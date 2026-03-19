import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import dotenv from "dotenv";

dotenv.config();

describe("CORS", () => {
  const allowedOrigin = process.env.CORS_ORIGINS || "http://localhost:5173";
  const disallowedOrigin = "https://evil.example";

  it("allows CORS preflight for allowed origin", async () => {
    const app = createApp();

    const res = await request(app)
      .options("/notes")
      .set("Origin", allowedOrigin)
      .set("Access-Control-Request-Method", "GET");

    // cors should respond with allow-origin (and allow-credentials since enabled)
    expect(res.headers["access-control-allow-origin"]).toBe(allowedOrigin);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("blocks CORS preflight for disallowed origin", async () => {
    const app = createApp();

    const res = await request(app)
      .options("/notes")
      .set("Origin", disallowedOrigin)
      .set("Access-Control-Request-Method", "GET");

    // When blocked, allow-origin should not be echoed back.
    expect(res.headers["access-control-allow-origin"]).not.toBe(disallowedOrigin);
  });
});

