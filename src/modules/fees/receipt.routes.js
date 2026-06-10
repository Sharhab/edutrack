import express from "express";
import { protect } from "../../middlewares/auth.middleware.js";

import {
  createReceiptHandler,
  listReceiptsHandler,
  getReceiptHandler,
} from "./receipt.controller.js";

const router = express.Router();

router.use(protect);

router.post(
  "/",
  createReceiptHandler
);

router.get(
  "/",
  listReceiptsHandler
);

router.get(
  "/:id",
  getReceiptHandler
);

export default router;