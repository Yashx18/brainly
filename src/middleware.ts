import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({
        message: "Token not found",
      });
    }

    const verifiedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as {
      id: string;
    };

    if (verifiedToken) {
      // @ts-ignore
      req.userId = verifiedToken.id;
      next();
    } else {
      res.status(403).json({
        message: "You are not logged in.",
      });
    }
  } catch (error) {
    return console.error(error);
  }
};
