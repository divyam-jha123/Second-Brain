import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import request from "supertest";
import { isAdmin } from "../src/middlewares/auth.js";
import { buildAnnouncementHtml } from "../src/emails/featureAnnouncement.js";
import { buildWelcomeHtml } from "../src/emails/welcome.js";

const sendFeatureAnnouncement = vi.fn().mockResolvedValue({
  sent: 1,
  errors: 0,
  skipped: 0,
});

vi.mock("../src/services/emailService.js", () => ({
  sendFeatureAnnouncement: (...args: unknown[]) =>
    sendFeatureAnnouncement(...args),
  sendWeeklyDigest: vi.fn(),
  sendWelcomeEmail: vi.fn(),
  generateUnsubscribeUrl: () => "https://brainexpo.me/unsubscribe?token=x",
  verifyUnsubscribeToken: vi.fn(),
}));

vi.mock("../src/models/emailPreference.js", () => ({
  EmailPreference: { findOne: async () => null, findOneAndUpdate: async () => ({}) },
}));

vi.mock("../src/models/user.js", () => ({
  User: { findOne: async () => null, find: async () => [] },
}));

const { createApp } = await import("../src/app.js");
const app = createApp();

const ANNOUNCEMENT = {
  subject: "New: collections",
  title: "Collections are here",
  body: "Group your saves.",
};

describe("isAdmin", () => {
  const original = process.env.ADMIN_USER_IDS;
  afterEach(() => {
    process.env.ADMIN_USER_IDS = original;
  });

  it("admits nobody when the allowlist is unset", () => {
    delete process.env.ADMIN_USER_IDS;
    expect(isAdmin("user_1")).toBe(false);
  });

  it("admits only the listed ids", () => {
    process.env.ADMIN_USER_IDS = "user_1, user_2";
    expect(isAdmin("user_1")).toBe(true);
    expect(isAdmin("user_2")).toBe(true);
    expect(isAdmin("user_3")).toBe(false);
  });

  it("rejects a missing id", () => {
    process.env.ADMIN_USER_IDS = "user_1";
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });
});

describe("POST /email/send-announcement", () => {
  const original = process.env.ADMIN_USER_IDS;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_USER_IDS = "admin_user";
  });

  afterEach(() => {
    process.env.ADMIN_USER_IDS = original;
  });

  it("requires auth", async () => {
    const res = await request(app)
      .post("/email/send-announcement")
      .send(ANNOUNCEMENT);

    expect(res.status).toBe(401);
    expect(sendFeatureAnnouncement).not.toHaveBeenCalled();
  });

  it("will not let an ordinary signed-in user mail everybody", async () => {
    const res = await request(app)
      .post("/email/send-announcement")
      .set("x-user-id", "some_random_signup")
      .send(ANNOUNCEMENT);

    expect(res.status).toBe(404);
    expect(sendFeatureAnnouncement).not.toHaveBeenCalled();
  });

  it("blocks everyone when no allowlist is configured", async () => {
    delete process.env.ADMIN_USER_IDS;

    const res = await request(app)
      .post("/email/send-announcement")
      .set("x-user-id", "admin_user")
      .send(ANNOUNCEMENT);

    expect(res.status).toBe(404);
    expect(sendFeatureAnnouncement).not.toHaveBeenCalled();
  });

  it("lets an allowlisted admin through", async () => {
    const res = await request(app)
      .post("/email/send-announcement")
      .set("x-user-id", "admin_user")
      .send(ANNOUNCEMENT);

    expect(res.status).toBe(200);
    expect(sendFeatureAnnouncement).toHaveBeenCalled();
  });

  it("still validates the payload for an admin", async () => {
    const res = await request(app)
      .post("/email/send-announcement")
      .set("x-user-id", "admin_user")
      .send({ subject: "only a subject" });

    expect(res.status).toBe(400);
  });
});

const announcement = (over = {}) => ({
  username: "alice",
  subject: "New: collections",
  title: "Collections are here",
  body: "Group your saves.\nTry it out.",
  unsubscribeUrl: "https://brainexpo.me/unsubscribe?token=x",
  dashboardUrl: "https://brainexpo.me/dashboard",
  settingsUrl: "https://brainexpo.me/settings/email",
  ...over,
});

describe("buildAnnouncementHtml", () => {
  it("shares the digest's chrome rather than the old gradient", () => {
    const html = buildAnnouncementHtml(announcement());

    expect(html).not.toMatch(/linear-gradient/);
    expect(html).toContain("BrainExpo");
    expect(html).toContain("brainexpo.me · Your internet, organized");
  });

  it("refuses a javascript: CTA url", () => {
    const html = buildAnnouncementHtml(
      // eslint-disable-next-line no-script-url
      announcement({ ctaUrl: "javascript:alert(1)", ctaText: "Click" }),
    );

    expect(html).not.toContain("javascript:");
    expect(html).toContain("https://brainexpo.me/dashboard");
  });

  it("cannot break out of the href attribute", () => {
    const html = buildAnnouncementHtml(
      announcement({ ctaUrl: '" onmouseover="alert(1)', ctaText: "Click" }),
    );

    expect(html).not.toContain("onmouseover");
  });

  it("escapes the author's title and body", () => {
    const html = buildAnnouncementHtml(
      announcement({ title: "<script>x</script>", body: "<img onerror=y>" }),
    );

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img onerror");
  });

  it("keeps author line breaks", () => {
    const html = buildAnnouncementHtml(announcement());
    expect(html).toContain("Group your saves.<br/>Try it out.");
  });
});

describe("buildWelcomeHtml", () => {
  it("shares the same chrome", () => {
    const html = buildWelcomeHtml({
      username: "alice",
      dashboardUrl: "https://brainexpo.me/dashboard",
      unsubscribeUrl: "https://brainexpo.me/unsubscribe?token=x",
      settingsUrl: "https://brainexpo.me/settings/email",
    });

    expect(html).not.toMatch(/linear-gradient/);
    expect(html).not.toMatch(/var\(--/);
    expect(html).toContain("Welcome to BrainExpo");
    expect(html).toContain("Open your brain");
  });
});
