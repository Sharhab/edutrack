
import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getMyStudentProfileHandler,
} from "./student-portal.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("student"));

router.get(
  "/me",
  asyncHandler(getMyStudentProfileHandler)
);

export default router;
