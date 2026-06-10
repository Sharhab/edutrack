import slugify from "slugify";
import { School } from "./school.model.js";
import { User } from "../users/user.model.js";
import { ApiError } from "../../utils/apiError.js";
import { hashPassword } from "../../utils/hash.js";

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizeDomain(domain) {
  return domain
    ? String(domain).trim().toLowerCase()
    : undefined;
}

export async function generateUniqueSlug(name) {
  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug;
  let count = 1;

  while (await School.findOne({ slug })) {
    slug = `${baseSlug}-${count}`;
    count += 1;
  }

  return slug;
}
async function ensureUniqueDomain(
  domain,
  excludeId = null
) {
  const normalizedDomain =
    normalizeDomain(domain);

  if (!normalizedDomain) return;

  const query = {
    domain: normalizedDomain,
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const exists =
    await School.findOne(query);

  if (exists) {
    throw new ApiError(
      400,
      "A school with this domain already exists"
    );
  }
}

export async function createSchoolWithAdmin(
  payload
) {
  const schoolExists =
    await School.findOne({
      email: normalizeEmail(
        payload.email
      ),
    });

  if (schoolExists) {
    throw new ApiError(
      400,
      "A school with this email already exists"
    );
  }

  const adminExists =
    await User.findOne({
      email: normalizeEmail(
        payload.adminEmail
      ),
    });

  if (adminExists) {
    throw new ApiError(
      400,
      "A user with this admin email already exists"
    );
  }

  await ensureUniqueDomain(
    payload.domain
  );

  const slug =
    await generateUniqueSlug(
      payload.name
    );

  const school =
    await School.create({
      name: payload.name,
      slug,

      email: normalizeEmail(
        payload.email
      ),

      phone: payload.phone,
      address: payload.address,

      // FIXED: no ""
      domain: normalizeDomain(
        payload.domain
      ),

      principalName:
        payload.principalName || "",

      themeColor:
        payload.themeColor ||
        "#06b6d4",

      subscriptionPlan:
        payload.subscriptionPlan,

      subscriptionStatus:
        "pending",
    });

  const passwordHash =
    await hashPassword(
      payload.adminPassword
    );

  const adminUser =
    await User.create({
      schoolId: school._id,
      role: "school_admin",

      firstName:
        payload.adminFirstName,

      lastName:
        payload.adminLastName,

      email: normalizeEmail(
        payload.adminEmail
      ),

      phone:
        payload.adminPhone,

      passwordHash,

      isActive: true,
    });

  return {
    school,
    adminUser: {
      _id: adminUser._id,
      schoolId:
        adminUser.schoolId,
      role: adminUser.role,
      firstName:
        adminUser.firstName,
      lastName:
        adminUser.lastName,
      email:
        adminUser.email,
      phone:
        adminUser.phone,
      isActive:
        adminUser.isActive,
    },
  };
}

export async function getSchools() {
  return School.find().sort({
    createdAt: -1,
  });
}

export async function getSchoolById(id) {
  const school =
    await School.findById(id);

  if (!school) {
    throw new ApiError(
      404,
      "School not found"
    );
  }

  return school;
}

export async function updateSchool(
  id,
  payload
) {
  const school =
    await School.findById(id);

  if (!school) {
    throw new ApiError(
      404,
      "School not found"
    );
  }

  if (
    payload.domain !== undefined
  ) {
    await ensureUniqueDomain(
      payload.domain,
      id
    );

    // FIXED: no ""
    school.domain =
      normalizeDomain(
        payload.domain
      );
  }

  if (
    payload.name !== undefined
  ) {
    school.name = payload.name;
  }

  if (
    payload.email !== undefined
  ) {
    school.email =
      normalizeEmail(
        payload.email
      );
  }

  if (
    payload.phone !== undefined
  ) {
    school.phone =
      payload.phone;
  }

  if (
    payload.address !== undefined
  ) {
    school.address =
      payload.address;
  }

  if (
    payload.principalName !==
    undefined
  ) {
    school.principalName =
      payload.principalName;
  }

  if (
    payload.themeColor !==
    undefined
  ) {
    school.themeColor =
      payload.themeColor;
  }

  if (
    payload.subscriptionPlan !==
    undefined
  ) {
    school.subscriptionPlan =
      payload.subscriptionPlan;
  }

  if (
    payload.subscriptionStatus !==
    undefined
  ) {
    school.subscriptionStatus =
      payload.subscriptionStatus;
  }

  if (
    payload.expiryDate !==
    undefined
  ) {
    school.expiryDate =
      payload.expiryDate ||
      null;
  }

  if (
    payload.isActive !==
    undefined
  ) {
    school.isActive =
      payload.isActive;
  }

  await school.save();

  return school;
}

export async function toggleSchoolStatus(
  id
) {
  const school =
    await School.findById(id);

  if (!school) {
    throw new ApiError(
      404,
      "School not found"
    );
  }

  school.isActive =
    !school.isActive;

  await school.save();

  return school;
}