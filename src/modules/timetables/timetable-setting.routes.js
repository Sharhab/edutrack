import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  createTimetableSettingHandler,
  deleteTimetableSettingHandler,
  getTimetableSettingHandler,
  updateTimetableSettingHandler,
} from "./timetable-setting.controller.js";

const router = express.Router();

/*
=========================================
AUTHENTICATION
=========================================
*/

router.use(protect);

/*
=========================================
SCHOOL ADMIN ONLY
=========================================
*/

router.use(
  authorize("school_admin")
);

/*
=========================================
GET SETTINGS

GET /api/timetables/settings?sessionId=...&termId=...
=========================================
*/

router.get(
  "/",
  asyncHandler(
    getTimetableSettingHandler
  )
);

/*
=========================================
CREATE SETTINGS

POST /api/timetables/settings
=========================================
*/

router.post(
  "/",
  asyncHandler(
    createTimetableSettingHandler
  )
);

/*
=========================================
UPDATE SETTINGS

PUT /api/timetables/settings/:id
=========================================
*/

router.put(
  "/:id",
  asyncHandler(
    updateTimetableSettingHandler
  )
);

/*
=========================================
DELETE SETTINGS

DELETE /api/timetables/settings/:id
=========================================
*/

router.delete(
  "/:id",
  asyncHandler(
    deleteTimetableSettingHandler
  )
);

export default router;
