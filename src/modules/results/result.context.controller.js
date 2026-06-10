import { Teacher } from "../teachers/teacher.model.js";
import { ClassModel } from "../classes/class.model.js";
import { SubjectModel } from "../subjects/subject.model.js";
import { Session } from "../sessions/session.model.js";
import { Term } from "../terms/term.model.js";

export async function getTeacherResultContextHandler(
  req,
  res,
  next
) {
  try {
    const teacher = await Teacher.findOne({
      userId: req.user._id,
      schoolId: req.user.schoolId,
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    /* =========================================
       CLASSES
    ========================================= */

    const classes = await ClassModel.find({
      _id: {
        $in: teacher.classIds || [],
      },

      schoolId: req.user.schoolId,
    }).select("name level");

    /* =========================================
       SUBJECTS
    ========================================= */

    let subjects = [];

    /**
     * If teacher has assigned subjects
     */

    if (
      teacher.subjectIds &&
      teacher.subjectIds.length > 0
    ) {
      subjects = await SubjectModel.find({
        _id: {
          $in: teacher.subjectIds,
        },

        schoolId: req.user.schoolId,

        isActive: true,
      }).select(`
        name
        code
        category
        ca1Max
        ca2Max
        assignmentMax
        examMax
        passMark
      `);
    }

    /**
     * Fallback:
     * return all school subjects
     */

    if (subjects.length === 0) {
      subjects = await SubjectModel.find({
        schoolId: req.user.schoolId,

        isActive: true,
      }).select(`
        name
        code
        category
        ca1Max
        ca2Max
        assignmentMax
        examMax
        passMark
      `);
    }

    /* =========================================
       SESSIONS
    ========================================= */

    const sessions = await Session.find({
      schoolId: req.user.schoolId,
    }).sort({
      createdAt: -1,
    });

    /* =========================================
       TERMS
    ========================================= */

    const terms = await Term.find({
      schoolId: req.user.schoolId,
    }).sort({
      createdAt: -1,
    });

    /* =========================================
       ACTIVE SESSION + TERM
    ========================================= */

    const activeSession =
      sessions.find(
        (s) => s.isCurrent
      ) || sessions[0];

    const activeTerm =
      terms.find(
        (t) => t.isCurrent
      ) || terms[0];

    /* =========================================
       RESPONSE
    ========================================= */

    return res.json({
      success: true,

      data: {
        classes,
        subjects,

        sessions,
        terms,

        session: activeSession,
        term: activeTerm,
      },
    });
  } catch (error) {
    next(error);
  }
}