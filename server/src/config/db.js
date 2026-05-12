import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is required to connect to MongoDB.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongodbUri);
  console.log("MongoDB connected");
}
