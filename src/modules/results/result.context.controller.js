
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
      status: "active",
      isActive: true,
    }).lean();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Active teacher profile not found",
      });
    }

    // Only classes assigned to this teacher.
    const classes = await ClassModel.find({
      _id: { $in: teacher.classIds || [] },
      schoolId: req.user.schoolId,
      isActive: { $ne: false },
    })
      .select("name level")
      .sort({ name: 1 })
      .lean();

    const classIds = classes.map((item) => item._id);

    // All active subjects assigned to those classes.
    const subjects = classIds.length
      ? await SubjectModel.find({
          schoolId: req.user.schoolId,
          classIds: { $in: classIds },
          isActive: true,
        })
          .select(
            "name code category ca1Max ca2Max assignmentMax examMax passMark classIds"
          )
          .sort({ name: 1 })
          .lean()
      : [];

    const sessions = await Session.find({
      schoolId: req.user.schoolId,
    }).sort({ createdAt: -1 });

    const terms = await Term.find({
      schoolId: req.user.schoolId,
    }).sort({ createdAt: -1 });

    const activeSession =
      sessions.find((session) => session.isCurrent) ||
      sessions.find((session) => session.isActive) ||
      sessions[0] ||
      null;

    const activeTerm =
      terms.find((term) => term.isCurrent) ||
      terms.find((term) => term.isActive) ||
      terms[0] ||
      null;

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

