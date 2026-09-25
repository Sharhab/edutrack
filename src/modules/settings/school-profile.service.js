import mongoose from "mongoose";
import { School } from "../schools/school.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";
import { ApiError } from "../../utils/apiError.js";
import cloudinary from "../../../cloudinary.js";
/* =========================================
   PROFILE MAPPER
========================================= */

function mapProfile(
  school,
  currentSession,
  currentTerm
) {
  const apiUrl =
    process.env.APP_URL ||
    "https://edutrack-dpui.onrender.com";

  let logoUrl = "";

  if (school.logo) {
    /*
     * Cloudinary / external URL
     *
     * If the stored logo is already a complete URL,
     * return it exactly as it is.
     */
    if (
      school.logo.startsWith("http://") ||
      school.logo.startsWith("https://")
    ) {
      logoUrl = school.logo;
    } else {
      /*
       * Backward compatibility:
       *
       * Existing logos stored as:
       * /uploads/logos/filename.jpg
       *
       * will continue to work.
       */
      logoUrl = `${apiUrl}${school.logo}`;
    }
  }

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

/* =========================================
   GET SCHOOL PROFILE
========================================= */

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

/* =========================================
   UPDATE SCHOOL PROFILE
========================================= */

export async function updateSchoolProfile(
  payload,
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

  // =========================
  // BASIC INFORMATION
  // =========================

  if (
    payload.schoolName !== undefined
  ) {
    school.name =
      payload.schoolName.trim();
  }

  if (
    payload.email !== undefined
  ) {
    school.email =
      payload.email
        .trim()
        .toLowerCase();
  }

  if (
    payload.phone !== undefined
  ) {
    school.phone =
      payload.phone.trim();
  }

  if (
    payload.address !== undefined
  ) {
    school.address =
      payload.address.trim();
  }

  if (
    payload.principalName !== undefined
  ) {
    school.principalName =
      payload.principalName.trim();
  }

  if (
    payload.themeColor !== undefined
  ) {
    school.themeColor =
      payload.themeColor;
  }

  if (
    payload.domain !== undefined
  ) {
    school.domain =
      payload.domain
        .trim()
        .toLowerCase();
  }

  // =========================
  // LOGO
  // =========================
  //
  // Keep this for compatibility.
  //
  // New logo uploads go through
  // uploadSchoolLogo() and are saved
  // as Cloudinary URLs.
  //
  // If another part of the application
  // sends a logoUrl directly, it will
  // still work.
  //
  if (
    payload.logoUrl !== undefined
  ) {
    school.logo =
      payload.logoUrl;
  }

  // =========================
  // CURRENT SESSION
  // =========================

  if (payload.currentSession) {
    await Session.updateMany(
      {
        schoolId:
          user.schoolId,
      },
      {
        isCurrent: false,
      }
    );

    const sessionQuery = {
      schoolId:
        user.schoolId,
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

    // Save session name on school
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
        schoolId:
          user.schoolId,
      },
      {
        isCurrent: false,
      }
    );

    const termQuery = {
      schoolId:
        user.schoolId,
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

    // Save term name on school
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

/* =========================================
   UPLOAD SCHOOL LOGO
========================================= */

export async function uploadSchoolLogo(
  file,
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

  if (!file?.buffer) {
    throw new ApiError(
      400,
      "Logo file is required"
    );
  }

  /*
   * Upload directly from memory to Cloudinary.
   *
   * This means the logo is NOT dependent
   * on Render's local filesystem.
   */
  const result =
    await new Promise(
      (resolve, reject) => {
        const stream =
          cloudinary.uploader.upload_stream(
            {
              folder:
                "edutrack/school-logos",

              resource_type:
                "image",

              /*
               * One logo per school.
               *
               * Uploading another logo for
               * the same school replaces
               * the previous Cloudinary image.
               */
              public_id:
                `school-${user.schoolId}`,

              overwrite: true,

              invalidate: true,
            },

            (error, uploaded) => {
              if (error) {
                reject(error);
              } else {
                resolve(uploaded);
              }
            }
          );

        stream.end(file.buffer);
      }
    );

  if (!result?.secure_url) {
    throw new ApiError(
      500,
      "Logo upload failed"
    );
  }

  /*
   * Save the permanent Cloudinary URL
   * in MongoDB.
   */
  school.logo =
    result.secure_url;

  await school.save();

  return {
    logoUrl:
      result.secure_url,
  };
}

/* =========================================
   DELETE SCHOOL LOGO
========================================= */

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

  /*
   * If the existing logo is a Cloudinary
   * URL, attempt to remove the Cloudinary
   * asset as well.
   *
   * Failure to remove the remote asset
   * should NOT prevent the school profile
   * from being cleared.
   */
  if (
    school.logo &&
    school.logo.includes(
      "res.cloudinary.com"
    )
  ) {
    try {
      const publicId =
        `edutrack/school-logos/school-${user.schoolId}`;

      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: "image",
          invalidate: true,
        }
      );
    } catch (error) {
      console.error(
        "⚠️ Failed to delete Cloudinary school logo:",
        error?.message ||
          error
      );
    }
  }

  /*
   * Clear logo from MongoDB.
   */
  school.logo = "";

  await school.save();

  return {
    logoUrl: "",
  };
}