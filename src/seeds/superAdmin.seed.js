import { connectDB } from "../config/db.js";
import { User } from "../modules/users/user.model.js";
import { hashPassword } from "../utils/hash.js";

await connectDB();

const exists = await User.findOne({ email: "admin@edutrack.com" });

if (!exists) {
  const passwordHash = await hashPassword("12345678");

  await User.create({
    role: "super_admin",
    firstName: "Edu",
    lastName: "Track",
    email: "admin@edutrack.com",
    passwordHash,
  });

  console.log("✅ Super admin created");
} else {
  console.log("Already exists");
}

process.exit();