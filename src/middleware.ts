import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTsecret } from ".";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.accessToken;

  const verifiedToken = jwt.verify(token as string, JWTsecret);

  if (!token) {
    return res.status(401).json({
      message: "Token not found",
    });
  }

  if (verifiedToken) {
    // @ts-ignore
    req.userId = verifiedToken.id;
    next();
  } else {
    res.status(403).json({
      message: "You are not logged in.",
    });
  }
};
