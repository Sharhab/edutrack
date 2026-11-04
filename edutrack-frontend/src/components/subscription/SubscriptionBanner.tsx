


"use client";

import Link from "next/link";

type SubscriptionBannerProps = {
  daysLeft?: number | null;
  subscriptionStatus?: string;
  trialEndsAt?: string | null;
  subscriptionExpiresAt?: string | null;
};

function formatExpiryDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function SubscriptionBanner({
  daysLeft,
  subscriptionStatus,
  trialEndsAt,
  subscriptionExpiresAt,
}: SubscriptionBannerProps) {
  const status = (subscriptionStatus || "").toLowerCase();
  const isTrial = status === "trial";

  const trialEndTime = trialEndsAt
    ? new Date(trialEndsAt).getTime()
    : null;

  const trialDateExpired =
    isTrial &&
    trialEndTime !== null &&
    Number.isFinite(trialEndTime) &&
    trialEndTime <= Date.now();

  const isExpired =
    status === "expired" ||
    status === "blocked" ||
    (daysLeft !== null &&
      daysLeft !== undefined &&
      daysLeft <= 0) ||
    trialDateExpired;

  // Keep expired notices visible even when daysLeft is missing.
  // Before expiry, show the banner only during the final 7 days.
  if (!isExpired && (
    daysLeft === null ||
    daysLeft === undefined ||
    daysLeft > 7
  )) {
    return null;
  }

  const expiryDate = formatExpiryDate(
    isTrial ? trialEndsAt : subscriptionExpiresAt
  );

  const heading = isExpired
    ? isTrial || trialDateExpired
      ? "Your free trial has expired"
      : "Your subscription has expired"
    : isTrial
      ? daysLeft === 1
        ? "Your free trial ends tomorrow"
        : "Your free trial is ending soon"
      : "Your subscription is ending soon";

  const message = isExpired
    ? "Your trial period has ended. Upgrade your school plan to restore or continue access to EduTrack features."
    : isTrial
      ? `Your free trial ends in ${daysLeft} day${
          daysLeft === 1 ? "" : "s"
        }. Upgrade now to prepare for uninterrupted access.`
      : `Your subscription expires in ${daysLeft} day${
          daysLeft === 1 ? "" : "s"
        }. Renew now to prepare for uninterrupted access.`;

  return (
    <section
      role="status"
      aria-live="polite"
      className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${
        isExpired
          ? "border-red-300 bg-red-50 text-red-950"
          : "border-amber-300 bg-amber-50 text-amber-950"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div
            aria-hidden="true"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${
              isExpired ? "bg-red-100" : "bg-amber-100"
            }`}
          >
            {isExpired ? "!" : "⏳"}
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold">
              {heading}
            </h2>

            <p className="mt-1 text-sm leading-6">
              {message}
            </p>

            {expiryDate && (
              <p className="mt-2 text-sm font-semibold">
                {isTrial ? "Trial ended" : "Expiry date"}:{" "}
                {expiryDate}
              </p>
            )}

            {!isExpired && daysLeft !== null &&
              daysLeft !== undefined && (
                <p className="mt-2 text-xs">
                  {daysLeft} day{daysLeft === 1 ? "" : "s"} remaining
                </p>
              )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:min-w-48">
          <Link
            href="/school-admin/billing/upgrade"
            className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
              isExpired
                ? "bg-red-700 text-white hover:bg-red-800"
                : "bg-amber-700 text-white hover:bg-amber-800"
            }`}
          >
            {isExpired ? "Upgrade your plan" : "Upgrade subscription"}
          </Link>

          <Link
            href="/school-admin"
            className="inline-flex items-center justify-center rounded-xl border border-current/20 px-5 py-2.5 text-sm font-semibold transition hover:bg-black/5"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
