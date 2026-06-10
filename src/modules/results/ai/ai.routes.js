import express from "express";
import { getAIResultDashboard } from "./ai.controller.js";

const router = express.Router();

router.get("/admin/dashboard", getAIResultDashboard);

export default router;