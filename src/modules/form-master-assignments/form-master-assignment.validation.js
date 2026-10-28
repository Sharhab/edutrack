import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid ID");

export const assignFormMasterSchema = z.object({
  sessionId: objectId,
  classId: objectId,
  teacherId: objectId,
});

export const reassignFormMasterSchema = z.object({
  teacherId: objectId,
});
