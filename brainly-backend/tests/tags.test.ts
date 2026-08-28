import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { applyUpdate, matches, type Row } from "./helpers/mockStore.js";

const userId = "user_test_1";
const notesStore: Row[] = [];

vi.mock("../src/models/notes.js", () => {
  const Notes = {
    updateMany: async (
      query: Record<string, unknown>,
      update: Record<string, unknown>,
    ) => {
      const rows = notesStore.filter((n) => matches(n, query));
      rows.forEach((row) => {
        // Mongo's positional $set renames the element the query matched.
        const set = update.$set as Record<string, unknown> | undefined;
        if (set && "tags.$" in set) {
          const target = query.tags as string;
          row.tags = (row.tags as string[]).map((t) =>
            t === target ? (set["tags.$"] as string) : t,
          );
          return;
        }
        applyUpdate(row, update);
      });
      return { modifiedCount: rows.length };
    },
    aggregate: async (pipeline: Record<string, never>[]) => {
      const match = (pipeline[0]["$match"] ?? {}) as Record<string, unknown>;
      const counts = new Map<string, number>();
      notesStore
        .filter((n) => matches(n, match))
        .forEach((row) => {
          (row.tags as string[]).forEach((tag) =>
            counts.set(tag, (counts.get(tag) ?? 0) + 1),
          );
        });
      return [...counts]
        .map(([_id, count]) => ({ _id, count }))
        .sort((a, b) => b.count - a.count || a._id.localeCompare(b._id));
    },
  };
  return { Notes, Links: {} };
});

const { createApp } = await import("../src/app.js");
const app = createApp();

describe("tags routes", () => {
  beforeEach(() => {
    notesStore.length = 0;
  });

  it("requires auth", async () => {
    expect((await request(app).get("/tags")).status).toBe(401);
  });

  it("lists tags with counts, most used first", async () => {
    notesStore.push(
      { _id: "n1", userId, tags: ["k8s", "apis"] },
      { _id: "n2", userId, tags: ["k8s"] },
      { _id: "n3", userId: "other", tags: ["private"] },
    );

    const res = await request(app).get("/tags").set("x-user-id", userId);

    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([
      { name: "k8s", count: 2 },
      { name: "apis", count: 1 },
    ]);
  });

  it("renames a tag across every note", async () => {
    notesStore.push(
      { _id: "n1", userId, tags: ["k8s"] },
      { _id: "n2", userId, tags: ["k8s", "apis"] },
    );

    const res = await request(app)
      .patch("/tags/k8s")
      .set("x-user-id", userId)
      .send({ name: "kubernetes" });

    expect(res.status).toBe(200);
    expect(notesStore[0].tags).toEqual(["kubernetes"]);
    expect(notesStore[1].tags).toEqual(["kubernetes", "apis"]);
  });

  it("does not create a duplicate when renaming onto an existing tag", async () => {
    notesStore.push({ _id: "n1", userId, tags: ["k8s", "kubernetes"] });

    await request(app)
      .patch("/tags/k8s")
      .set("x-user-id", userId)
      .send({ name: "kubernetes" });

    expect(notesStore[0].tags).toEqual(["kubernetes"]);
  });

  it("will not rename another user's tags", async () => {
    notesStore.push({ _id: "n1", userId: "someone_else", tags: ["k8s"] });

    await request(app)
      .patch("/tags/k8s")
      .set("x-user-id", userId)
      .send({ name: "kubernetes" });

    expect(notesStore[0].tags).toEqual(["k8s"]);
  });

  it("rejects a blank rename target", async () => {
    const res = await request(app)
      .patch("/tags/k8s")
      .set("x-user-id", userId)
      .send({ name: "  " });

    expect(res.status).toBe(400);
  });

  it("deletes a tag from every note without deleting the notes", async () => {
    notesStore.push(
      { _id: "n1", userId, tags: ["k8s", "apis"] },
      { _id: "n2", userId, tags: ["k8s"] },
    );

    const res = await request(app)
      .delete("/tags/k8s")
      .set("x-user-id", userId);

    expect(res.status).toBe(200);
    expect(notesStore).toHaveLength(2);
    expect(notesStore[0].tags).toEqual(["apis"]);
    expect(notesStore[1].tags).toEqual([]);
  });
});
