import mongoose from "mongoose";

const teacherAssignmentSchema =
  new mongoose.Schema(
    {
      classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true,
      },

      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
      },

      periods: [
        {
          day: {
            type: String,
            trim: true,
          },

          startTime: {
            type: String,
            trim: true,
          },

          endTime: {
            type: String,
            trim: true,
          },
        },
      ],
    },
    {
      _id: false,
    }
  );

const teacherSchema = new mongoose.Schema(
  {
    /*
    =========================================
    SCHOOL
    =========================================
    */
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    /*
    =========================================
    USER ACCOUNT
    =========================================
    */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    /*
    =========================================
    EMPLOYEE
    =========================================
    */
    employeeId: {
      type: String,
      trim: true,
      default: "",
    },

    qualification: {
      type: String,
      default: "",
      trim: true,
    },

    designation: {
      type: String,
      default: "",
      trim: true,
    },

    staffCategory: {
      type: String,
      default: "",
      trim: true,
    },

    /*
    =========================================
    PERSONAL INFORMATION
    =========================================
    */
    middleName: {
      type: String,
      default: "",
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

    maritalStatus: {
      type: String,
      default: "",
    },

    /*
    =========================================
    CONTACT
    =========================================
    */
    phone: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    /*
    =========================================
    LOCATION
    =========================================
    */
    stateOfOrigin: {
      type: String,
      default: "",
      trim: true,
    },

    lga: {
      type: String,
      default: "",
      trim: true,
    },

    nationality: {
      type: String,
      default: "Nigerian",
      trim: true,
    },

    /*
    =========================================
    EMPLOYMENT
    =========================================
    */
    employmentDate: {
      type: Date,
      default: null,
    },

    employmentType: {
      type: String,
      enum: [
        "full_time",
        "part_time",
        "contract",
        "visiting",
      ],
      default: "full_time",
    },

    /*
    =========================================
    EMERGENCY
    =========================================
    */
    emergencyName: {
      type: String,
      default: "",
      trim: true,
    },

    emergencyPhone: {
      type: String,
      default: "",
      trim: true,
    },

    /*
    =========================================
    HEALTH
    =========================================
    */
    bloodGroup: {
      type: String,
      default: "",
    },

    genotype: {
      type: String,
      default: "",
    },

    /*
    =========================================
    IDENTIFICATION
    =========================================
    */
    nin: {
      type: String,
      default: "",
      trim: true,
    },

    /*
    =========================================
    PHOTO
    =========================================
    */
    photo: {
      type: String,
      default: "",
    },

    /*
    =========================================
    SUBJECTS
    =========================================
    */
    subjectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],

    /*
    =========================================
    CLASSES
    =========================================
    */
    classIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],

    /*
    =========================================
    ADVANCED ASSIGNMENTS
    =========================================
    */
    assignments: [
      teacherAssignmentSchema,
    ],

    /*
    =========================================
    CLASS TEACHER
    =========================================
    */
    classTeacherOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },

    /*
    =========================================
    ACTIVE FLAG
    =========================================
    */
    isActive: {
      type: Boolean,
      default: true,
    },

    /*
    =========================================
    STATUS
    =========================================
    */
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export const Teacher = mongoose.model(
  "Teacher",
  teacherSchema
);

export default Teacher;