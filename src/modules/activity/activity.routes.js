import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { recentActivityHandler } from "./activity.controller.js";

const router = express.Router();

router.use(protect);

router.get("/recent", asyncHandler(recentActivityHandler));

export default router;