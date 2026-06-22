
import mongoose from "mongoose";
import { School } from "../schools/school.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ApiError } from "../../utils/apiError.js";

function mapProfile(
  school,
  currentSession,
  currentTerm
) {
  const logoUrl = school.logo
    ? `${process.env.APP_URL}${school.logo}`
    : "";

  return {
    _id: school._id,

    schoolName: school.name,
    email: school.email,
    phone: school.phone,
    address: school.address,

    principalName:
      school.principalName || "",

    currentSession:
      currentSession?.name ||
      school.currentSession ||
      "",

    currentTerm:
      currentTerm?.name ||
      school.currentTerm ||
      "",

    logoUrl,

    themeColor:
      school.themeColor ||
      "#06b6d4",

    domain: school.domain || "",
    fullDomain:
      school.fullDomain || "",
    customDomain:
      school.customDomain || "",

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
    throw new ApiError(
      404,
      "School profile not found"
    );
  }

  // =========================
  // BASIC INFORMATION
  // =========================
  if (payload.schoolName !== undefined) {
    school.name = payload.schoolName.trim();
  }

  if (payload.email !== undefined) {
    school.email = payload.email
      .trim()
      .toLowerCase();
  }

  if (payload.phone !== undefined) {
    school.phone = payload.phone.trim();
  }

  if (payload.address !== undefined) {
    school.address = payload.address.trim();
  }

  if (payload.principalName !== undefined) {
    school.principalName =
      payload.principalName.trim();
  }

  if (payload.themeColor !== undefined) {
    school.themeColor =
      payload.themeColor;
  }

  if (payload.domain !== undefined) {
    school.domain = payload.domain
      .trim()
      .toLowerCase();
  }

  // =========================
  // LOGO
  // =========================
  if (payload.logoUrl !== undefined) {
    school.logo = payload.logoUrl;
  }

  // =========================
  // CURRENT SESSION
  // =========================
  if (payload.currentSession) {
    await Session.updateMany(
      {
        schoolId: user.schoolId,
      },
      {
        isCurrent: false,
      }
    );

    const sessionQuery = {
      schoolId: user.schoolId,
    };

    if (
      mongoose.Types.ObjectId.isValid(
        payload.currentSession
      )
    ) {
      sessionQuery._id =
        payload.currentSession;
    } else {
      sessionQuery.name =
        payload.currentSession;
    }

    const session =
      await Session.findOneAndUpdate(
        sessionQuery,
        {
          $set: {
            isCurrent: true,
          },
        },
        {
          new: true,
        }
      );

    // save session name on school
    school.currentSession =
      session?.name ||
      payload.currentSession;
  }

  // =========================
  // CURRENT TERM
  // =========================
  if (payload.currentTerm) {
    await Term.updateMany(
      {
        schoolId: user.schoolId,
      },
      {
        isCurrent: false,
      }
    );

    const termQuery = {
      schoolId: user.schoolId,
    };

    if (
      mongoose.Types.ObjectId.isValid(
        payload.currentTerm
      )
    ) {
      termQuery._id =
        payload.currentTerm;
    } else {
      termQuery.name =
        payload.currentTerm;
    }

    const term =
      await Term.findOneAndUpdate(
        termQuery,
        {
          $set: {
            isCurrent: true,
          },
        },
        {
          new: true,
        }
      );

    // save term name on school
    school.currentTerm =
      term?.name ||
      payload.currentTerm;
  }

  // =========================
  // SAVE SCHOOL
  // =========================
  await school.save();

  // =========================
  // RETURN UPDATED PROFILE
  // =========================
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