"use client";

export default function SubscriptionBanner({
  daysLeft,
}: {
  daysLeft?: number | null;
}) {
  if (daysLeft === null || daysLeft === undefined) {
    return null;
  }

  if (daysLeft > 7) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="text-2xl">⚠️</div>

        <div>
          <h3 className="font-semibold text-amber-800">
            Trial Ending Soon
          </h3>

          <p className="text-sm text-amber-700">
            Your free trial expires in{" "}
            <strong>
              {daysLeft} day
              {daysLeft !== 1 ? "s" : ""}
            </strong>
            .
          </p>
        </div>
      </div>
    </div>
  );
}