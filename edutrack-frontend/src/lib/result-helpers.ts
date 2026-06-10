export function getTotalScore(
  ca1: string | number,
  ca2: string | number,
  assignment: string | number,
  exam: string | number
) {
  const ca1Num = Number(ca1) || 0;
  const ca2Num = Number(ca2) || 0;
  const assignmentNum = Number(assignment) || 0;
  const examNum = Number(exam) || 0;

  return ca1Num + ca2Num + assignmentNum + examNum;
}

export function getGrade(total: number) {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";
  return "F";
}

export function getRemark(total: number) {
  if (total >= 70) return "Excellent";
  if (total >= 60) return "Very Good";
  if (total >= 50) return "Good";
  if (total >= 45) return "Fair";
  if (total >= 40) return "Pass";
  return "Fail";
}