
import mongoose from "mongoose";
import { School } from "../schools/school.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ApiError } from "../../utils/apiError.js";
import cloudinary from "../../../cloudinary.js";

/**
 * =========================================
 * ACADEMIC CONTEXT HELPERS
 * =========================================
 */

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ""));
}

async function findSessionByValue(value, schoolId) {
  const normalized = String(value ?? "").trim();

  if (!normalized) return null;

  const query = { schoolId };

  if (isValidObjectId(normalized)) {
    query._id = normalized;
  } else {
    query.name = normalized;
  }

  return Session.findOne(query);
}

async function findTermByValue(value, schoolId, sessionId) {
  const normalized = String(value ?? "").trim();

  if (!normalized || !sessionId) return null;

  const query = {
    schoolId,
    sessionId,
  };

  if (isValidObjectId(normalized)) {
    query._id = normalized;
  } else {
    query.name = normalized;
  }

  return Term.findOne(query);
}

/**
 * Return the actual current academic records.
 * The term must belong to the selected session.
 *
 * When database flags are missing, saved school
 * values can be used to resolve the records, but
 * stale school strings are never returned as if
 * they were valid records.
 */
async function resolveAcademicContext(school) {
  const schoolId = school._id;

  let currentSession = await Session.findOne({
    schoolId,
    isCurrent: true,
  }).sort({ createdAt: -1 });

  if (!currentSession && school.currentSession) {
    currentSession = await findSessionByValue(
      school.currentSession,
      schoolId
    );
  }

  let currentTerm = null;

  if (currentSession) {
    currentTerm = await Term.findOne({
      schoolId,
      sessionId: currentSession._id,
      isCurrent: true,
    }).sort({ order: 1, startDate: 1, createdAt: 1 });

    if (!currentTerm && school.currentTerm) {
      currentTerm = await findTermByValue(
        school.currentTerm,
        schoolId,
        currentSession._id
      );
    }
  }

  return {
    currentSession,
    currentTerm,
  };
}

/**
 * =========================================
 * PROFILE MAPPER
 * =========================================
 */

function mapProfile(school, currentSession, currentTerm) {
  const apiUrl =
    process.env.APP_URL ||
    "https://edutrack-dpui.onrender.com";

  let logoUrl = "";

  if (school.logo) {
    if (
      school.logo.startsWith("http://") ||
      school.logo.startsWith("https://")
    ) {
      logoUrl = school.logo;
    } else {
      logoUrl = `${apiUrl}${school.logo}`;
    }
  }

  return {
    _id: school._id,

    schoolName: school.name,
    email: school.email,
    phone: school.phone,
    address: school.address,

    principalName: school.principalName || "",
    motto: school.motto || "",
principalSignature: school.principalSignature || "",
schoolStamp: school.schoolStamp || "",
    // Only report academic periods backed by real records.
    currentSession: currentSession?.name || "",
    currentTerm:
      currentSession && currentTerm ? currentTerm.name : "",

    logoUrl,

    themeColor: school.themeColor || "#06b6d4",

    domain: school.domain || "",
    fullDomain: school.fullDomain || "",
    customDomain: school.customDomain || "",

    slug: school.slug,
  };
}

export async function getSchoolBranding(user) {
  if (!user?.schoolId) {
    throw new ApiError(403, "User is not linked to a school");
  }

  const school = await School.findById(user.schoolId)
    .select(
  "_id name slug domain fullDomain logo themeColor currentSession currentTerm motto principalSignature schoolStamp"
)
    .lean();

  if (!school) {
    throw new ApiError(404, "School not found");
  }

  const apiUrl =
    process.env.APP_URL ||
    "https://edutrack-dpui.onrender.com";

  let logoUrl = school.logo || "";

  if (logoUrl && !/^https?:\/\//i.test(logoUrl)) {
    logoUrl = `${apiUrl}${logoUrl}`;
  }

  return {
    _id: String(school._id),
    schoolName: school.name || "",
    slug: school.slug || "",
    domain: school.domain || "",
    fullDomain: school.fullDomain || "",
    logoUrl,
    motto: school.motto || "",
principalSignature: school.principalSignature || "",
schoolStamp: school.schoolStamp || "",
    themeColor: school.themeColor || "#06b6d4",
    currentSession: school.currentSession || "",
    currentTerm: school.currentTerm || "",
  };
}
/**
 * =========================================
 * GET SCHOOL PROFILE
 * =========================================
 */

export async function getSchoolProfile(user) {
  const school = await School.findById(user.schoolId);

  if (!school) {
    throw new ApiError(404, "School profile not found");
  }

  const { currentSession, currentTerm } =
    await resolveAcademicContext(school);

  return mapProfile(school, currentSession, currentTerm);
}

/**
 * =========================================
 * UPDATE SCHOOL PROFILE
 * =========================================
 */

export async function updateSchoolProfile(payload, user) {
  const school = await School.findById(user.schoolId);

  if (!school) {
    throw new ApiError(404, "School profile not found");
  }

  const academicFieldsSubmitted =
    payload.currentSession !== undefined ||
    payload.currentTerm !== undefined;

  let selectedSession = null;
  let selectedTerm = null;

  if (payload.currentSession !== undefined) {
    const sessionValue = String(payload.currentSession ?? "").trim();

    if (sessionValue) {
      selectedSession = await findSessionByValue(
        sessionValue,
        user.schoolId
      );

      if (!selectedSession) {
        throw new ApiError(
          400,
          "The selected academic session was not found"
        );
      }
    }
  } else {
    const existingContext = await resolveAcademicContext(school);
    selectedSession = existingContext.currentSession;
  }

  if (payload.currentTerm !== undefined) {
    const termValue = String(payload.currentTerm ?? "").trim();

    if (termValue) {
      if (!selectedSession) {
        throw new ApiError(
          400,
          "Select an academic session before selecting a term"
        );
      }

      selectedTerm = await findTermByValue(
        termValue,
        user.schoolId,
        selectedSession._id
      );

      if (!selectedTerm) {
        throw new ApiError(
          400,
          "The selected term does not belong to the selected session"
        );
      }
    }
  } else if (selectedSession) {
    // Keep the current term only if it belongs to the selected session.
    selectedTerm = await Term.findOne({
      schoolId: user.schoolId,
      sessionId: selectedSession._id,
      isCurrent: true,
    }).sort({ order: 1, startDate: 1, createdAt: 1 });
  }

  /**
   * Update ordinary school profile fields.
   */
  if (payload.schoolName !== undefined) {
    school.name = String(payload.schoolName ?? "").trim();
  }

  if (payload.email !== undefined) {
    school.email = String(payload.email ?? "").trim().toLowerCase();
  }

  if (payload.phone !== undefined) {
    school.phone = String(payload.phone ?? "").trim();
  }

  if (payload.address !== undefined) {
    school.address = String(payload.address ?? "").trim();
  }

  if (payload.principalName !== undefined) {
    school.principalName = String(payload.principalName ?? "").trim();
  }
  
  if (payload.motto !== undefined) {
  school.motto = String(payload.motto ?? "").trim();
}

  if (payload.themeColor !== undefined) {
    school.themeColor = payload.themeColor;
  }

  if (payload.domain !== undefined) {
    school.domain = String(payload.domain ?? "").trim().toLowerCase();
  }

  if (payload.logoUrl !== undefined) {
    school.logo = payload.logoUrl;
  }

  /**
   * Synchronize academic flags and school settings.
   * Validate the selected records before changing flags.
   */
  if (academicFieldsSubmitted) {
    await Session.updateMany(
      { schoolId: user.schoolId },
      { $set: { isCurrent: false } }
    );

    await Term.updateMany(
      { schoolId: user.schoolId },
      { $set: { isCurrent: false } }
    );

    if (selectedSession) {
      await Session.updateOne(
        { _id: selectedSession._id, schoolId: user.schoolId },
        { $set: { isCurrent: true } }
      );

      school.currentSession = selectedSession.name;
    } else {
      school.currentSession = "";
    }

    if (selectedSession && selectedTerm) {
      await Term.updateOne(
        {
          _id: selectedTerm._id,
          schoolId: user.schoolId,
          sessionId: selectedSession._id,
        },
        { $set: { isCurrent: true } }
      );

      school.currentTerm = selectedTerm.name;
    } else {
      school.currentTerm = "";
    }
  }

  await school.save();

  return getSchoolProfile(user);
}

/**
 * =========================================
 * UPLOAD SCHOOL LOGO
 * =========================================
 */

export async function uploadSchoolLogo(file, user) {
  const school = await School.findById(user.schoolId);

  if (!school) {
    throw new ApiError(404, "School profile not found");
  }

  if (!file?.buffer) {
    throw new ApiError(400, "Logo file is required");
  }

  let result;

  try {
    result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "edutrack/school-logos",
          resource_type: "image",
          public_id: `school-${user.schoolId}`,
          overwrite: true,
          invalidate: true,
        },
        (error, uploaded) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(uploaded);
        }
      );

      stream.on("error", reject);
      stream.end(file.buffer);
    });
  } catch (error) {
    console.error(
      "[SCHOOL LOGO UPLOAD] Cloudinary error:",
      error?.message || error
    );

    throw new ApiError(
      500,
      error?.message || "Failed to upload school logo"
    );
  }

  if (!result?.secure_url) {
    throw new ApiError(
      500,
      "Cloudinary did not return a secure URL"
    );
  }

  school.logo = result.secure_url;
  await school.save();

  const profile = await getSchoolProfile(user);

  return {
    logoUrl: result.secure_url,
    profile,
  };
}

/**
 * =========================================
 * UPLOAD SCHOOL SIGNATURE OR STAMP
 * =========================================
 */

async function uploadSchoolBrandingImage(file, user, type) {
  const school = await School.findById(user.schoolId);

  if (!school) {
    throw new ApiError(404, "School profile not found");
  }

  if (!file?.buffer) {
    throw new ApiError(400, "Image file is required");
  }

  const configs = {
    signature: {
      field: "principalSignature",
      folder: "edutrack/school-signatures",
      publicId: `school-${user.schoolId}-principal-signature`,
      label: "Principal signature",
    },
    stamp: {
      field: "schoolStamp",
      folder: "edutrack/school-stamps",
      publicId: `school-${user.schoolId}-stamp`,
      label: "School stamp",
    },
  };

  const config = configs[type];

  if (!config) {
    throw new ApiError(400, "Invalid branding image type");
  }

  if (!String(file.mimetype || "").startsWith("image/")) {
    throw new ApiError(400, "Please upload an image file");
  }

  let result;

  try {
    result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: config.folder,
          resource_type: "image",
          public_id: config.publicId,
          overwrite: true,
          invalidate: true,
        },
        (error, uploaded) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(uploaded);
        }
      );

      stream.on("error", reject);
      stream.end(file.buffer);
    });
  } catch (error) {
    console.error(
      `[SCHOOL ${type.toUpperCase()} UPLOAD]`,
      error?.message || error
    );

    throw new ApiError(
      500,
      `Failed to upload ${config.label.toLowerCase()}`
    );
  }

  if (!result?.secure_url) {
    throw new ApiError(
      500,
      "Cloudinary did not return a secure URL"
    );
  }

  school[config.field] = result.secure_url;
  await school.save();

  return {
    [config.field]: result.secure_url,
    profile: await getSchoolProfile(user),
  };
}

export async function uploadPrincipalSignature(file, user) {
  return uploadSchoolBrandingImage(file, user, "signature");
}

export async function uploadSchoolStamp(file, user) {
  return uploadSchoolBrandingImage(file, user, "stamp");
}
/**
 * =========================================
 * DELETE SCHOOL LOGO
 * =========================================
 */

export async function deleteSchoolLogo(user) {
  const school = await School.findById(user.schoolId);

  if (!school) {
    throw new ApiError(404, "School profile not found");
  }

  if (
    school.logo &&
    school.logo.includes("res.cloudinary.com")
  ) {
    try {
      const publicId =
        `edutrack/school-logos/school-${user.schoolId}`;

      await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
      });
    } catch (error) {
      // The database logo is still cleared if Cloudinary deletion fails.
      console.error(
        "[SCHOOL LOGO DELETE] Cloudinary error:",
        error?.message || error
      );
    }
  }

  school.logo = "";
  await school.save();

  return {
    logoUrl: "",
  };
}
