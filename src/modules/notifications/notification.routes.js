import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  listNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
} from "./notification.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", asyncHandler(listNotificationsHandler));
router.patch("/:id/read", asyncHandler(markNotificationReadHandler));
router.patch("/read-all", asyncHandler(markAllNotificationsReadHandler));

export default router;