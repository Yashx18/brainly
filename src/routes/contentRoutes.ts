import { z } from "zod";
import { ContentModel } from "../db";
import { authMiddleware } from "../middleware";
import { Request, Response, Router } from "express";
import path from "path";
import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, "uploads/images");
    } else if (file.mimetype.startsWith("video/")) {
      cb(null, "uploads/videos");
    } else {
      cb(new Error("Invalid file type"), "");
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const contentRouter = Router();

const contentZSchema = z.object({
  title: z.string().min(4),
  type: z.enum(["text", "URL", "image", "video"]),
  link: z.string().min(12).optional(),
});

contentRouter.post(
  "/",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    console.log(req.file);

    const result = contentZSchema.safeParse(req.body);
    if (!result.success) {
      res.json({
        message: "Invalid input",
      });
    }
    // @ts-ignore
    if (result.success) {
      const { type, title } = result.data;
      if (type == "text" || type == "URL") {
        const { link } = result.data;

        await ContentModel.create({
          link,
          type,
          title,
          // @ts-ignore
          userId: req.userId,
          // @ts-ignore
          tags: [req.userId],
        });

        return res.json({
          message: "Content added (Text/URL)",
        });
      }
      if (type == "image") {
        const link = `/uploads/images/${req.file?.filename}`;
        await ContentModel.create({
          link,
          type,
          title,
          // @ts-ignore
          userId: req.userId,
          // @ts-ignore
          tags: [req.userId],
        });

        return res.json({
          message: "Content added (Image)",
          filePath: link,
        });
      } else if (type == "video") {
        const link = `/uploads/videos/${req.file?.filename}`;
        await ContentModel.create({
          link,
          type,
          title,
          // @ts-ignore
          userId: req.userId,
          // @ts-ignore
          tags: [req.userId],
        });
        
        return res.json({
          message: "Content added (Video)",
          filePath: link,
        });
      }
    }
  }
);

contentRouter.get("/", authMiddleware, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;
  const content = await ContentModel.find({
    userId: userId,
  }).populate("userId", "username");
  res.json({
    content,
  });
});

const getIdZSchema = z.object({
  title: z.string().min(4),
  type: z.enum(["text", "URL", "image", "video"]),
  link: z.string().min(12).optional(),
});

contentRouter.post(
  "/getId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const result = getIdZSchema.safeParse(req.body);
    if (!result.data) {
      res.json({
        message: "Invalid Input in getting ID",
      });
    }

    // @ts-ignore
    const { title, link, type } = result.data;

    try {
      const result = await ContentModel.find(
        {
          title,
          link,
          type,
        },
        {
          _id: 1,
        }
      );
      console.log(result[0]._id);
      res.json({
        content: result,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

const updateContentZSchema = z.object({
  title: z.string().min(4),
  type: z.enum(["text", "URL", "image", "video"]),
  link: z.string().min(12).optional(),
});

// update content
contentRouter.put(
  "/:id",
  authMiddleware,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const result = updateContentZSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid input while updating data",
        });
      }
      const { id } = req.params;
      // @ts-ignore
      const { title, type } = result.data;
      console.log(req.file);

      // const content = await ContentModel.findOneAndUpdate(
      //   { _id: id, userId: (req as any).userId },
      //   { title, link, type },
      //   { new: true }
      // );
      if (type == "text" || type == "URL") {
        const { link } = result.data;
        await ContentModel.findOneAndUpdate(
          { _id: id, userId: (req as any).userId },
          { title, link, type },
          { new: true }
        );

        return res.json({
          message: "Content Updated (Text/URL)",
        });
      }
      if (type == "image") {
        const link = `/uploads/images/${req.file?.filename}`;
        await ContentModel.findOneAndUpdate(
          { _id: id, userId: (req as any).userId },
          { title, link, type },
          { new: true }
        );

        return res.json({
          message: "Content Updated (Image)",
          filePath: link,
        });
      } else if (type == "video") {
        const link = `/uploads/videos/${req.file?.filename}`;
        await ContentModel.findOneAndUpdate(
          { _id: id, userId: (req as any).userId },
          { title, link, type },
          { new: true }
        );
        return res.json({
          message: "Content updated (Video)",
          filePath: link,
        });
      }

      res.json({
        message: "Content updated successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Update failed" });
    }
  }
);

const deleteContentZSchema = z.object({
  title: z.string().min(4),
  type: z.enum(["text", "URL", "image", "video"]),
  link: z.string().min(12).optional(),
});

contentRouter.delete("/", authMiddleware, async (req, res) => {
  const result = deleteContentZSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid Input",
    });
  }
  const { title, link, type } = result.data;

  const resultId = await ContentModel.find(
    {
      title,
      link,
      type,
    },
    {
      _id: 1,
    }
  );

  const contentId = resultId[0]._id;
  console.log(contentId);

  await ContentModel.deleteMany({
    _id: contentId,
    // @ts-ignore
    userId: req.userId,
  });

  res.json({
    message: "Deleted",
  });
});


export default contentRouter;