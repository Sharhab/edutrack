import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
  createTimetableRequirementHandler,
  listTimetableRequirementsHandler,
  getTimetableRequirementHandler,
  updateTimetableRequirementHandler,
  deleteTimetableRequirementHandler,
  bulkCreateTimetableRequirementsHandler,
} from "./timetable-requirement.controller.js";

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
BULK CREATE

MUST COME BEFORE /:id
=========================================
*/

router.post(
  "/bulk",
  asyncHandler(
    bulkCreateTimetableRequirementsHandler
  )
);

/*
=========================================
CREATE
=========================================
*/

router.post(
  "/",
  asyncHandler(
    createTimetableRequirementHandler
  )
);

/*
=========================================
LIST

Optional filters:

?sessionId=
?termId=
?classId=
?subjectId=
?teacherId=
?isActive=true
=========================================
*/

router.get(
  "/",
  asyncHandler(
    listTimetableRequirementsHandler
  )
);

/*
=========================================
GET ONE
=========================================
*/

router.get(
  "/:id",
  asyncHandler(
    getTimetableRequirementHandler
  )
);

/*
=========================================
UPDATE
=========================================
*/

router.put(
  "/:id",
  asyncHandler(
    updateTimetableRequirementHandler
  )
);

/*
=========================================
DELETE
=========================================
*/

router.delete(
  "/:id",
  asyncHandler(
    deleteTimetableRequirementHandler
  )
);

export default router;
