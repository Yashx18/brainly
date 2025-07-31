import express, { Request, Response } from "express";
import { UserModel } from "./db";
import { LinkModel } from "./db";
import { ContentModel } from "./db";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware";
import { randomHash } from "./utils";
import bcrypt from "bcrypt";
import { z } from "zod";

export const JWTsecret = "kenx18";
const app = express();
const PORT = 3000;
const salt = 10;
app.use(express.json());

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
  const result = signUpSchema.safeParse(req.body);
  if (!result.success) {
    res.json({
      message: "Invalid input",
    });
  }
  // @ts-ignore
  const { username, password } = result.data;

  const existingUser = await UserModel.findOne({
    username,
  });

  if (existingUser) {
    const dbPassword = existingUser.password;
    // @ts-ignore
    const match = await bcrypt.compare(password, dbPassword);
    if (match) {
      const token = jwt.sign(
        {
          id: existingUser._id,
        },
        JWTsecret
      );
      res.json({
        token: token,
      });
    }
  } else {
    res.json({
      message: "Invalid credentials.",
    });
  }
});

const contentZSchema = z.object({
  link: z.string().min(12),
  type: z.string().min(3),
  title: z.string().min(4),
});

app.post("/api/vi/content", authMiddleware, async (req, res) => {
  const result = contentZSchema.safeParse(req.body);
  if (!result.success) {
    res.json({
      message: "Invalid input",
    });
  }
  // @ts-ignore
  const { link, type, title } = result.data;
  await ContentModel.create({
    link,
    type,
    title,
    // @ts-ignore
    userId: req.userId,
    tags: [],
  });

  res.json({
    message: "Content added",
  });
});

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

app.delete("/api/vi/content", authMiddleware, async (req, res) => {
  const contentId = req.body.contentId;

  await ContentModel.deleteMany({
    contentId,
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
  // @ts-ignore
  const { share } = result.data;

  if (share) {
    const hash = randomHash(10);
    await LinkModel.create({
      // @ts-ignore
      userId: req.userId,
      hash: hash,
    });

    res.json({
      hash: `/api/vi/brain/${hash}`,
      message: "Link generated successfully.",
    });
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
    content: content,
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
