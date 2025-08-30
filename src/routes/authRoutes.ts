import jwt from "jsonwebtoken";
import { Router } from "express";
import jwksClient from "jwks-rsa"; // for verifying Auth0 JWT
import { UserModel } from "../db";


const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

const authRouter = Router();

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key: any) => {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

authRouter.post("/google-login", async (req, res) => {
  const { idToken } = req.body;
  jwt.verify(
    idToken,
    getKey,
    {
      audience: process.env.AUTH0_CLIENT_ID,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ["RS256"],
    },
    async (err: any, decoded: any) => {
      if (err) return res.status(401).json({ error: "Invalid token" });

      // decoded now has user info from Google via Auth0
      const { email, name, sub } = decoded;

      // Find or create user in DB
      let user = await UserModel.findOne({ email });
      if (!user) {
        user = await UserModel.create({ email, username: name, auth0Id: sub });
      }

      // Create YOUR OWN JWT (like before)
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET as string,
        {
          expiresIn: "2d",
        }
      );

      // Send it as HttpOnly cookie
      res.cookie("accessToken", token, {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 2,
      });

      res.json({ message: "Login successful" });
    }
  );
});


export default authRouter;