
"use client";

export default function SubscriptionBanner({
  daysLeft,
  subscriptionStatus,
}: {
  daysLeft?: number | null;
  subscriptionStatus?: string;
}) {
  if (
    daysLeft === null ||
    daysLeft === undefined ||
    daysLeft > 7
  ) {
    return null;
  }

  const isTrial = subscriptionStatus === "trial";
  const isExpired = daysLeft <= 0;

  const heading = isExpired
    ? isTrial
      ? "Trial has ended"
      : "Subscription expiry reached"
    : isTrial
      ? "Trial ending soon"
      : "Subscription renewal due soon";

  const message = isExpired
    ? "Review your billing status and choose a plan to restore or continue service."
    : isTrial
      ? `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`
      : `Your subscription expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;

  return (
    <div
      role="status"
      className={`rounded-2xl border p-5 shadow-sm ${
        isExpired
          ? "border-red-300 bg-red-50 text-red-800"
          : "border-amber-300 bg-amber-50 text-amber-800"
      }`}
    >
      <h3 className="font-semibold">{heading}</h3>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}
