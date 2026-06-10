import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createTermHandler,
  getTermHandler,
  listTermsHandler,
  setCurrentTermHandler,
} from "./term.controller.js";

const router = express.Router();

router.use(protect);

// ✅ Allow attendance to fetch terms
router.get(
  "/",
  authorize("school_admin", "teacher", "parent"),
  asyncHandler(listTermsHandler)
);

router.get(
  "/:id",
  authorize("school_admin", "teacher", "parent"),
  asyncHandler(getTermHandler)
);

// 🔒 Only admin can create/update
router.post(
  "/",
  authorize("school_admin"),
  asyncHandler(createTermHandler)
);

router.patch(
  "/:id/set-current",
  authorize("school_admin"),
  asyncHandler(setCurrentTermHandler)
);

export default router;

