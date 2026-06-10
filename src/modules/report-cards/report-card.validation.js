import Joi from "joi";

export const studentReportCardSchema = Joi.object({
  studentId: Joi.string().required(),
  sessionId: Joi.string().required(),
  termId: Joi.string().required(),
});

export const classReportSchema = Joi.object({
  classId: Joi.string().required(),
  sessionId: Joi.string().required(),
  termId: Joi.string().required(),
});