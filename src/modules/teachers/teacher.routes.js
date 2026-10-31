import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createTeacherHandler,
  deleteTeacherHandler,
  getTeacherHandler,
  listTeachersHandler,
  updateTeacherHandler,
 bulkTeachersHandler,
  resetTeacherPasswordHandler'
} from "./teacher.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin"));

router.post(
  "/bulk",
  asyncHandler(
   bulkTeachersHandler
  )
);
router.post("/", asyncHandler(createTeacherHandler));
router.get("/", asyncHandler(listTeachersHandler));
router.post(
  "/:id/reset-password",
  asyncHandler(resetTeacherPasswordHandler)
);
router.get("/:id", asyncHandler(getTeacherHandler));
router.put("/:id", asyncHandler(updateTeacherHandler));
router.delete("/:id", asyncHandler(deleteTeacherHandler));

export default router;
