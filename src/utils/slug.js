import slugify from "slugify";
import { School } from "../modules/schools/school.model.js";

/**
 * Convert school name → safe subdomain slug
 */
export function generateBaseSlug(name) {
  return slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });
}

/**
 * Ensure uniqueness in DB
 * saldefi → saldefi
 * saldefi → saldefi-1 → saldefi-2
 */
export async function generateUniqueSlug(name) {
  const baseSlug = generateBaseSlug(name);

  let slug = baseSlug;
  let counter = 1;

  while (await School.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}