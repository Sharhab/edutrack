export function getRiskLevel(avg) {
  if (avg >= 70) return "LOW";
  if (avg >= 50) return "MEDIUM";
  if (avg >= 40) return "HIGH";
  return "CRITICAL";
}

export function getPromotionProbability(avg) {
  if (avg >= 70) return 95;
  if (avg >= 60) return 80;
  if (avg >= 50) return 60;
  if (avg >= 40) return 35;
  return 10;
}