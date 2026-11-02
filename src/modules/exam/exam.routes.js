

import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import {
  createExamHandler,
  listExamsHandler,
} from "./exam.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("school_admin"));

router.post("/", createExamHandler);
router.get("/", listExamsHandler);

export default router;
