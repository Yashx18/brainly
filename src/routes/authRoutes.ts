import jwt from "jsonwebtoken";
import { UserModel } from "../db";
import { z } from "zod";
import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { authMiddleware } from "../middleware";

const authRouter = Router();

dotenv.config();

const salt = process.env.SALT as string;
export const JWTsecret = process.env.JWT_SECRET as string;

const signUpSchema = z.object({
  username: z.string().min(3).max(12),
  password: z.string().min(8).max(12),
});

authRouter.post("/sign-up", async (req: Request, res: Response) => {
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

authRouter.post("/sign-in", async (req: Request, res: Response) => {
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
    } catch (error) {
      console.error(error);
    }
  }
});

authRouter.get(
  "/userInfo",
  authMiddleware,
  async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req?.userId;

    try {
      const response = await UserModel.findOne({
        _id: userId,
      });
      console.log(response);
      res.json({
        info: response?.username
      })
    } catch (error) {
      console.error(error);
      
    }
  }
);

export default authRouter;
