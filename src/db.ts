import mongoose, { model, Schema, Types } from "mongoose";
const UserSchema = new Schema({
  username: { type: String, unique: true },
  password: String,
});

export const UserModel = model("users", UserSchema);

const tagSchema = new Schema({
  tag: { type: String, required: true },
});

export const tagModel = model("tag", tagSchema);

const contentTypes = ["image", "video", "article", "audio"]; // Extend as needed

const contentSchema = new Schema({
  link: { type: String, required: true },
  type: { type: String, enum: contentTypes, required: true },
  title: { type: String, required: true },
  tags: [{ type: Types.ObjectId, ref: "Tag" }],
  userId: { type: Types.ObjectId, ref: "users", required: true },
});

export const ContentModel = model("Content", contentSchema);
