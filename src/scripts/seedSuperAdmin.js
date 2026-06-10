import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { User } from "../modules/users/user.model.js";
import { env } from "../config/env.js";

dotenv.config();

async function seedSuperAdmin() {
  try {
    // ✅ validate env
    if (!env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    if (!env.SUPER_ADMIN_EMAIL) {
      throw new Error("SUPER_ADMIN_EMAIL is missing in environment variables");
    }

    if (!env.SUPER_ADMIN_PASSWORD) {
      throw new Error("SUPER_ADMIN_PASSWORD is missing in environment variables");
    }

    // ✅ connect DB
    await mongoose.connect(env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // ✅ check if already exists
    const existing = await User.findOne({
      email: env.SUPER_ADMIN_EMAIL.toLowerCase().trim(),
    });

    if (existing) {
      console.log("⚠️ Super admin already exists");
      process.exit(0);
    }

    // ✅ hash password
    const passwordHash = await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, 10);

    // ✅ create user
    const user = await User.create({
      email: env.SUPER_ADMIN_EMAIL.toLowerCase().trim(),
      passwordHash,
      role: "super_admin",
      firstName: "Super",
      lastName: "Admin",
      isActive: true,
    });

    console.log("🎉 Super admin created successfully:");
    console.log({
      email: user.email,
      password: env.SUPER_ADMIN_PASSWORD,
      role: user.role,
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  }
}

seedSuperAdmin();