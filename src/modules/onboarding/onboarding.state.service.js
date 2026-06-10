import slugify from "slugify";
import { School } from "../schools/school.model.js";

export async function createPendingSchool(payload) {
  const slug = slugify(payload.schoolName, {
    lower: true,
    strict: true,
  });

  const domain = `${slug}.edutrack.com.ng`;

  const existing = await School.findOne({ slug });

  if (existing) {
    throw new Error("School already exists");
  }

  const school = await School.create({
    name: payload.schoolName,
    slug,
    domain,

    email: payload.adminEmail,
    phone: payload.phone,

    onboardingStep: "created",
    subscriptionStatus: "inactive",
    isActive: false,
  });

  return school;
}