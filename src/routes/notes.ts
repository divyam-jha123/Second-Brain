import { Router, Request , Response } from "express";
import Notes from "../models/notes.js";
import { create } from "node:domain";
import { error } from "node:console";
const router = Router();

router.get("/", (req, res) => {
  // dashboard
  return res.json({
    msg: "welcome to a server written in typescript",
  });
});

router.get("/:id", async (req: Request, res: Response) => {
  // getNotesById
  try {
    const id = req.params.id;

      const note = await Notes.findById({
        id,  
      })

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

router.post("/create-note", async (req: Request, res: Response) => {
  // create notes
  console.log("/create-note is being hit");
  try {
    const { title, content } = req.body;

    await Notes.create({
      title: title,
      content: content,
    });

    return res.json({
      msg: "success",
    });
  } catch (error) {
    return res.json({
      err: error,
    });
  }
});

router.put(":id", (req, res) => {
  // updatenotes
});

router.delete(":id", (req, res) => {
  // deleteNotesById
});

export default router;
