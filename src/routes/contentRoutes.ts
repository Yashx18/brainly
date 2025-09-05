import { z } from "zod";
import { ContentModel } from "../db";
import { authMiddleware } from "../middleware";
import { Request, Response, Router } from "express";
import multer from "multer";
import cloudinary from "../cloudinary";
import streamifier from "streamifier";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const contentRouter = Router();

// Validation Schemas
const contentZSchema = z.object({
  title: z.string().min(4),
  type: z.enum(["text", "URL", "image", "video"]),
  link: z.string().min(4).optional(),
});

const getIdZSchema = z.object({
  title: z.string().min(4),
  type: z.enum(["text", "URL", "image", "video"]),
  link: z.string().min(4).optional(),
});

const updateContentZSchema = z.object({
  title: z.string().min(4),
  type: z.enum(["text", "URL", "image", "video"]),
  link: z.string().min(4).optional(),
});

const deleteContentZSchema = z.object({
  title: z.string().min(4),
  type: z.enum(["text", "URL", "image", "video"]),
  link: z.string().min(4).optional(),
});

const uploadToCloudinary = (
  fileBuffer: Buffer,
  resourceType: "image" | "video" | "auto" = "auto"
) =>
  new Promise<{ secure_url: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result as { secure_url: string });
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });

contentRouter.post(
  "/",
  authMiddleware,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const result = contentZSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const { type, title, link } = result.data;

      if (type === "text" || type === "URL") {
        await ContentModel.create({
          title,
          type,
          link,
          // @ts-ignore
          userId: req.userId,
          // @ts-ignore
          tags: [req.userId],
        });
        return res.json({ message: "Content added (Text/URL)" });
      }

      if (req.file) {
        const uploaded = await uploadToCloudinary(req.file.buffer, "auto");
        await ContentModel.create({
          title,
          type,
          link: uploaded.secure_url,
          // @ts-ignore
          userId: req.userId,
          // @ts-ignore
          tags: [req.userId],
        });

        console.log(uploaded.secure_url);

        return res.json({
          message: `Content added (${type})`,
          filePath: uploaded.secure_url,
        });
      }

      return res.status(400).json({ message: "File missing" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

contentRouter.get("/", authMiddleware, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;
  const content = await ContentModel.find({ userId }).populate(
    "userId",
    "username"
  );
  res.json({ content });
});

contentRouter.post(
  "/getId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const result = getIdZSchema.safeParse(req.body);
    if (!result.success) {
      return res.json({ message: "Invalid Input in getting ID" });
    }

    const { title, link, type } = result.data;

    try {
      const found = await ContentModel.find({ title, link, type }, { _id: 1 });
      res.json({ content: found });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Failed to fetch ID" });
    }
  }
);

contentRouter.put(
  "/:id",
  authMiddleware,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const result = updateContentZSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .json({ message: "Invalid input while updating data" });
      }

      const { id } = req.params;
      const { title, type, link } = result.data;

      if (type === "text" || type === "URL") {
        await ContentModel.findOneAndUpdate(
          { _id: id, userId: (req as any).userId },
          { title, type, link },
          { new: true }
        );
        return res.json({ message: "Content updated (Text/URL)" });
      }

      if (req.file) {
        const uploaded = await uploadToCloudinary(req.file.buffer, "auto");
        await ContentModel.findOneAndUpdate(
          { _id: id, userId: (req as any).userId },
          { title, type, link: uploaded.secure_url },
          { new: true }
        );
        return res.json({
          message: `Content updated (${type})`,
          filePath: uploaded.secure_url,
        });
      }

      res.status(400).json({ message: "File missing" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Update failed" });
    }
  }
);

contentRouter.delete("/", authMiddleware, async (req, res) => {
  const result = deleteContentZSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Invalid Input" });
  }

  const { title, link, type } = result.data;
  try {
    const found = await ContentModel.find({ title, link, type }, { _id: 1 });
    if (!found.length) {
      return res.status(404).json({ message: "Content not found" });
    }

    await ContentModel.deleteMany({
      _id: found[0]._id,
      // @ts-ignore
      userId: req.userId,
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default contentRouter;
