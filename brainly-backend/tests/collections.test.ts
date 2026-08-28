import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import {
  applySort,
  applyUpdate,
  findResult,
  matches,
  newId,
  type Row,
} from "./helpers/mockStore.js";

const userId = "user_test_1";

const notesStore: Row[] = [];
const collectionsStore: Row[] = [];

vi.mock("../src/models/notes.js", () => {
  const Notes = {
    find: (query: Record<string, unknown> = {}) =>
      findResult(notesStore.filter((n) => matches(n, query))),
    updateMany: async (
      query: Record<string, unknown>,
      update: Record<string, unknown>,
    ) => {
      const rows = notesStore.filter((n) => matches(n, query));
      rows.forEach((row) => applyUpdate(row, update));
      return { modifiedCount: rows.length };
    },
    aggregate: async (pipeline: Record<string, never>[]) => {
      const match = (pipeline[0]["$match"] ?? {}) as Record<string, unknown>;
      const rows = notesStore.filter((n) => matches(n, match));
      const counts = new Map<string, number>();
      rows.forEach((row) => {
        const key = String(row.collectionId);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
      return [...counts].map(([_id, count]) => ({ _id, count }));
    },
  };
  const Links = {
    updateMany: async () => ({ modifiedCount: 0 }),
  };

  return { Notes, Links };
});

vi.mock("../src/models/collection.js", () => {
  const Collection = {
    create: async (doc: Record<string, unknown>) => {
      if (collectionsStore.some((c) => c.userId === doc.userId && c.name === doc.name)) {
        throw Object.assign(new Error("duplicate"), { code: 11000 });
      }
      const row: Row = { _id: newId("col"), order: 0, ...doc };
      collectionsStore.push(row);
      return row;
    },
    find: (query: Record<string, unknown> = {}) =>
      findResult(collectionsStore.filter((c) => matches(c, query))),
    countDocuments: async (query: Record<string, unknown>) =>
      collectionsStore.filter((c) => matches(c, query)).length,
    findOneAndUpdate: async (
      query: Record<string, unknown>,
      update: Record<string, unknown>,
    ) => {
      const row = collectionsStore.find((c) => matches(c, query));
      if (!row) return null;
      applyUpdate(row, update);
      return row;
    },
    findOneAndDelete: async (query: Record<string, unknown>) => {
      const idx = collectionsStore.findIndex((c) => matches(c, query));
      if (idx === -1) return null;
      const [removed] = collectionsStore.splice(idx, 1);
      return removed;
    },
  };
  return { Collection };
});

const { createApp } = await import("../src/app.js");
const app = createApp();

describe("collections routes", () => {
  beforeEach(() => {
    notesStore.length = 0;
    collectionsStore.length = 0;
  });

  it("requires auth", async () => {
    expect((await request(app).get("/collections")).status).toBe(401);
  });

  it("creates a collection", async () => {
    const res = await request(app)
      .post("/collections")
      .set("x-user-id", userId)
      .send({ name: "System design" });

    expect(res.status).toBe(201);
    expect(collectionsStore).toHaveLength(1);
    expect(collectionsStore[0].name).toBe("System design");
  });

  it("rejects a blank name", async () => {
    const res = await request(app)
      .post("/collections")
      .set("x-user-id", userId)
      .send({ name: "   " });

    expect(res.status).toBe(400);
  });

  it("rejects a duplicate name for the same user", async () => {
    collectionsStore.push({ _id: "c1", userId, name: "Backend", order: 0 });

    const res = await request(app)
      .post("/collections")
      .set("x-user-id", userId)
      .send({ name: "Backend" });

    expect(res.status).toBe(409);
  });

  it("lists collections with note counts", async () => {
    collectionsStore.push({ _id: "c1", userId, name: "Backend", order: 0 });
    notesStore.push(
      { _id: "n1", userId, collectionId: "c1", tags: [] },
      { _id: "n2", userId, collectionId: "c1", tags: [] },
      { _id: "n3", userId, collectionId: null, tags: [] },
    );

    const res = await request(app).get("/collections").set("x-user-id", userId);

    expect(res.status).toBe(200);
    expect(res.body.collections).toHaveLength(1);
    expect(res.body.collections[0].count).toBe(2);
  });

  it("will not rename another user's collection", async () => {
    collectionsStore.push({ _id: "c1", userId: "someone_else", name: "Theirs", order: 0 });

    const res = await request(app)
      .patch("/collections/c1")
      .set("x-user-id", userId)
      .send({ name: "Mine" });

    expect(res.status).toBe(404);
    expect(collectionsStore[0].name).toBe("Theirs");
  });

  it("deleting a collection keeps its notes and moves them to the inbox", async () => {
    collectionsStore.push({ _id: "c1", userId, name: "Backend", order: 0 });
    notesStore.push({ _id: "n1", userId, collectionId: "c1", tags: [] });

    const res = await request(app)
      .delete("/collections/c1")
      .set("x-user-id", userId);

    expect(res.status).toBe(200);
    expect(collectionsStore).toHaveLength(0);
    // The save survives; it just loses its folder.
    expect(notesStore).toHaveLength(1);
    expect(notesStore[0].collectionId).toBeNull();
  });

  it("will not delete another user's collection", async () => {
    collectionsStore.push({ _id: "c1", userId: "someone_else", name: "Theirs", order: 0 });

    const res = await request(app)
      .delete("/collections/c1")
      .set("x-user-id", userId);

    expect(res.status).toBe(404);
    expect(collectionsStore).toHaveLength(1);
  });

  it("orders collections by their order field", async () => {
    collectionsStore.push(
      { _id: "c2", userId, name: "Second", order: 1 },
      { _id: "c1", userId, name: "First", order: 0 },
    );

    const sorted = applySort(collectionsStore, { order: 1 });
    expect(sorted[0].name).toBe("First");
  });
});
