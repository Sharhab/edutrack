import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { User } from "./user.model.js";

const router = express.Router();

/**
 * GET ALL USERS
 * - super_admin → see all users
 * - school_admin → see only users in their school
 */
router.get("/", protect, authorize("super_admin", "school_admin"), async (req, res) => {
  try {
    let filter = {};

    if (req.user.role !== "super_admin") {
      filter.schoolId = req.user.schoolId;
    }

    const users = await User.find(filter).select("-passwordHash");

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * GET SINGLE USER
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // tenant protection
    if (
      req.user.role !== "super_admin" &&
      user.schoolId?.toString() !== req.user.schoolId?.toString()
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;