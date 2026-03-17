import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

const userId = "user_test_1";

type UserDoc = { _id: string; clerkUserId: string; username: string; email: string };
const usersStore: UserDoc[] = [];

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`;
}

vi.mock("../src/models/user.js", () => {
  const User = {
    find: async (query: Partial<Pick<UserDoc, "clerkUserId">>) => {
      if (query.clerkUserId) return usersStore.filter((u) => u.clerkUserId === query.clerkUserId);
      return [...usersStore];
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
      };
      usersStore.push(created);
      return created;
    },
  };
  return { User };
});

const { createApp } = await import("../src/app.js");
const app = createApp();

describe("user routes", () => {
  beforeEach(() => {
    usersStore.length = 0;
  });

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
});

