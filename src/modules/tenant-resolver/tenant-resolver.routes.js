import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getPublicTenantPageHandler,
  resolveTenantByDomainHandler,
  resolveTenantBySlugHandler,
} from "./tenant-resolver.controller.js";

const router = express.Router();

router.get("/tenant/slug/:slug", asyncHandler(resolveTenantBySlugHandler));
router.get("/tenant/domain/:domain", asyncHandler(resolveTenantByDomainHandler));
router.get("/tenant-page/:slug", asyncHandler(getPublicTenantPageHandler));

export default router;