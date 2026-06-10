export function computeResult({
  ca1 = 0,
  ca2 = 0,
  assignment = 0,
  exam = 0,
}) {
  const total =
    Number(ca1) +
    Number(ca2) +
    Number(assignment) +
    Number(exam);

  const grade = getGrade(total);
  const remark = getRemark(total);
  const point = getGradePoint(total);

  return {
    total,
    grade,
    remark,
    point,
  };
}

export function getGrade(total) {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";
  return "F";
}

export function getGradePoint(total) {
  if (total >= 70) return 5;
  if (total >= 60) return 4;
  if (total >= 50) return 3;
  if (total >= 45) return 2;
  if (total >= 40) return 1;
  return 0;
}

export function getRemark(total) {
  if (total >= 70) return "Excellent";
  if (total >= 60) return "Very Good";
  if (total >= 50) return "Good";
  if (total >= 45) return "Fair";
  if (total >= 40) return "Pass";
  return "Fail";
}