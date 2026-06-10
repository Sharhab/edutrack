import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
{
schoolId: {
type: mongoose.Schema.Types.ObjectId,
ref: "School",
required: true,
index: true,
},

/**
 * SESSION / TERM
 */
sessionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Session",
  default: null,
  index: true,
},

termId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Term",
  default: null,
  index: true,
},

/**
 * CLASS INFO
 */
name: {
  type: String,
  required: true,
  trim: true,
},

slug: {
  type: String,
  lowercase: true,
  trim: true,
  default: "",
},

/**
 * FLEXIBLE LEVEL
 *
 * Examples:
 * Nursery
 * KG
 * Primary
 * Grade
 * Junior Secondary
 * Senior Secondary
 * Year 7
 * Year 12
 */
level: {
  type: String,
  trim: true,
  default: "",
  index: true,
},

/**
 * OPTIONAL CLASS CODE
 *
 * Examples:
 * JSS1A
 * PRI5B
 * GRADE10
 */
code: {
  type: String,
  trim: true,
  default: "",
},

/**
 * CLASS TEACHER
 */
classTeacherId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

/**
 * CAPACITY
 */
capacity: {
  type: Number,
  default: 40,
  min: 0,
},

/**
 * STATUS
 */
isActive: {
  type: Boolean,
  default: true,
  index: true,
},

},
{
timestamps: true,
}
);

/**

* UNIQUE CLASS NAME PER SCHOOL
  */
  classSchema.index(
  {
  schoolId: 1,
  name: 1,
  },
  {
  unique: true,
  }
  );

/**

* FAST FILTERS
  */
  classSchema.index({
  schoolId: 1,
  level: 1,
  });

export const ClassModel = mongoose.model(
"Class",
classSchema
);

export default ClassModel;
