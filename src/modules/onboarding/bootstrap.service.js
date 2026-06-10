import mongoose from "mongoose";

import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";

import { ClassModel } from "../classes/class.model.js";
import { SubjectModel } from "../subjects/subject.model.js";

/**
 * =========================================
 * DEFAULT CLASSES
 * =========================================
 */
const DEFAULT_CLASSES = [
  { name: "Nursery 1", level: "nursery" },
  { name: "Nursery 2", level: "nursery" },

  { name: "Primary 1", level: "primary" },
  { name: "Primary 2", level: "primary" },
  { name: "Primary 3", level: "primary" },
  { name: "Primary 4", level: "primary" },
  { name: "Primary 5", level: "primary" },
  { name: "Primary 6", level: "primary" },

  { name: "JSS 1", level: "junior_secondary" },
  { name: "JSS 2", level: "junior_secondary" },
  { name: "JSS 3", level: "junior_secondary" },

  { name: "SS 1", level: "senior_secondary" },
  { name: "SS 2", level: "senior_secondary" },
  { name: "SS 3", level: "senior_secondary" },
];

/**
 * =========================================
 * DEFAULT SUBJECTS
 * =========================================
 */
const DEFAULT_SUBJECTS = [
  {
    name: "Mathematics",
    code: "MTH",
    category: "general",
    isCore: true,
  },

  {
    name: "English Language",
    code: "ENG",
    category: "general",
    isCore: true,
  },

  {
    name: "Basic Science",
    code: "BSC",
    category: "science",
    isCore: true,
  },

  {
    name: "Civic Education",
    code: "CVE",
    category: "general",
    isCore: true,
  },

  {
    name: "Computer Studies",
    code: "COM",
    category: "science",
    isCore: true,
  },

  {
    name: "Agricultural Science",
    code: "AGR",
    category: "science",
    isCore: false,
  },

  {
    name: "Biology",
    code: "BIO",
    category: "science",
    isCore: false,
  },

  {
    name: "Chemistry",
    code: "CHM",
    category: "science",
    isCore: false,
  },

  {
    name: "Physics",
    code: "PHY",
    category: "science",
    isCore: false,
  },

  {
    name: "Economics",
    code: "ECO",
    category: "commercial",
    isCore: false,
  },
];

/**
 * =========================================
 * SESSION GENERATOR
 * =========================================
 */
function generateAcademicSession() {
  const year = new Date().getFullYear();

  return `${year}/${year + 1}`;
}

/**
 * =========================================
 * BOOTSTRAP SCHOOL
 * =========================================
 */
export async function bootstrapSchoolData(
  schoolId
) {
  console.log(
    "🚀 BOOTSTRAP STARTED:",
    schoolId
  );

  const schoolObjectId =
    mongoose.Types.ObjectId.isValid(
      schoolId
    )
      ? new mongoose.Types.ObjectId(
          schoolId
        )
      : schoolId;

  /**
   * =========================================
   * PREVENT DUPLICATE BOOTSTRAP
   * =========================================
   */
  const existingSession =
    await Session.findOne({
      schoolId: schoolObjectId,
    });

  if (existingSession) {
    console.log(
      "⚠️ School already bootstrapped"
    );

    return {
      success: true,
      message:
        "School already bootstrapped",
    };
  }

  /**
   * =========================================
   * CREATE SESSION
   * =========================================
   */
  const session = await Session.create({
    schoolId: schoolObjectId,

    name: generateAcademicSession(),

    isCurrent: true,

    startsAt: new Date(),

    endsAt: new Date(
      new Date().setFullYear(
        new Date().getFullYear() + 1
      )
    ),
  });

  console.log("✅ Session created");

  /**
   * =========================================
   * CREATE TERMS
   * =========================================
   */
  const firstTerm = await Term.create({
    schoolId: schoolObjectId,
    sessionId: session._id,

    name: "First Term",

    isCurrent: true,
  });

  await Term.create({
    schoolId: schoolObjectId,
    sessionId: session._id,

    name: "Second Term",

    isCurrent: false,
  });

  await Term.create({
    schoolId: schoolObjectId,
    sessionId: session._id,

    name: "Third Term",

    isCurrent: false,
  });

  console.log("✅ Terms created");

  /**
   * =========================================
   * CREATE CLASSES
   * =========================================
   */
  await Promise.all(
    DEFAULT_CLASSES.map(
      async (classItem) => {
        return ClassModel.create({
          schoolId: schoolObjectId,

          sessionId: session._id,

          termId: firstTerm._id,

          name: classItem.name,

          slug: classItem.name
            .toLowerCase()
            .replace(/\s+/g, "-"),

          level: classItem.level,

          capacity: 40,

          isActive: true,
        });
      }
    )
  );

  console.log("✅ Classes created");

  /**
   * =========================================
   * CREATE SUBJECTS
   * =========================================
   */
  await Promise.all(
    DEFAULT_SUBJECTS.map(
      async (subject) => {
        return SubjectModel.create({
          schoolId: schoolObjectId,

          name: subject.name,

          code: subject.code,

          category:
            subject.category ||
            "general",

          isCore:
            subject.isCore || false,

          isActive: true,
        });
      }
    )
  );

  console.log("✅ Subjects created");

  console.log(
    "🎉 SCHOOL BOOTSTRAP COMPLETE"
  );

  return {
    success: true,
    session,
  };
}