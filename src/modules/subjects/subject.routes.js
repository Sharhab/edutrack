import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createSubjectHandler,
  deleteSubjectHandler,
  getSubjectHandler,
  listSubjectsHandler,
  updateSubjectHandler,
} from "./subject.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin"));

router.post("/", asyncHandler(createSubjectHandler));
router.get("/", asyncHandler(listSubjectsHandler));
router.get("/:id", asyncHandler(getSubjectHandler));
router.put("/:id", asyncHandler(updateSubjectHandler));
router.delete("/:id", asyncHandler(deleteSubjectHandler));

export default router;