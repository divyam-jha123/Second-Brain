import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import { Notes, Links, ILink, ShareScope } from "../models/notes.js";
import { Collection } from "../models/collection.js";
import { requireAuth, getAuth } from "../middlewares/auth.js";
import { generateRandom, getSourceDomain, normalizeTags } from "../utils/util.js";

const router = Router();

type NoteQuery = {
  userId: string;
  tags?: string | { $size: 0 };
  collectionId?: string | null;
  $or?: Record<string, unknown>[];
};

router.get("/", requireAuth(), async (req: Request, res: Response) => {
  // dashboard
  const { userId } = getAuth(req);

  const { q, tag, collection, sort } = req.query as Record<string, string | undefined>;

  const query: NoteQuery = { userId: userId as string };

  if (tag) query.tags = tag.trim().toLowerCase();

  // "inbox" is the virtual collection of notes nothing has been filed under.
  if (collection === "inbox") {
    query.tags = { $size: 0 };
  } else if (collection === "none") {
    query.collectionId = null;
  } else if (collection) {
    query.collectionId = collection;
  }

  if (q) {
    // Escape regex metacharacters so a search for "c++" can't blow up.
    const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const needle = new RegExp(safe, "i");
    query.$or = [
      { title: needle },
      { content: needle },
      { note: needle },
      { tags: needle },
    ];
  }

  const sortBy: Record<string, 1 | -1> =
    sort === "oldest" ? { createdAt: 1 }
    : sort === "title" ? { title: 1 }
    : { createdAt: -1 };

  const post = await Notes.find(query).sort(sortBy);

  return res.json({
    msg: "welcome to a server written in typescript",
    post,
  });
});

router.post(
  "/create-note",
  requireAuth(),
  async (req: Request, res: Response) => {
    // create notes
    try {
      const { title, link, note, tags, collectionId } = req.body;
      const { userId } = getAuth(req);

      if (!userId) {
        return res.status(401).json({ msg: "Not authenticated" });
      }

      const created = await Notes.create({
        title: title,
        content: link,
        userId: userId,
        note: note,
        tags: normalizeTags(tags),
        collectionId: collectionId || null,
        sourceDomain: getSourceDomain(link ?? ""),
      });

      return res.json({
        msg: "success",
        post: created,
      });
    } catch (error) {
      return res.json({
        err: error,
      });
    }
  },
);

router.post("/share", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    // Legacy body: { share: false } removed the user's one link.
    if (req.body.share === false) {
      await Links.updateMany(
        { userId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
      return res.json({ msg: "Share link removed" });
    }

    const scope: ShareScope = req.body.scope ?? "all";

    if (!["all", "collection", "tag", "items"].includes(scope)) {
      return res.status(400).json({ msg: "Unknown share scope" });
    }

    // Exactly the fields for the chosen scope get set — a tag link carrying a
    // collectionId is a bug, not something to merge.
    // Only the fields the chosen scope needs get set; the schema defaults the
    // rest, so a tag link can never carry a stale collectionId.
    const fields: {
      scope: ShareScope;
      collectionId?: Types.ObjectId;
      tag?: string;
      noteIds?: Types.ObjectId[];
      label?: string;
    } = { scope };
    const match: Record<string, unknown> = { userId, scope, revokedAt: null };

    if (scope === "collection") {
      const collection = await Collection.findOne({
        _id: req.body.collectionId,
        userId,
      });
      if (!collection) {
        return res.status(404).json({ msg: "Collection not found" });
      }
      fields.collectionId = collection._id;
      fields.label = collection.name;
      match.collectionId = collection._id;
    }

    if (scope === "tag") {
      const tag = normalizeTags([req.body.tag])[0];
      if (!tag) {
        return res.status(400).json({ msg: "A tag is required" });
      }
      fields.tag = tag;
      fields.label = tag;
      match.tag = tag;
    }

    if (scope === "items") {
      const requested: string[] = Array.isArray(req.body.noteIds)
        ? req.body.noteIds
        : [];
      if (!requested.length) {
        return res.status(400).json({ msg: "Pick at least one item to share" });
      }

      // Only the caller's own notes survive the lookup, so a borrowed id is dropped.
      const owned = await Notes.find({ _id: { $in: requested }, userId }).select(
        "_id",
      );
      if (owned.length !== requested.length) {
        return res.status(404).json({ msg: "Some items were not found" });
      }
      const noteIds = owned.map((note) => note._id);
      fields.noteIds = noteIds;
      match.noteIds = { $all: noteIds, $size: noteIds.length };
    }

    // An identical live link already says what this one would — reuse it.
    const existing = await Links.findOne(match);
    if (existing) {
      return res.json({
        msg: "Link already exists",
        hash: existing.hash,
        link: existing,
      });
    }

    const hash = generateRandom(10);
    const link = await Links.create({ ...fields, userId, hash });

    return res.json({ msg: "Sharable link generated", hash, link });
  } catch (error) {
    return res.status(500).json({ msg: "Error creating share link", error });
  }
});

/** The owner's live links, for the Sharing section in settings. */

router.get("/share", requireAuth(), async (req: Request, res: Response) => {
  const { userId } = getAuth(req);

  const links = await Links.find({ userId, revokedAt: null }).sort({
    createdAt: -1,
  });

  return res.json({ msg: "success", links });
});

router.delete(
  "/share/:hash",
  requireAuth(),
  async (req: Request, res: Response) => {
    const { userId } = getAuth(req);

    const link = await Links.findOneAndUpdate(
      { hash: req.params.hash, userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );

    if (!link) {
      return res.status(404).json({ msg: "Link not found" });
    }

    return res.json({ msg: "Share link revoked" });
  },
);

router.get("/api/share/:hash", async (req: Request, res: Response) => {
  const hash = req.params.hash;

  // A revoked hash is indistinguishable from one that never existed.
  const link = await Links.findOne({ hash, revokedAt: null });

  if (!link) {
    return res.status(404).json({
      msg: "Link not found",
    });
  }

  const filter = shareFilter(link);

  if (!filter) {
    return res.status(404).json({ msg: "Link not found" });
  }

  const content = await Notes.find(filter).sort({ createdAt: -1 });

  return res.json({
    msg: "Link found",
    scope: link.scope,
    label: link.label ?? null,
    content,
  });
});

router.get("/:id", requireAuth(), async (req: Request, res: Response) => {
  // getNotesById
  try {
    const id = req.params.id;
    const { userId } = getAuth(req);

    // Scoped to the caller: a note belonging to someone else must look absent,
    // not forbidden, so ids stay non-enumerable.
    const note = await Notes.findOne({ _id: id, userId });

    if (!note) {
      return res.status(404).json({ msg: "Note not found" });
    }

    return res.json({
      msg: note,
    });
  } catch (error) {
    return res.status(404).json({
      msg: "item not found",
      err: error,
    });
  }
});

router.patch("/:id", requireAuth(), async (req: Request, res: Response) => {
  // Update the editable fields of a note the caller owns.
  try {
    const id = req.params.id;
    const { userId } = getAuth(req);
    const { title, note, tags, collectionId } = req.body;

    const update: Record<string, unknown> = {};
    if (typeof title === "string") update.title = title;
    if (typeof note === "string") update.note = note;
    if (tags !== undefined) update.tags = normalizeTags(tags);
    // null is meaningful here — it moves the note back out of any collection.
    if (collectionId !== undefined) update.collectionId = collectionId || null;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ msg: "No updatable fields provided" });
    }

    const updated = await Notes.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ msg: "Note not found" });
    }

    return res.json({
      msg: "Note updated successfully",
      post: updated,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error updating note",
      error,
    });
  }
});

router.delete("/:id", requireAuth(), async (req: Request, res: Response) => {
  // deleteNotesById
  try {
    const id = req.params.id;
    const { userId } = getAuth(req);

    const note = await Notes.findOneAndDelete({ _id: id, userId });

    if (!note) {
      return res.status(404).json({
        msg: "Note not found",
      });
    }

    return res.json({
      msg: "Note deleted successfully",
      deletedNote: note,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error deleting note",
      error,
    });
  }
});

/** Resolve a link's scope to the note filter it stands for. */
function shareFilter(link: ILink): Record<string, unknown> | null {
  switch (link.scope) {
    case "collection":
      return link.collectionId
        ? { userId: link.userId, collectionId: link.collectionId }
        : null;
    case "tag":
      return link.tag ? { userId: link.userId, tags: link.tag } : null;
    case "items":
      return link.noteIds.length
        ? { userId: link.userId, _id: { $in: link.noteIds } }
        : null;
    case "all":
    default:
      return { userId: link.userId };
  }
}

/**
 * Mint a link for a chosen scope. The owner picks what goes out before
 * anything is generated, so we verify they own whatever they named.
 */

export default router;
