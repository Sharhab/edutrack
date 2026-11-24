
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 1) {
    throw new Error("A valid password is required");
  }

  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  if (!password || !hash) return false;

  return bcrypt.compare(password, hash);
}
