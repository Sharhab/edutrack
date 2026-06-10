import express from "express";

import {
  login,
  logout,
  me,
} from "./auth.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * PUBLIC
 */
router.post("/login", login);

/**
 * PRIVATE
 */
router.get("/me", protect, me);

router.post("/logout", protect, logout);

export default router;