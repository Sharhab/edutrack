import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createSessionHandler,
  getSessionHandler,
  listSessionsHandler,
  setCurrentSessionHandler,
} from "./session.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin"));

router.post("/", asyncHandler(createSessionHandler));
router.get("/", asyncHandler(listSessionsHandler));
router.get("/:id", asyncHandler(getSessionHandler));
router.patch("/:id/set-current", asyncHandler(setCurrentSessionHandler));

export default router;