import { School } from "../schools/school.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ApiError } from "../../utils/apiError.js";

function mapProfile(school, currentSession, currentTerm) {
  return {
    _id: school._id,

    schoolName: school.name,
    email: school.email,
    phone: school.phone,
    address: school.address,

    principalName: school.principalName || "",

    currentSession: currentSession?.name || "",
    currentTerm: currentTerm?.name || "",

    logoUrl: school.logo || "",
    themeColor: school.themeColor || "#06b6d4",

    domain: school.domain || "",
    fullDomain: school.fullDomain || "",
    customDomain: school.customDomain || "",

    slug: school.slug,
  };
}

export async function getSchoolProfile(
  user
) {
  const school =
    await School.findById(
      user.schoolId
    );

  if (!school) {
    throw new ApiError(
      404,
      "School profile not found"
    );
  }

  const [
    currentSession,
    currentTerm,
  ] = await Promise.all([
    Session.findOne({
      schoolId:
        user.schoolId,
      isCurrent: true,
    }),

    Term.findOne({
      schoolId:
        user.schoolId,
      isCurrent: true,
    }),
  ]);

  return mapProfile(
    school,
    currentSession,
    currentTerm
  );
}

export async function updateSchoolProfile(payload, user) {
  const school = await School.findById(user.schoolId);

  if (!school) {
    throw new ApiError(404, "School profile not found");
  }

  if (payload.schoolName !== undefined) {
    school.name = payload.schoolName;
  }

  if (payload.email !== undefined) {
    school.email = payload.email.trim().toLowerCase();
  }

  if (payload.phone !== undefined) {
    school.phone = payload.phone;
  }

  if (payload.address !== undefined) {
    school.address = payload.address;
  }

  if (payload.principalName !== undefined) {
    school.principalName = payload.principalName;
  }

  if (payload.themeColor !== undefined) {
    school.themeColor = payload.themeColor;
  }

  if (payload.domain !== undefined) {
    school.domain = payload.domain.trim().toLowerCase();
  }

  // FIXED LOGO FIELD CONSISTENCY
  if (payload.logoUrl !== undefined) {
    school.logo = payload.logoUrl;
  }

  await school.save();

  // =========================
  // SESSION SWITCH (FIXED)
  // =========================
  if (payload.currentSession) {
    await Session.updateMany(
      { schoolId: user.schoolId },
      { isCurrent: false }
    );

    // FIX: NEVER assume ObjectId, allow string name like "2026/2027"
    await Session.updateOne(
      {
        schoolId: user.schoolId,
        $or: [
          { _id: payload.currentSession },
          { name: payload.currentSession },
        ],
      },
      { $set: { isCurrent: true } }
    );
  }

  // =========================
  // TERM SWITCH (FIXED SAME PATTERN)
  // =========================
  if (payload.currentTerm) {
    await Term.updateMany(
      { schoolId: user.schoolId },
      { isCurrent: false }
    );

    await Term.updateOne(
      {
        schoolId: user.schoolId,
        $or: [
          { _id: payload.currentTerm },
          { name: payload.currentTerm },
        ],
      },
      { $set: { isCurrent: true } }
    );
  }

  return getSchoolProfile(user);
}
export async function uploadSchoolLogo(
  filePath,
  user
) {
  const school =
    await School.findById(
      user.schoolId
    );

  if (!school) {
    throw new ApiError(
      404,
      "School profile not found"
    );
  }

  school.logo = filePath;

  await school.save();

  return {
    logoUrl:
      school.logo,
  };
}

export async function deleteSchoolLogo(
  user
) {
  const school =
    await School.findById(
      user.schoolId
    );

  if (!school) {
    throw new ApiError(
      404,
      "School profile not found"
    );
  }

  school.logo = "";

  await school.save();

  return {
    logoUrl: "",
  };
}