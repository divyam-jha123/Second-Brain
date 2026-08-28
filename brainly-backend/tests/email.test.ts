import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { applyUpdate, newId, type Row } from "./helpers/mockStore.js";

const userId = "user_test_1";

const usersStore: Row[] = [];
const prefsStore: Row[] = [];

vi.mock("../src/models/user.js", () => ({
  User: {
    findOne: async (query: Record<string, unknown>) =>
      usersStore.find((u) => u.clerkUserId === query.clerkUserId) ?? null,
  },
}));

vi.mock("../src/models/emailPreference.js", () => {
  const EmailPreference = {
    findOne: async (query: Record<string, unknown>) => {
      const row = prefsStore.find((p) => p.clerkUserId === query.clerkUserId);
      if (!row) return null;
      row.save = async () => {};
      return row;
    },
    create: async (doc: Record<string, unknown>) => {
      const row: Row = {
        _id: newId("pref"),
        featureAnnouncements: true,
        weeklyDigest: true,
        unsubscribedAll: false,
        digestSections: {
          savedThisWeek: true,
          untaggedNudge: true,
          recallQuestions: false,
        },
        digestDay: 0,
        digestHour: 9,
        timezone: "UTC",
        consentedAt: null,
        unsubscribedAt: null,
        unsubscribeToken: newId("token"),
        lastDigestSentAt: null,
        ...doc,
      };
      prefsStore.push(row);
      return row;
    },
    findOneAndUpdate: async (
      query: Record<string, unknown>,
      update: Record<string, unknown>,
    ) => {
      let row = prefsStore.find((p) => p.clerkUserId === query.clerkUserId);
      if (!row) {
        row = await EmailPreference.create({ clerkUserId: query.clerkUserId });
      }
      // The route sends a flat $set-style object, dotted paths included.
      applyUpdate(row, { $set: update });
      for (const [key, value] of Object.entries(update)) {
        if (!key.includes(".")) continue;
        const [parent, child] = key.split(".");
        (row[parent] as Record<string, unknown>)[child] = value;
        delete row[key];
      }
      return row;
    },
  };

  return { EmailPreference };
});

const { createApp } = await import("../src/app.js");
const app = createApp();

const asUser = (req: request.Test) => req.set("x-user-id", userId);

describe("email preference routes", () => {
  beforeEach(() => {
    usersStore.length = 0;
    prefsStore.length = 0;
    usersStore.push({
      _id: newId("user"),
      clerkUserId: userId,
      email: "alice@example.com",
    });
  });

  it("creates a row on first read, capturing the browser's timezone", async () => {
    const res = await asUser(
      request(app).get("/email/preferences?timezone=Asia/Kolkata"),
    );

    expect(res.status).toBe(200);
    expect(res.body.preferences.timezone).toBe("Asia/Kolkata");
    expect(prefsStore).toHaveLength(1);
  });

  it("reports defaults rather than failing when no address is on file", async () => {
    usersStore.length = 0;

    const res = await asUser(request(app).get("/email/preferences"));

    expect(res.status).toBe(200);
    expect(res.body.preferences.weeklyDigest).toBe(true);
    expect(prefsStore).toHaveLength(0);
  });

  it("records consent when the weekly email is switched on", async () => {
    await asUser(request(app).put("/email/preferences").send({ weeklyDigest: false }));
    const res = await asUser(
      request(app).put("/email/preferences").send({ weeklyDigest: true }),
    );

    expect(res.body.preferences.weeklyDigest).toBe(true);
    expect(res.body.preferences.consentedAt).not.toBeNull();
    expect(res.body.preferences.unsubscribedAt).toBeNull();
  });

  it("stamps unsubscribedAt when the weekly email is switched off", async () => {
    const res = await asUser(
      request(app).put("/email/preferences").send({ weeklyDigest: false }),
    );

    expect(res.body.preferences.weeklyDigest).toBe(false);
    expect(res.body.preferences.unsubscribedAt).not.toBeNull();
  });

  it("does not treat clearing every section as an unsubscribe", async () => {
    const res = await asUser(
      request(app)
        .put("/email/preferences")
        .send({
          digestSections: {
            savedThisWeek: false,
            untaggedNudge: false,
            recallQuestions: false,
          },
        }),
    );

    expect(res.body.preferences.digestSections).toEqual({
      savedThisWeek: false,
      untaggedNudge: false,
      recallQuestions: false,
    });
    expect(res.body.preferences.weeklyDigest).toBe(true);
    expect(res.body.preferences.unsubscribedAt).toBeNull();
  });

  it("saves the delivery day and hour", async () => {
    const res = await asUser(
      request(app).put("/email/preferences").send({ digestDay: 3, digestHour: 18 }),
    );

    expect(res.body.preferences.digestDay).toBe(3);
    expect(res.body.preferences.digestHour).toBe(18);
  });

  it("answers 501 for the not-yet-built preview send", async () => {
    const res = await asUser(request(app).post("/email/send-now"));

    expect(res.status).toBe(501);
  });

  it("requires auth", async () => {
    const res = await request(app).get("/email/preferences");
    expect(res.status).toBe(401);
  });
});
