import { model, Schema, Types } from "mongoose";

const UserSchema = new Schema({
  username: { type: String, unique: true },
  password: String,
});

const TagSchema = new Schema({
  tag: { type: String, required: true },
});

const contentTypes = ["image", "video", "URL", "text"]; // Extend as needed

const contentSchema = new Schema({
  link: { type: String, required: true },
  type: { type: String, enum: contentTypes, required: true },
  title: { type: String, required: true },
  tags: [{ type: Types.ObjectId, ref: "Tag" }],
  userId: { type: Types.ObjectId, ref: "users", required: true },
});

const LinkSchema = new Schema({
  hash: { type: String },
  userId: { type: Types.ObjectId, ref: "users", unique: true, required: true },
});

export const TagModel = model("tag", TagSchema);
export const LinkModel = model("Link", LinkSchema);
export const ContentModel = model("Content", contentSchema);
export const UserModel = model("users", UserSchema);
