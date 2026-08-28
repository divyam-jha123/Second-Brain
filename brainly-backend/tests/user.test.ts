import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

const userId = "user_test_1";

type UserDoc = {
  _id: string;
  clerkUserId: string;
  username: string;
  email: string;
  topics?: string[];
  onboardingCompletedAt?: Date | null;
  save?: () => Promise<void>;
};
type CollectionDoc = { _id: string; userId: string; name: string; order: number };
type PrefDoc = { clerkUserId: string } & Record<string, unknown>;

const usersStore: UserDoc[] = [];
const collectionsStore: CollectionDoc[] = [];
const prefsStore: PrefDoc[] = [];

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`;
}

vi.mock("../src/models/user.js", () => {
  const User = {
    find: async (query: Partial<Pick<UserDoc, "clerkUserId">>) => {
      if (query.clerkUserId) return usersStore.filter((u) => u.clerkUserId === query.clerkUserId);
      return [...usersStore];
    },
    findOne: async (query: Partial<Pick<UserDoc, "clerkUserId">>) => {
      const found = query.clerkUserId
        ? usersStore.find((u) => u.clerkUserId === query.clerkUserId)
        : usersStore[0];
      if (!found) return null;
      // The route mutates the doc then calls save(); mirror that here.
      found.save = async () => {};
      return found;
    },
    findOneAndUpdate: async (
      query: Partial<Pick<UserDoc, "clerkUserId">>,
      update: Partial<UserDoc>,
      _opts: { upsert?: boolean; new?: boolean },
    ) => {
      const existing = usersStore.find((u) => u.clerkUserId === query.clerkUserId);
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const created: UserDoc = {
        _id: newId("user"),
        clerkUserId: update.clerkUserId ?? query.clerkUserId ?? "",
        username: update.username ?? "",
        email: update.email ?? "",
        topics: [],
        onboardingCompletedAt: null,
      };
      created.save = async () => {};
      usersStore.push(created);
      return created;
    },
  };
  return { User };
});

vi.mock("../src/models/collection.js", () => {
  const Collection = {
    findOne: async (query: { userId: string; name: string }) =>
      collectionsStore.find(
        (c) => c.userId === query.userId && c.name === query.name,
      ) ?? null,
    countDocuments: async (query: { userId: string }) =>
      collectionsStore.filter((c) => c.userId === query.userId).length,
    create: async (doc: Omit<CollectionDoc, "_id">) => {
      const row = { _id: newId("col"), ...doc };
      collectionsStore.push(row);
      return row;
    },
  };
  return { Collection };
});

vi.mock("../src/models/emailPreference.js", () => {
  const EmailPreference = {
    findOneAndUpdate: async (
      query: { clerkUserId: string },
      update: { $set?: Record<string, unknown> },
    ) => {
      let row = prefsStore.find((p) => p.clerkUserId === query.clerkUserId);
      if (!row) {
        row = { clerkUserId: query.clerkUserId };
        prefsStore.push(row);
      }
      Object.assign(row, update.$set ?? {});
      return row;
    },
  };
  return { EmailPreference };
});

const { createApp } = await import("../src/app.js");
const app = createApp();

describe("user routes", () => {
  beforeEach(() => {
    usersStore.length = 0;
    collectionsStore.length = 0;
    prefsStore.length = 0;
  });

  const seedUser = () => {
    const user: UserDoc = {
      _id: newId("user"),
      clerkUserId: userId,
      username: "alice",
      email: "a@a.com",
      topics: [],
      onboardingCompletedAt: null,
    };
    user.save = async () => {};
    usersStore.push(user);
    return user;
  };

  it("POST /user/sync requires auth", async () => {
    const res = await request(app).post("/user/sync").send({ username: "u", email: "e@e.com" });
    expect(res.status).toBe(401);
  });

  it("POST /user/sync validates payload", async () => {
    const res = await request(app).post("/user/sync").set("x-user-id", userId).send({ username: "" });
    expect(res.status).toBe(400);
  });

  it("POST /user/sync upserts user", async () => {
    const res1 = await request(app)
      .post("/user/sync")
      .set("x-user-id", userId)
      .send({ username: "alice", email: "a@a.com" });
    expect(res1.status).toBe(200);

    const res2 = await request(app)
      .post("/user/sync")
      .set("x-user-id", userId)
      .send({ username: "alice2", email: "a2@a.com" });
    expect(res2.status).toBe(200);

    expect(usersStore).toHaveLength(1);
    expect(usersStore[0].username).toBe("alice2");
  });

  describe("GET /user/me", () => {
    it("requires auth", async () => {
      expect((await request(app).get("/user/me")).status).toBe(401);
    });

    it("reports a user who has never onboarded", async () => {
      const res = await request(app).get("/user/me").set("x-user-id", userId);

      expect(res.status).toBe(200);
      expect(res.body.user.onboardingCompletedAt).toBeNull();
    });

    it("reports a completed onboarding", async () => {
      const user = seedUser();
      user.onboardingCompletedAt = new Date();
      user.topics = ["backend"];

      const res = await request(app).get("/user/me").set("x-user-id", userId);

      expect(res.body.user.onboardingCompletedAt).not.toBeNull();
      expect(res.body.user.topics).toEqual(["backend"]);
    });
  });

  describe("POST /user/onboarding", () => {
    it("requires the user to be synced first", async () => {
      const res = await request(app)
        .post("/user/onboarding")
        .set("x-user-id", userId)
        .send({ topics: ["backend"] });

      expect(res.status).toBe(409);
    });

    it("seeds a collection per topic and stamps completion", async () => {
      const user = seedUser();

      const res = await request(app)
        .post("/user/onboarding")
        .set("x-user-id", userId)
        .send({ topics: ["System design", "  Backend  ", "backend"] });

      expect(res.status).toBe(200);
      // Normalized and de-duplicated.
      expect(collectionsStore.map((c) => c.name)).toEqual([
        "system design",
        "backend",
      ]);
      expect(user.topics).toEqual(["system design", "backend"]);
      expect(user.onboardingCompletedAt).not.toBeNull();
    });

    it("does not duplicate a collection the user already has", async () => {
      seedUser();
      collectionsStore.push({
        _id: "c1",
        userId,
        name: "backend",
        order: 0,
      });

      await request(app)
        .post("/user/onboarding")
        .set("x-user-id", userId)
        .send({ topics: ["backend"] });

      expect(collectionsStore).toHaveLength(1);
    });

    it("stores the weekly email choices", async () => {
      seedUser();

      await request(app)
        .post("/user/onboarding")
        .set("x-user-id", userId)
        .send({
          topics: [],
          weeklyEmail: {
            enabled: true,
            sections: {
              savedThisWeek: true,
              untaggedNudge: false,
              recallQuestions: true,
            },
            day: 0,
            hour: 9,
            timezone: "Asia/Kolkata",
          },
        });

      expect(prefsStore[0]).toMatchObject({
        weeklyDigest: true,
        "digestSections.untaggedNudge": false,
        "digestSections.recallQuestions": true,
        digestDay: 0,
        digestHour: 9,
        timezone: "Asia/Kolkata",
      });
    });

    it("skip seeds nothing but still completes", async () => {
      const user = seedUser();

      const res = await request(app)
        .post("/user/onboarding")
        .set("x-user-id", userId)
        .send({ skip: true, topics: ["backend"] });

      expect(res.status).toBe(200);
      expect(collectionsStore).toHaveLength(0);
      expect(prefsStore).toHaveLength(0);
      expect(user.onboardingCompletedAt).not.toBeNull();
    });
  });
});

