export function getTrend(scores) {
  if (!scores || scores.length < 2) return "STABLE";

  const first = scores[0];
  const last = scores[scores.length - 1];

  const diff = last - first;

  if (diff > 10) return "IMPROVING";
  if (diff < -10) return "DECLINING";

  return "STABLE";
}