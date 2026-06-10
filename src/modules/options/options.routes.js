import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  classOptionsHandler,
  parentOptionsHandler,
  sessionOptionsHandler,
  studentOptionsHandler,
  subjectOptionsHandler,
  teacherOptionsHandler,
  termOptionsHandler,
} from "./options.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin", "teacher"));

router.get("/classes", asyncHandler(classOptionsHandler));
router.get("/parents", asyncHandler(parentOptionsHandler));
router.get("/teachers", asyncHandler(teacherOptionsHandler));
router.get("/students", asyncHandler(studentOptionsHandler));
router.get("/sessions", asyncHandler(sessionOptionsHandler));
router.get("/terms", asyncHandler(termOptionsHandler));
router.get("/subjects", asyncHandler(subjectOptionsHandler));

export default router;