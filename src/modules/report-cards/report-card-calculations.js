
/**
 * Shared report-card calculation helpers.
 *
 * Rules:
 * - Missing scores are not silently converted to zero.
 * - Explicit zero scores remain valid.
 * - Averages are calculated from valid numeric scores only.
 * - Tied averages receive the same competition rank.
 * - Highest/lowest values ignore students without a valid average.
 *
 * IMPORTANT:
 * This module does not decide whether a student's annual results
 * are complete enough to qualify for ranking. That policy must be
 * applied by the service using the school's configured requirements.
 */

const isValidScore = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  typeof value !== "boolean" &&
  Number.isFinite(Number(value));

/**
 * Return a number rounded to the requested decimal places.
 */
export function roundScore(value, decimalPlaces = 1) {
  if (!isValidScore(value)) return null;

  const factor = 10 ** decimalPlaces;

  return Math.round(
    (Number(value) + Number.EPSILON) * factor
  ) / factor;
}

/**
 * Calculate an average without treating missing values as zero.
 *
 * Example:
 * [80, null, 60] => average 70, count 2
 * [0, 80]        => average 40, count 2
 * [null, null]   => average null, count 0
 */
export function calculateAverage(scores = [], decimalPlaces = 1) {
  const validScores = scores.filter(isValidScore).map(Number);

  if (validScores.length === 0) {
    return {
      average: null,
      total: 0,
      count: 0,
    };
  }

  const total = validScores.reduce(
    (sum, score) => sum + score,
    0
  );

  return {
    average: roundScore(total / validScores.length, decimalPlaces),
    total: roundScore(total, decimalPlaces),
    count: validScores.length,
  };
}

/**
 * Calculate highest, lowest and class average.
 *
 * Each student should have:
 * {
 *   studentId: "...",
 *   averageScore: 75
 * }
 *
 * Students with null or invalid averages are excluded.
 */
export function calculateClassAverageStatistics(students = []) {
  const eligible = students
    .filter((student) => isValidScore(student.averageScore))
    .map((student) => ({
      ...student,
      averageScore: Number(student.averageScore),
    }));

  if (eligible.length === 0) {
    return {
      highestAverage: null,
      lowestAverage: null,
      classAverage: null,
      eligibleStudents: 0,
    };
  }

  const averages = eligible.map(
    (student) => student.averageScore
  );

  const classAverage = calculateAverage(averages);

  return {
    highestAverage: roundScore(Math.max(...averages)),
    lowestAverage: roundScore(Math.min(...averages)),
    classAverage: classAverage.average,
    eligibleStudents: eligible.length,
  };
}

/**
 * Rank students by average score using competition ranking.
 *
 * Example:
 * 90, 90, 75, 60 => ranks 1, 1, 3, 4.
 *
 * Students without a valid average receive null rank.
 * Set eligible=false for incomplete or otherwise unrankable
 * students according to the school's approved ranking policy.
 */
export function rankStudentsByAverage(students = []) {
  const rankedCandidates = [];
  const unrankedCandidates = [];

  for (const student of students) {
    const eligible =
      student.eligible !== false &&
      isValidScore(student.averageScore);

    if (!eligible) {
      unrankedCandidates.push({
        ...student,
        position: null,
        positionLabel: "Not ranked",
      });

      continue;
    }

    rankedCandidates.push({
      ...student,
      averageScore: Number(student.averageScore),
    });
  }

  rankedCandidates.sort((a, b) => {
    const scoreDifference = b.averageScore - a.averageScore;

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    // Stable, deterministic order for students with tied scores.
    const nameA = String(
      a.studentName || a.name || a.studentId || ""
    );

    const nameB = String(
      b.studentName || b.name || b.studentId || ""
    );

    return nameA.localeCompare(nameB);
  });

  let previousScore = null;
  let currentRank = 0;

  const ranked = rankedCandidates.map((student, index) => {
    if (
      previousScore === null ||
      student.averageScore !== previousScore
    ) {
      currentRank = index + 1;
    }

    previousScore = student.averageScore;

    return {
      ...student,
      position: currentRank,
      positionLabel: ordinalLabel(currentRank),
    };
  });

  return [...ranked, ...unrankedCandidates];
}

/**
 * Format a competition rank as an ordinal label.
 */
export function ordinalLabel(position) {
  if (!Number.isInteger(position) || position < 1) {
    return "—";
  }

  const remainder100 = position % 100;

  if (remainder100 >= 11 && remainder100 <= 13) {
    return `${position}th`;
  }

  switch (position % 10) {
    case 1:
      return `${position}st`;
    case 2:
      return `${position}nd`;
    case 3:
      return `${position}rd`;
    default:
      return `${position}th`;
  }
}

/**
 * Determine whether a value is a valid numeric score.
 * Exported for services that need the same validation rule.
 */
export { isValidScore };
