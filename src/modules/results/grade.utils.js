
export function computeGrade(total, bands = []) {
  // Preserve the existing grading rules for schools
  // that have not configured a grading scale.
  if (!Array.isArray(bands) || bands.length === 0) {
    if (total >= 70) return { grade: "A", remark: "Excellent" };
    if (total >= 60) return { grade: "B", remark: "Very Good" };
    if (total >= 50) return { grade: "C", remark: "Good" };
    if (total >= 45) return { grade: "D", remark: "Fair" };
    if (total >= 40) return { grade: "E", remark: "Pass" };
    return { grade: "F", remark: "Fail" };
  }

  const sortedBands = [...bands].sort(
    (a, b) => a.minScore - b.minScore
  );

  const matchingBand = sortedBands.find(
    (band, index) =>
      total >= band.minScore &&
      (total < band.maxScore ||
        (index === sortedBands.length - 1 &&
          total <= band.maxScore))
  );

  if (!matchingBand) {
    // Fail safely rather than assigning an incorrect grade.
    throw new Error(
      `No grading band matches score ${total}.`
    );
  }

  return {
    grade: matchingBand.grade,
    remark: matchingBand.remark,
  };
}
