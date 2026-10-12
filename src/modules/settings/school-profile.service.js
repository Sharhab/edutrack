
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
     */
    if (
      school.logo.startsWith("http://") ||
      school.logo.startsWith("https://")
    ) {
      logoUrl = school.logo;
    } else {
      /*
       * Backward compatibility for old
       * locally stored logo paths.
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

export async function getSchoolProfile(user) {
  const school = await School.findById(user.schoolId);

  if (!school) {
    throw new ApiError(404, "School profile not found");
  }

  // Resolve the current session first.
  let currentSession = await Session.findOne({
    schoolId: user.schoolId,
    isCurrent: true,
  });

  // Backward compatibility for schools with a saved session name.
  if (!currentSession && school.currentSession) {
    currentSession = await Session.findOne({
      schoolId: user.schoolId,
      name: school.currentSession,
    });
  }

  // Only load a current term that belongs to this session.
  let currentTerm = null;

  if (currentSession) {
    currentTerm = await Term.findOne({
      schoolId: user.schoolId,
      sessionId: currentSession._id,
      isCurrent: true,
    }).sort({ order: 1, startDate: 1 });
  }

  return mapProfile(school, currentSession, currentTerm);
}

export async function updateSchoolProfile(payload, user) {
  const school = await School.findById(user.schoolId);

  if (!school) {
    throw new ApiError(404, "School profile not found");
  }

  /*
   * Resolve the academic records BEFORE changing current flags.
   * The settings form may send either a session/term ID or its name.
   */
  let selectedSession = null;
  let selectedTerm = null;

  if (payload.currentSession !== undefined) {
    const sessionValue = String(payload.currentSession).trim();

    if (sessionValue) {
      const sessionQuery = { schoolId: user.schoolId };

      if (mongoose.Types.ObjectId.isValid(sessionValue)) {
        sessionQuery._id = sessionValue;
      } else {
        sessionQuery.name = sessionValue;
      }

      selectedSession = await Session.findOne(sessionQuery);

      if (!selectedSession) {
        throw new ApiError(
          400,
          "The selected academic session was not found"
        );
      }
    }
  } else {
    selectedSession = await Session.findOne({
      schoolId: user.schoolId,
      isCurrent: true,
    });

    if (!selectedSession && school.currentSession) {
      selectedSession = await Session.findOne({
        schoolId: user.schoolId,
        name: school.currentSession,
      });
    }
  }

  if (payload.currentTerm !== undefined) {
    const termValue = String(payload.currentTerm).trim();

    if (termValue) {
      if (!selectedSession) {
        throw new ApiError(
          400,
          "Select an academic session before selecting a term"
        );
      }

      const termQuery = {
        schoolId: user.schoolId,
        sessionId: selectedSession._id,
      };

      if (mongoose.Types.ObjectId.isValid(termValue)) {
        termQuery._id = termValue;
      } else {
        termQuery.name = termValue;
      }

      selectedTerm = await Term.findOne(termQuery);

      if (!selectedTerm) {
        throw new ApiError(
          400,
          "The selected term does not belong to the selected session"
        );
      }
    }
  } else if (selectedSession) {
    selectedTerm = await Term.findOne({
      schoolId: user.schoolId,
      sessionId: selectedSession._id,
      isCurrent: true,
    }).sort({ order: 1, startDate: 1 });
  }

  // Update ordinary profile fields.
  if (payload.schoolName !== undefined) {
    school.name = payload.schoolName.trim();
  }

  if (payload.email !== undefined) {
    school.email = payload.email.trim().toLowerCase();
  }

  if (payload.phone !== undefined) {
    school.phone = payload.phone.trim();
  }

  if (payload.address !== undefined) {
    school.address = payload.address.trim();
  }

  if (payload.principalName !== undefined) {
    school.principalName = payload.principalName.trim();
  }

  if (payload.themeColor !== undefined) {
    school.themeColor = payload.themeColor;
  }

  if (payload.domain !== undefined) {
    school.domain = payload.domain.trim().toLowerCase();
  }

  if (payload.logoUrl !== undefined) {
    school.logo = payload.logoUrl;
  }

  // Update session and term together.
  if (payload.currentSession !== undefined ||
      payload.currentTerm !== undefined) {
    await Session.updateMany(
      { schoolId: user.schoolId },
      { $set: { isCurrent: false } }
    );

    await Term.updateMany(
      { schoolId: user.schoolId },
      { $set: { isCurrent: false } }
    );

    if (selectedSession) {
      selectedSession.isCurrent = true;
      await selectedSession.save();

      school.currentSession = selectedSession.name;
    } else {
      school.currentSession = "";
    }

    if (selectedTerm) {
      selectedTerm.isCurrent = true;
      await selectedTerm.save();

      school.currentTerm = selectedTerm.name;
    } else {
      school.currentTerm = "";
    }
  }

  await school.save();

  // Return the actual persisted records, not the submitted form values.
  return getSchoolProfile(user);
}

export async function uploadSchoolLogo(
  file,
  user
) {
  const school =
    await School.findById(user.schoolId);

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
   */
  let result;

  try {
    console.log(
      "================================="
    );

    console.log(
      "🟢 SCHOOL LOGO UPLOAD START"
    );

    console.log(
      "School ID:",
      user.schoolId
    );

    console.log(
      "File:",
      {
        originalname:
          file.originalname,
        mimetype:
          file.mimetype,
        size:
          file.size,
        bufferLength:
          file.buffer?.length,
      }
    );

    console.log(
      "Cloudinary configuration:",
      {
        cloudName:
          !!process.env.CLOUDINARY_CLOUD_NAME,
        apiKey:
          !!process.env.CLOUDINARY_API_KEY,
        apiSecret:
          !!process.env.CLOUDINARY_API_SECRET,
      }
    );

    console.log(
      "================================="
    );

    result =
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
                 */
                public_id:
                  `school-${user.schoolId}`,

                overwrite:
                  true,

                invalidate:
                  true,
              },

              (
                error,
                uploaded
              ) => {
                if (error) {
                  console.error(
                    "❌ CLOUDINARY UPLOAD ERROR:"
                  );

                  console.error(
                    error
                  );

                  reject(error);

                  return;
                }

                console.log(
                  "✅ CLOUDINARY UPLOAD SUCCESS"
                );

                console.log(
                  "Public ID:",
                  uploaded?.public_id
                );

                console.log(
                  "Secure URL:",
                  uploaded?.secure_url
                );

                resolve(
                  uploaded
                );
              }
            );

          stream.on(
            "error",
            (error) => {
              console.error(
                "❌ CLOUDINARY STREAM ERROR:"
              );

              console.error(
                error
              );

              reject(error);
            }
          );

          stream.end(
            file.buffer
          );
        }
      );
  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "❌ SCHOOL LOGO UPLOAD FAILED"
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Name:",
      error?.name
    );

    console.error(
      "HTTP code:",
      error?.http_code
    );

    console.error(
      "Full error:",
      error
    );

    console.error(
      "================================="
    );

    throw new ApiError(
      500,
      error?.message ||
        "Failed to upload school logo"
    );
  }

  // =========================
  // VERIFY CLOUDINARY RESULT
  // =========================

  if (!result?.secure_url) {
    console.error(
      "❌ CLOUDINARY RETURNED NO SECURE URL",
      result
    );

    throw new ApiError(
      500,
      "Cloudinary did not return a secure URL"
    );
  }

  // =========================
  // SAVE CLOUDINARY URL
  // =========================

  school.logo =
    result.secure_url;

  await school.save();

  console.log(
    "✅ SCHOOL LOGO SAVED TO MONGODB:"
  );

  console.log(
    result.secure_url
  );

  // =========================
  // RETURN UPDATED PROFILE
  // =========================

  const profile =
    await getSchoolProfile(user);

  return {
    logoUrl:
      result.secure_url,

    profile,
  };
}

/* =========================================
   DELETE SCHOOL LOGO
========================================= */

export async function deleteSchoolLogo(
  user
) {
  const school =
    await School.findById(user.schoolId);

  if (!school) {
    throw new ApiError(
      404,
      "School profile not found"
    );
  }

  /*
   * If the existing logo is a Cloudinary
   * URL, remove the Cloudinary asset.
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
          resource_type:
            "image",

          invalidate:
            true,
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

  // =========================
  // CLEAR LOGO
  // =========================

  school.logo = "";

  await school.save();

  return {
    logoUrl: "",
  };
}

