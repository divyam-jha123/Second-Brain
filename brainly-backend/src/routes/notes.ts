import { Router, Request, Response } from "express";
import { Notes, Links } from "../models/notes.js";
import { requireAuth, getAuth } from "../middlewares/auth.js";
import { generateRandom } from "../utils/util.js";

const router = Router();

router.get("/", requireAuth(), async (req: Request, res: Response) => {
  // dashboard
  const { userId } = getAuth(req);

  const post = await Notes.find({ userId: userId });

  return res.json({
    msg: "welcome to a server written in typescript",
    post,
  });
});

router.get("/:id", requireAuth(), async (req: Request, res: Response) => {
  // getNotesById
  try {
    const id = req.params.id;

    const note = await Notes.findById(id);

    return res.json({
      msg: note,
    });
  } catch (error) {
    return res.json({
      msg: "item not found",
      err: error,
    });
  }
});

router.post(
  "/create-note",
  requireAuth(),
  async (req: Request, res: Response) => {
    // create notes
    try {
      const { title, link } = req.body;
      const { userId } = getAuth(req);

      if (!userId) {
        return res.status(401).json({ msg: "Not authenticated" });
      }

      await Notes.create({
        title: title,
        content: link,
        userId: userId,
      });

      return res.json({
        msg: "success",
      });
    } catch (error) {
      return res.json({
        err: error,
      });
    }
  },
);

router.delete("/:id", requireAuth(), async (req: Request, res: Response) => {
  // deleteNotesById
  try {
    const id = req.params.id;

    const note = await Notes.findByIdAndDelete(id);

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

router.post("/share", requireAuth(), async (req: Request, res: Response) => {
  const share = req.body.share;
  const { userId } = getAuth(req);

  if (share) {
    // Check if a link already exists for this user
    const existingLink = await Links.findOne({ userId });

    if (existingLink) {
      return res.json({
        msg: "Link already exists",
        hash: existingLink.hash,
      });
    }

    const hash = generateRandom(10);
    await Links.create({ userId, hash });

    return res.json({
      msg: "Sharable link generated",
      hash,
    });
  } else {
    await Links.deleteOne({ userId });
    return res.json({
      msg: "Share link removed",
    });
  }
});

router.get('/api/share/:hash', async (req: Request, res: Response) => {
  const hash = req.params.hash;

  const link = await Links.findOne({ hash });

  if (!link) {
    return res.status(404).json({
      msg: "Link not found",
    });
  }

  // Get ALL notes for this user
  const content = await Notes.find({
    userId: link.userId
  });

  return res.json({
    msg: "Link found",
    content,
  });
});

export default router;
