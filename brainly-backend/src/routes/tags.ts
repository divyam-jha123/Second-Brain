import { Router, Request, Response } from "express";
import { Notes } from "../models/notes.js";
import { requireAuth, getAuth } from "../middlewares/auth.js";
import { normalizeTags } from "../utils/util.js";

const router = Router();

/** Tags aren't a collection of their own — they're derived from the notes. */
router.get("/", requireAuth(), async (req: Request, res: Response) => {
  const { userId } = getAuth(req);

  const tags = await Notes.aggregate<{ _id: string; count: number }>([
    { $match: { userId } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
  ]);

  return res.json({
    msg: "success",
    tags: tags.map((tag) => ({ name: tag._id, count: tag.count })),
  });
});

router.patch("/:name", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const from = decodeURIComponent(String(req.params.name)).trim().toLowerCase();
    const [to] = normalizeTags([req.body.name]);

    if (!to) {
      return res.status(400).json({ msg: "name is required" });
    }

    if (from === to) {
      return res.json({ msg: "success", renamed: 0 });
    }

    // Two steps: notes that already carry the target would end up with a
    // duplicate if renamed in place, so drop `from` there and rename elsewhere.
    await Notes.updateMany(
      { userId, tags: { $all: [from, to] } },
      { $pull: { tags: from } },
    );

    const result = await Notes.updateMany(
      { userId, tags: from },
      { $set: { "tags.$": to } },
    );

    return res.json({ msg: "success", renamed: result.modifiedCount });
  } catch (error) {
    return res.status(500).json({ msg: "Error renaming tag", error });
  }
});

router.delete("/:name", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const name = decodeURIComponent(String(req.params.name)).trim().toLowerCase();

    const result = await Notes.updateMany(
      { userId, tags: name },
      { $pull: { tags: name } },
    );

    return res.json({ msg: "success", updated: result.modifiedCount });
  } catch (error) {
    return res.status(500).json({ msg: "Error deleting tag", error });
  }
});

export default router;
