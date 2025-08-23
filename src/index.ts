import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { UserModel } from "./db";
import { LinkModel } from "./db";
import { ContentModel } from "./db";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware";
import { randomHash } from "./utils";
import bcrypt from "bcrypt";
import { z } from "zod";
import path from "path";
import multer from "multer";
import { log } from "console";

export const JWTsecret = "kenx18";

const app = express();
const PORT = 3000;
const salt = 10;

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


app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(cookieParser());
const upload = multer({ storage });

const signUpSchema = z.object({
  username: z.string().min(3).max(12),
  password: z.string().min(8).max(12),
});

app.post("/api/vi/sign-up", async (req: Request, res: Response) => {
  const result = signUpSchema.safeParse(req.body);
  if (!result.success) {
    res.json({
      message: "Invalid input",
    });
  }
  // @ts-ignore
  const { username, password } = result.data;

  const hashedPassword = await bcrypt.hash(password, salt);
  try {
    await UserModel.create({
      username,
      password: hashedPassword,
    });
    res.json({
      message: "Sign up successful",
    });
  } catch (e: any) {
    res.status(401).json({
      message: "Username already taken.",
    });
  }
});

const signInSchema = z.object({
  username: z.string().min(3).max(12),
  password: z.string().min(8).max(12),
});

app.post("/api/vi/sign-in", async (req: Request, res: Response) => {
  const result = signInSchema.safeParse(req.body);
  if (!result.success) {
    return res.json({
      message: "Invalid input",
    });
  }
  // @ts-ignore
  const { username, password } = result.data;

  const existingUser = await UserModel.findOne({
    username,
  });

  if (existingUser) {
    try {
      const dbPassword = existingUser.password;
      // @ts-ignore
      const match = await bcrypt.compare(password, dbPassword);
      if (match) {
        const token = jwt.sign(
          {
            id: existingUser._id,
          },
          JWTsecret,
          { expiresIn: "2d" }
        );

        res.cookie("accessToken", token, {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 1000 * 60 * 60 * 24 * 2,
        });
        res.json({
          message: "Sign in Successful !",
        });
      }
    }
    catch (error) {
      console.error(error);
      
    }
  }
});


const contentZSchema = z.object({
  title: z.string().min(4),
  type: z.enum(["text", "URL", "image", "video"]),
  link: z.string().min(12).optional(),
});

app.post(
  "/api/vi/content",
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
      if (type == "image" ) {
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
          type ,
          title,
          // @ts-ignore
          userId: req.userId,
          // @ts-ignore
          tags: [req.userId]
        })
        return res.json({
          message: "Content added (Video)",
          filePath: link,
        });
      }
    }
  }
);

app.get("/api/vi/content", authMiddleware, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;
  const content = await ContentModel.find({
    userId: userId,
  }).populate("userId", "username");
  res.json({
    content,
  });
});


const updateContentZSchema = z.object({
  title: z.string().min(4),
  type: z.enum(["text", "URL", "image", "video"]),
  link: z.string().min(12).optional(),
});

// update content
app.put("/api/vi/content/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = updateContentZSchema.safeParse(req.body);
    if (!result.success) {
      res.json({
        message: "Invalid input",
      });
    }
    const { id } = req.params;
    // @ts-ignore
    const { title, link , type} = result.data;

    const content = await ContentModel.findOneAndUpdate(
      { _id: id, userId: (req as any).userId },
      { title, link, type },
      { new: true } 
    );

    if (!content) {
      return res.status(404).json({ message: "Content not found or not authorized" });
    }

    res.json({
      message: "Content updated successfully",
      content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});


app.delete("/api/vi/content", authMiddleware, async (req, res) => {

  const title = req.body.title;
  const link = req.body.link;
  const type = req.body.type;
  
  const resultId = await ContentModel.find({
    title,
    link,
    type
  }, {
    _id: 1
  })
  
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

const brainShareSchema = z.object({
  share: z.boolean(),
});

app.post("/api/vi/brain/share", authMiddleware, async (req, res) => {
  const result = brainShareSchema.safeParse(req.body);

  if (!result.success) {
    res.json({
      message: "Invalid input",
    });
  }
  const share = result.data;

  if (share) {
    const hash = randomHash(10);
    await LinkModel.create({
      // @ts-ignore
      userId: req.userId,
      hash: hash,
    });

    res.json({
      hash: `/brain/${hash}`,
      message: "Link generated successfully.",
    });

    console.log(`/brain/${hash}`);
  } else {
    await LinkModel.deleteMany({
      // @ts-ignore
      userId: req.userId,
    });
    res.json({
      message: "Link removed successfully..",
    });
  }
});

app.post("/api/vi/brain/:sharelink", async (req, res) => {
  const hash = req.params.sharelink;
  const user = await LinkModel.findOne({
    hash,
  });

  const content = await ContentModel.find({
    userId: user?.userId,
  }).populate("userId", "username");

  res.json({
    info: content,
  });
});

async function connectdb() {
  await mongoose.connect(
    "mongodb+srv://Ken:93549387YH@cluster0.rrelns0.mongodb.net/Brainly"
  );
  console.log("DB Connnected");
}

connectdb();
app.listen(PORT, () => {
  console.log(`Server is running at 'http://localhost:${PORT}'`);
});
