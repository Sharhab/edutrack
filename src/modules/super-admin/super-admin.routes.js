import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  controlTenantHandler,
  deleteTenantHandler,
  getTenantHandler,
  listTenantsHandler,
  superAdminDashboardHandler,
  updateTenantHandler,
} from "./super-admin.controller.js";
import { createSchool } from "../schools/school.controller.js";

const router = express.Router();

router.use(protect);
router.use(authorize("super_admin"));

router.get("/dashboard", asyncHandler(superAdminDashboardHandler));

router.get("/tenants", asyncHandler(listTenantsHandler));
router.post("/tenants", asyncHandler(createSchool));
router.get("/tenants/:id", asyncHandler(getTenantHandler));
router.put("/tenants/:id", asyncHandler(updateTenantHandler));
router.delete("/tenants/:id", asyncHandler(deleteTenantHandler));
router.patch("/tenants/:id/control", asyncHandler(controlTenantHandler));

export default router;