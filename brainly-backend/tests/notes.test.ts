import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

const userId = "user_test_1";

type Note = { _id: string; title: string; content: string; userId: string; createdAt: string };
type Link = { _id: string; userId: string; hash: string };

const notesStore: Note[] = [];
const linksStore: Link[] = [];

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}`;
}

vi.mock("../src/models/notes.js", () => {
  const Notes = {
    create: async (doc: { title: string; content: string; userId: string }) => {
      const note: Note = {
        _id: newId("note"),
        title: doc.title,
        content: doc.content,
        userId: doc.userId,
        createdAt: new Date().toISOString(),
      };
      notesStore.push(note);
      return note;
    },
    find: async (query: Partial<Pick<Note, "userId">>) => {
      if (query.userId) return notesStore.filter((n) => n.userId === query.userId);
      return [...notesStore];
    },
    findById: async (id: string) => notesStore.find((n) => n._id === id) ?? null,
    findByIdAndDelete: async (id: string) => {
      const idx = notesStore.findIndex((n) => n._id === id);
      if (idx === -1) return null;
      const [removed] = notesStore.splice(idx, 1);
      return removed;
    },
  };

  const Links = {
    create: async (doc: { userId: string; hash: string }) => {
      const link: Link = { _id: newId("link"), userId: doc.userId, hash: doc.hash };
      linksStore.push(link);
      return link;
    },
    findOne: async (query: Partial<Pick<Link, "userId" | "hash">>) =>
      linksStore.find((l) => (query.userId ? l.userId === query.userId : true) && (query.hash ? l.hash === query.hash : true)) ??
      null,
    deleteOne: async (query: Partial<Pick<Link, "userId">>) => {
      const before = linksStore.length;
      for (let i = linksStore.length - 1; i >= 0; i--) {
        if (query.userId && linksStore[i].userId === query.userId) linksStore.splice(i, 1);
      }
      return { deletedCount: before - linksStore.length };
    },
  };

  return { Notes, Links };
});

// Import after mocks so routes see the mocked models
const { createApp } = await import("../src/app.js");
const app = createApp();

describe("notes routes", () => {
  beforeEach(() => {
    notesStore.length = 0;
    linksStore.length = 0;
  });

  it("GET /notes requires auth", async () => {
    const res = await request(app).get("/notes");
    expect(res.status).toBe(401);
  });

  it("GET /notes returns notes for user", async () => {
    notesStore.push(
      { _id: "1", title: "A", content: "hello", userId, createdAt: new Date().toISOString() },
      { _id: "2", title: "B", content: "world", userId: "other", createdAt: new Date().toISOString() },
    );

    const res = await request(app).get("/notes").set("x-user-id", userId);
    expect(res.status).toBe(200);
    expect(res.body.post).toHaveLength(1);
    expect(res.body.post[0].title).toBe("A");
  });

  it("POST /notes/create-note creates a note", async () => {
    const res = await request(app)
      .post("/notes/create-note")
      .set("x-user-id", userId)
      .send({ title: "T", link: "http://x" });

    expect(res.status).toBe(200);
    expect(res.body.msg).toBe("success");

    expect(notesStore).toHaveLength(1);
    expect(notesStore[0].content).toBe("http://x");
  });

  it("DELETE /notes/:id deletes a note", async () => {
    notesStore.push({ _id: "del1", title: "T", content: "c", userId, createdAt: new Date().toISOString() });

    const res = await request(app)
      .delete(`/notes/del1`)
      .set("x-user-id", userId);

    expect(res.status).toBe(200);
    expect(res.body.msg).toMatch(/deleted/i);
    expect(notesStore).toHaveLength(0);
  });

  it("POST /notes/share returns same hash if already exists", async () => {
    linksStore.push({ _id: "l1", userId, hash: "abc123" });

    const res = await request(app)
      .post("/notes/share")
      .set("x-user-id", userId)
      .send({ share: true });

    expect(res.status).toBe(200);
    expect(res.body.hash).toBe("abc123");
  });

  it("GET /notes/api/share/:hash returns 404 when hash missing", async () => {
    const res = await request(app).get("/notes/api/share/nope");
    expect(res.status).toBe(404);
  });

  it("GET /notes/api/share/:hash returns content for link", async () => {
    notesStore.push({ _id: "n1", title: "T", content: "c", userId, createdAt: new Date().toISOString() });
    linksStore.push({ _id: "l1", userId, hash: "hash1" });

    const res = await request(app).get("/notes/api/share/hash1");
    expect(res.status).toBe(200);
    expect(res.body.content).toHaveLength(1);
    expect(res.body.content[0].title).toBe("T");
  });
});

