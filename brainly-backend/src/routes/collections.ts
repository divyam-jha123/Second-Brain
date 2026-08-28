import { Router, Request, Response } from "express";
import { Collection } from "../models/collection.js";
import { Notes, Links } from "../models/notes.js";
import { requireAuth, getAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth(), async (req: Request, res: Response) => {
  const { userId } = getAuth(req);

  const collections = await Collection.find({ userId }).sort({
    order: 1,
    createdAt: 1,
  });

  // Note counts drive the sidebar, and one grouped query beats N per-collection ones.
  const counts = await Notes.aggregate<{ _id: string | null; count: number }>([
    { $match: { userId } },
    { $group: { _id: "$collectionId", count: { $sum: 1 } } },
  ]);

  const countByCollection = new Map(
    counts.map((row) => [String(row._id), row.count]),
  );

  return res.json({
    msg: "success",
    collections: collections.map((collection) => ({
      _id: collection._id,
      name: collection.name,
      order: collection.order,
      count: countByCollection.get(String(collection._id)) ?? 0,
    })),
  });
});

router.post("/", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!userId) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    if (!name) {
      return res.status(400).json({ msg: "name is required" });
    }

    const count = await Collection.countDocuments({ userId });
    const collection = await Collection.create({ userId, name, order: count });

    return res.status(201).json({ msg: "success", collection });
  } catch (error) {
    // The { userId, name } unique index rejects duplicates.
    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({ msg: "A collection with that name exists" });
    }
    return res.status(500).json({ msg: "Error creating collection", error });
  }
});

router.patch("/:id", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const update: Record<string, unknown> = {};

    if (typeof req.body.name === "string") update.name = req.body.name.trim();
    if (typeof req.body.order === "number") update.order = req.body.order;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ msg: "No updatable fields provided" });
    }

    const collection = await Collection.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: update },
      { new: true },
    );

    if (!collection) {
      return res.status(404).json({ msg: "Collection not found" });
    }

    return res.json({ msg: "success", collection });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({ msg: "A collection with that name exists" });
    }
    return res.status(500).json({ msg: "Error updating collection", error });
  }
});

router.delete("/:id", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    const collection = await Collection.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!collection) {
      return res.status(404).json({ msg: "Collection not found" });
    }

    // Deleting a folder must never destroy saves — the notes fall back to Inbox.
    await Notes.updateMany(
      { userId, collectionId: collection._id },
      { $set: { collectionId: null } as Record<string, unknown> },
    );

    // A link scoped to this collection would now resolve to nothing, so it is
    // revoked rather than left pointing at an empty page.
    await Links.updateMany(
      { userId, scope: "collection", collectionId: collection._id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );

    return res.json({ msg: "Collection deleted successfully" });
  } catch (error) {
    return res.status(500).json({ msg: "Error deleting collection", error });
  }
});

export default router;
