import express, { Request, Response } from "express";
import { UserModel } from "./db";
import { ContentModel } from "./db";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware";

export const JWTsecret = "kenx18";
const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/api/vi/sign-up", async (req: Request, res: Response) => {
  const username = req.body.username;
  const password = req.body.password;
  try {
    await UserModel.create({
      username,
      password,
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

app.post("/api/vi/sign-in", async (req: Request, res: Response) => {
  const username = req.body.username;
  const password = req.body.password;
  const existingUser = await UserModel.findOne({
    username,
    password,
  });
  if (existingUser) {
    const token = jwt.sign(
      {
        id: existingUser._id,
      },
      JWTsecret
    );
    res.json({
      token: token,
    });
  } else {
    res.json({
      message: "Invalid credentials.",
    });
  }
});

app.post("/api/vi/content", authMiddleware, async (req, res) => {
  const link = req.body.link;
  const type = req.body.type;
  await ContentModel.create({
    link,
    type,
    title: req.body.title,
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
app.delete("/api/vi/content", (req, res) => {
  const contentId = req.body.contentId;

  await ContentModel.deleteMany({
    contentId,
    userId: req.userId,
  });

  res.json({
    message: "Deleted",
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
