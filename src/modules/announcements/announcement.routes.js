import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createAnnouncementHandler,
  deleteAnnouncementHandler,
  getAnnouncementHandler,
  listAnnouncementsHandler,
  updateAnnouncementHandler,
} from "./announcement.controller.js";

const router = express.Router();

router.use(protect);

router.post(
  "/",
  authorize("school_admin"),
  asyncHandler(createAnnouncementHandler)
);

router.get(
  "/",
  authorize("school_admin", "teacher", "parent"),
  asyncHandler(listAnnouncementsHandler)
);

router.get(
  "/:id",
  authorize("school_admin", "teacher", "parent"),
  asyncHandler(getAnnouncementHandler)
);

router.put(
  "/:id",
  authorize("school_admin"),
  asyncHandler(updateAnnouncementHandler)
);

router.delete(
  "/:id",
  authorize("school_admin"),
  asyncHandler(deleteAnnouncementHandler)
);

export default router;