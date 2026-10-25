
import { Router } from "express";

import {
  getResultSchemeController,
  listResultSchemesController,
  saveResultSchemeController,
} from "./result-scheme.controller.js";

import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";

const router = Router();

router.use(protect);
router.use(authorize("school_admin"));

router.get("/all", listResultSchemesController);
router.get("/", getResultSchemeController);
router.put("/", saveResultSchemeController);

export default router;
