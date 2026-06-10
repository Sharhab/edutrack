import mongoose from "mongoose";
import { cleanupIndexes } from "../utils/cleanupIndexes.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected");

    await cleanupIndexes();
  } catch (error) {
    console.error(
      "❌ MongoDB error:",
      error.message
    );

    process.exit(1);
  }
};

export default connectDB;