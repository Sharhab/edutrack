import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import { listRemindersHandler } from "./reminder.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", asyncHandler(listRemindersHandler));

export default router;