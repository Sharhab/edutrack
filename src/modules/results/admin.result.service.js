import { Result } from "./result.model.js";

/* =========================================
   ADMIN DASHBOARD OVERVIEW V2
========================================= */
export async function getAdminResultsDashboard({
  schoolId,
  sessionId,
  termId,
}) {
  const filter = { schoolId };

  if (sessionId) filter.sessionId = sessionId;
  if (termId) filter.termId = termId;

  const results = await Result.find(filter)
    .populate("studentId", "firstName lastName")
    .populate("classId", "name")
    .populate("subjectId", "name")
    .lean();

  if (!results.length) {
    return {
      summary: emptySummary(),
      classRanking: [],
      subjectAnalysis: [],
      topStudents: [],
      failList: [],
    };
  }

  /* ================================
     BASIC STATS
  ================================= */
  const totalStudents = new Set(results.map(r => String(r.studentId?._id))).size;
  const totalSubjects = new Set(results.map(r => String(r.subjectId?._id))).size;
  const totalClasses = new Set(results.map(r => String(r.classId?._id))).size;

  const totalScore = results.reduce((sum, r) => sum + (r.total || 0), 0);
  const avgScore = totalScore / results.length;

  /* ================================
     CLASS PERFORMANCE
  ================================= */
  const classMap = new Map();

  for (const r of results) {
    const classId = String(r.classId?._id);

    if (!classMap.has(classId)) {
      classMap.set(classId, {
        classId,
        className: r.classId?.name,
        total: 0,
        count: 0,
      });
    }

    const c = classMap.get(classId);
    c.total += r.total || 0;
    c.count += 1;
  }

  const classRanking = [...classMap.values()]
    .map(c => ({
      ...c,
      average: c.total / c.count,
    }))
    .sort((a, b) => b.average - a.average);

  /* ================================
     SUBJECT ANALYSIS
  ================================= */
  const subjectMap = new Map();

  for (const r of results) {
    const subjectId = String(r.subjectId?._id);

    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, {
        subjectId,
        subjectName: r.subjectId?.name,
        total: 0,
        count: 0,
      });
    }

    const s = subjectMap.get(subjectId);
    s.total += r.total || 0;
    s.count += 1;
  }

  const subjectAnalysis = [...subjectMap.values()]
    .map(s => ({
      ...s,
      average: s.total / s.count,
      difficulty: s.total / s.count < 50 ? "Hard" : "Normal",
    }))
    .sort((a, b) => a.average - b.average);

  /* ================================
     TOP STUDENTS
  ================================= */
  const studentMap = new Map();

  for (const r of results) {
    const id = String(r.studentId?._id);

    if (!studentMap.has(id)) {
      studentMap.set(id, {
        studentId: id,
        name: `${r.studentId?.firstName || ""} ${r.studentId?.lastName || ""}`,
        total: 0,
        count: 0,
      });
    }

    const s = studentMap.get(id);
    s.total += r.total || 0;
    s.count += 1;
  }

  const topStudents = [...studentMap.values()]
    .map(s => ({
      ...s,
      average: s.total / s.count,
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 10);

  /* ================================
     FAIL ANALYSIS
  ================================= */
  const failList = results
    .filter(r => r.total < 40)
    .slice(0, 20);

  return {
    summary: {
      totalResults: results.length,
      totalStudents,
      totalSubjects,
      totalClasses,
      averageScore: Number(avgScore.toFixed(2)),
    },

    classRanking,
    subjectAnalysis,
    topStudents,
    failList,
  };
}

function emptySummary() {
  return {
    totalResults: 0,
    totalStudents: 0,
    totalSubjects: 0,
    totalClasses: 0,
    averageScore: 0,
  };
}