import mongoose from "mongoose";
import { tenantPlugin } from "../../plugins/tenant.plugin.js";

const studentSchema = new mongoose.Schema(
  {
    /**
     * =========================
     * SCHOOL
     * =========================
     */
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      index: true,
      required: true,
    },

    /**
     * =========================
     * ADMISSION
     * =========================
     */
    admissionNumber: {
      type: String,
      required: true,
      trim: true,
    },

    enrollmentDate: {
      type: Date,
      default: Date.now,
    },

    entryType: {
      type: String,
      enum: [
        "new",
        "transfer",
        "promotion",
        "reentry",
      ],
      default: "new",
    },

    previousSchool: {
      type: String,
      trim: true,
      default: "",
    },

    /**
     * =========================
     * PERSONAL INFORMATION
     * =========================
     */
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    middleName: {
      type: String,
      trim: true,
      default: "",
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      default: "male",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    /**
     * =========================
     * LOCATION
     * =========================
     */
    stateOfOrigin: {
      type: String,
      trim: true,
      default: "",
    },

    lga: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    /**
     * =========================
     * CONTACT
     * =========================
     */
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    /**
     * =========================
     * CLASS
     * =========================
     */
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    /**
     * =========================
     * PARENTS / GUARDIANS
     * =========================
     */
    parentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent",
      },
    ],

    emergencyName: {
      type: String,
      trim: true,
      default: "",
    },

    emergencyPhone: {
      type: String,
      trim: true,
      default: "",
    },

    /**
     * =========================
     * HEALTH
     * =========================
     */
    bloodGroup: {
      type: String,
      enum: [
        "",
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-",
      ],
      default: "",
    },

    genotype: {
      type: String,
      enum: [
        "",
        "AA",
        "AS",
        "SS",
        "AC",
        "SC",
      ],
      default: "",
    },

    /**
     * =========================
     * DOCUMENTS
     * =========================
     */
    nin: {
      type: String,
      trim: true,
      default: "",
    },

    birthCertificateNo: {
      type: String,
      trim: true,
      default: "",
    },

    /**
     * =========================
     * SYSTEM STATUS
     * =========================
     */
    status: {
      type: String,
      enum: [
        "active",
        "inactive",
        "suspended",
        "graduated",
      ],
      default: "active",
    },

    /**
     * =========================
     * PHOTO
     * =========================
     */
    photo: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

/**
 * =========================
 * INDEXES
 * =========================
 */
studentSchema.index(
  {
    schoolId: 1,
    admissionNumber: 1,
  },
  {
    unique: true,
  }
);

studentSchema.index({
  schoolId: 1,
  classId: 1,
});

studentSchema.index({
  schoolId: 1,
  parentIds: 1,
});

studentSchema.index({
  schoolId: 1,
  status: 1,
});

studentSchema.index({
  schoolId: 1,
  firstName: 1,
  lastName: 1,
});

/**
 * =========================
 * VIRTUAL FULL NAME
 * =========================
 */
studentSchema.virtual("fullName").get(function () {
  return [
    this.firstName,
    this.middleName,
    this.lastName,
  ]
    .filter(Boolean)
    .join(" ");
});

/**
 * =========================
 * JSON SETTINGS
 * =========================
 */
studentSchema.set("toJSON", {
  virtuals: true,
});

studentSchema.set("toObject", {
  virtuals: true,
});

/**
 * =========================
 * TENANT PLUGIN
 * =========================
 */
studentSchema.plugin(tenantPlugin);

export const Student =
  mongoose.model(
    "Student",
    studentSchema
  );

export default Student;