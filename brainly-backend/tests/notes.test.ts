import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import {
  applyUpdate,
  findResult,
  matches,
  newId,
  type Row,
} from "./helpers/mockStore.js";

const userId = "user_test_1";

const notesStore: Row[] = [];
const linksStore: Row[] = [];

vi.mock("../src/models/notes.js", () => {
  const Notes = {
    create: async (doc: Record<string, unknown>) => {
      const note: Row = {
        _id: newId("note"),
        tags: [],
        collectionId: null,
        createdAt: new Date().toISOString(),
        ...doc,
      };
      notesStore.push(note);
      return note;
    },
    find: (query: Record<string, unknown> = {}) =>
      findResult(notesStore.filter((n) => matches(n, query))),
    findOne: async (query: Record<string, unknown>) =>
      notesStore.find((n) => matches(n, query)) ?? null,
    findOneAndDelete: async (query: Record<string, unknown>) => {
      const idx = notesStore.findIndex((n) => matches(n, query));
      if (idx === -1) return null;
      const [removed] = notesStore.splice(idx, 1);
      return removed;
    },
    findOneAndUpdate: async (
      query: Record<string, unknown>,
      update: Record<string, unknown>,
    ) => {
      const row = notesStore.find((n) => matches(n, query));
      if (!row) return null;
      applyUpdate(row, update);
      return row;
    },
    updateMany: async (
      query: Record<string, unknown>,
      update: Record<string, unknown>,
    ) => {
      const rows = notesStore.filter((n) => matches(n, query));
      rows.forEach((row) => applyUpdate(row, update));
      return { modifiedCount: rows.length };
    },
  };

  const Links = {
    create: async (doc: Record<string, unknown>) => {
      const link: Row = {
        _id: newId("link"),
        scope: "all",
        collectionId: null,
        tag: null,
        noteIds: [],
        revokedAt: null,
        createdAt: new Date().toISOString(),
        ...doc,
      };
      linksStore.push(link);
      return link;
    },
    find: (query: Record<string, unknown> = {}) =>
      findResult(linksStore.filter((l) => matches(l, query))),
    findOne: async (query: Record<string, unknown>) =>
      linksStore.find((l) => matches(l, query)) ?? null,
    findOneAndUpdate: async (
      query: Record<string, unknown>,
      update: Record<string, unknown>,
    ) => {
      const row = linksStore.find((l) => matches(l, query));
      if (!row) return null;
      applyUpdate(row, update);
      return row;
    },
    updateMany: async (
      query: Record<string, unknown>,
      update: Record<string, unknown>,
    ) => {
      const rows = linksStore.filter((l) => matches(l, query));
      rows.forEach((row) => applyUpdate(row, update));
      return { modifiedCount: rows.length };
    },
  };

  return { Notes, Links };
});

// Import after mocks so routes see the mocked models
const { createApp } = await import("../src/app.js");
const app = createApp();

const seedNote = (overrides: Partial<Row> = {}): Row => {
  const note: Row = {
    _id: newId("note"),
    title: "T",
    content: "c",
    userId,
    tags: [],
    collectionId: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
  notesStore.push(note);
  return note;
};

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
    seedNote({ _id: "1", title: "A", content: "hello" });
    seedNote({ _id: "2", title: "B", content: "world", userId: "other" });

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

  it("POST /notes/create-note stores tags, note and source domain", async () => {
    await request(app)
      .post("/notes/create-note")
      .set("x-user-id", userId)
      .send({
        title: "T",
        link: "https://www.example.com/a",
        note: "worth rereading",
        tags: ["  SysDesign ", "apis", "apis", ""],
      });

    expect(notesStore[0].tags).toEqual(["sysdesign", "apis"]);
    expect(notesStore[0].note).toBe("worth rereading");
    expect(notesStore[0].sourceDomain).toBe("example.com");
  });

  it("DELETE /notes/:id deletes a note", async () => {
    seedNote({ _id: "del1" });

    const res = await request(app)
      .delete(`/notes/del1`)
      .set("x-user-id", userId);

    expect(res.status).toBe(200);
    expect(res.body.msg).toMatch(/deleted/i);
    expect(notesStore).toHaveLength(0);
  });

  describe("ownership", () => {
    it("GET /notes/:id will not read another user's note", async () => {
      seedNote({ _id: "theirs", userId: "someone_else" });

      const res = await request(app)
        .get("/notes/theirs")
        .set("x-user-id", userId);

      // 404 rather than 403, so ids stay non-enumerable.
      expect(res.status).toBe(404);
    });

    it("DELETE /notes/:id will not delete another user's note", async () => {
      seedNote({ _id: "theirs", userId: "someone_else" });

      const res = await request(app)
        .delete("/notes/theirs")
        .set("x-user-id", userId);

      expect(res.status).toBe(404);
      expect(notesStore).toHaveLength(1);
    });

    it("PATCH /notes/:id will not update another user's note", async () => {
      seedNote({ _id: "theirs", userId: "someone_else", title: "Original" });

      const res = await request(app)
        .patch("/notes/theirs")
        .set("x-user-id", userId)
        .send({ title: "Hijacked" });

      expect(res.status).toBe(404);
      expect(notesStore[0].title).toBe("Original");
    });
  });

  describe("PATCH /notes/:id", () => {
    it("assigns tags, note and collection", async () => {
      const note = seedNote();

      const res = await request(app)
        .patch(`/notes/${note._id}`)
        .set("x-user-id", userId)
        .send({ tags: ["K8s"], note: "the caching part", collectionId: "col1" });

      expect(res.status).toBe(200);
      expect(notesStore[0].tags).toEqual(["k8s"]);
      expect(notesStore[0].note).toBe("the caching part");
      expect(notesStore[0].collectionId).toBe("col1");
    });

    it("moves a note back to the inbox when collectionId is null", async () => {
      const note = seedNote({ collectionId: "col1" });

      await request(app)
        .patch(`/notes/${note._id}`)
        .set("x-user-id", userId)
        .send({ collectionId: null });

      expect(notesStore[0].collectionId).toBeNull();
    });

    it("rejects an empty update", async () => {
      const note = seedNote();

      const res = await request(app)
        .patch(`/notes/${note._id}`)
        .set("x-user-id", userId)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("GET /notes filters", () => {
    it("filters by tag", async () => {
      seedNote({ title: "Tagged", tags: ["k8s"] });
      seedNote({ title: "Other", tags: ["apis"] });

      const res = await request(app)
        .get("/notes?tag=k8s")
        .set("x-user-id", userId);

      expect(res.body.post).toHaveLength(1);
      expect(res.body.post[0].title).toBe("Tagged");
    });

    it("collection=inbox returns only untagged notes", async () => {
      seedNote({ title: "Sorted", tags: ["k8s"] });
      seedNote({ title: "Unsorted", tags: [] });

      const res = await request(app)
        .get("/notes?collection=inbox")
        .set("x-user-id", userId);

      expect(res.body.post).toHaveLength(1);
      expect(res.body.post[0].title).toBe("Unsorted");
    });

    it("searches title, content and note", async () => {
      seedNote({ title: "Rate limiting", content: "https://a.com" });
      seedNote({ title: "Unrelated", content: "https://b.com", note: "rate limits here" });
      seedNote({ title: "Nothing", content: "https://c.com" });

      const res = await request(app)
        .get("/notes?q=rate")
        .set("x-user-id", userId);

      expect(res.body.post).toHaveLength(2);
    });

    it("does not break on regex metacharacters in the query", async () => {
      seedNote({ title: "c++ notes" });

      const res = await request(app)
        .get("/notes?q=" + encodeURIComponent("c++"))
        .set("x-user-id", userId);

      expect(res.status).toBe(200);
      expect(res.body.post).toHaveLength(1);
    });
  });

  it("POST /notes/share returns same hash if already exists", async () => {
    linksStore.push({
      _id: "l1",
      userId,
      hash: "abc123",
      scope: "all",
      revokedAt: null,
    });

    const res = await request(app)
      .post("/notes/share")
      .set("x-user-id", userId)
      .send({ share: true });

    expect(res.status).toBe(200);
    expect(res.body.hash).toBe("abc123");
  });

  it("POST /notes/share scopes a link to chosen items", async () => {
    const mine = seedNote({ _id: "n1", title: "Mine" });
    seedNote({ _id: "n2", title: "Also mine" });

    const res = await request(app)
      .post("/notes/share")
      .set("x-user-id", userId)
      .send({ scope: "items", noteIds: [mine._id] });

    expect(res.status).toBe(200);

    const shared = await request(app).get(`/notes/api/share/${res.body.hash}`);
    expect(shared.body.scope).toBe("items");
    expect(shared.body.content).toHaveLength(1);
    expect(shared.body.content[0].title).toBe("Mine");
  });

  it("POST /notes/share scopes a link to a tag", async () => {
    seedNote({ _id: "n1", title: "Tagged", tags: ["react"] });
    seedNote({ _id: "n2", title: "Untagged" });

    const res = await request(app)
      .post("/notes/share")
      .set("x-user-id", userId)
      .send({ scope: "tag", tag: "React" });

    const shared = await request(app).get(`/notes/api/share/${res.body.hash}`);
    expect(shared.body.content).toHaveLength(1);
    expect(shared.body.content[0].title).toBe("Tagged");
  });

  it("POST /notes/share rejects items the caller does not own", async () => {
    const theirs = seedNote({ _id: "n9", userId: "other" });

    const res = await request(app)
      .post("/notes/share")
      .set("x-user-id", userId)
      .send({ scope: "items", noteIds: [theirs._id] });

    expect(res.status).toBe(404);
  });

  it("POST /notes/share rejects an empty item selection", async () => {
    const res = await request(app)
      .post("/notes/share")
      .set("x-user-id", userId)
      .send({ scope: "items", noteIds: [] });

    expect(res.status).toBe(400);
  });

  it("DELETE /notes/share/:hash revokes the link", async () => {
    seedNote({ _id: "n1" });
    linksStore.push({
      _id: "l1",
      userId,
      hash: "hash1",
      scope: "all",
      revokedAt: null,
    });

    const revoked = await request(app)
      .delete("/notes/share/hash1")
      .set("x-user-id", userId);
    expect(revoked.status).toBe(200);

    // A revoked hash is indistinguishable from one that never existed.
    const res = await request(app).get("/notes/api/share/hash1");
    expect(res.status).toBe(404);
  });

  it("GET /notes/share is not swallowed by GET /notes/:id", async () => {
    // Express matches in registration order. With "/:id" declared first, this
    // request tried to cast "share" to an ObjectId and 404'd, which surfaced
    // in the UI as "Couldn't load your settings."
    const res = await request(app).get("/notes/share").set("x-user-id", userId);

    expect(res.status).toBe(200);
    expect(res.body.links).toBeDefined();
  });

  it("GET /notes/api/share/:hash returns 404 when hash missing", async () => {
    const res = await request(app).get("/notes/api/share/nope");
    expect(res.status).toBe(404);
  });

  it("GET /notes/api/share/:hash returns content for link", async () => {
    seedNote({ _id: "n1" });
    linksStore.push({
      _id: "l1",
      userId,
      hash: "hash1",
      scope: "all",
      revokedAt: null,
    });

    const res = await request(app).get("/notes/api/share/hash1");
    expect(res.status).toBe(200);
    expect(res.body.content).toHaveLength(1);
    expect(res.body.content[0].title).toBe("T");
  });
});
