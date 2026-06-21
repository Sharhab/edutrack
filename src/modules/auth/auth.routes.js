import express from "express";
import { login, logout, me } from "./auth.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", protect, me);
router.post("/logout", protect, logout);

export default router;