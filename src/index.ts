import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import authRouter from "./routes/authRoutes";
import brainRouter from "./routes/brainRoutes";
import contentRouter from "./routes/contentRoutes";

dotenv.config();
export const JWTsecret = process.env.JWT_SECRET as string;

const app = express();
const PORT = process.env.PORT;
const mongoURL = process.env.MONGO_URL as string;

app.use(express.json());
app.use(
  cors({
    origin: process.env.APP_URL as string,
    credentials: true,
  })
);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(cookieParser());

app.use("/api/content", contentRouter)
app.use("/api/auth", authRouter)
app.use("/api/brain", brainRouter)

async function connectdb() {
  await mongoose.connect(`${mongoURL}`);
  console.log("DB Connnected");
}

connectdb();
// app.listen(PORT, () => {
//   console.log(`Server is running at 'http://localhost:${PORT}'`);
// });
export default app;