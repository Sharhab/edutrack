

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
  if (
    daysLeft === null ||
    daysLeft === undefined ||
    daysLeft > 7
  ) {
    return null;
  }

  const isTrial = subscriptionStatus === "trial";
  const isExpired = daysLeft <= 0;

  const expiryDate = formatExpiryDate(
    isTrial ? trialEndsAt : subscriptionExpiresAt
  );

  const heading = isExpired
    ? isTrial
      ? "Your free trial has ended"
      : "Your subscription has expired"
    : isTrial
      ? daysLeft === 1
        ? "Your free trial ends tomorrow"
        : "Your free trial is ending soon"
      : "Your subscription is ending soon";

  const message = isExpired
    ? "Choose a subscription plan to restore or continue using EduTrack, subject to your account's billing status."
    : isTrial
      ? `Your free trial ends in ${daysLeft} day${
          daysLeft === 1 ? "" : "s"
        }. Upgrade before it ends to prepare for uninterrupted access.`
      : `Your subscription expires in ${daysLeft} day${
          daysLeft === 1 ? "" : "s"
        }. Renew before the expiry date to prepare for uninterrupted access.`;

  const showTrialNotice = isTrial;

  return (
    <section
      role="status"
      aria-live="polite"
      className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${
        isExpired
          ? "border-red-300 bg-red-50 text-red-900"
          : "border-amber-300 bg-amber-50 text-amber-950"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div
            aria-hidden="true"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
              isExpired ? "bg-red-100" : "bg-amber-100"
            }`}
          >
            {isExpired ? "!" : "⏳"}
          </div>

          <div>
            <h2 className="text-lg font-bold">
              {heading}
            </h2>

            <p className="mt-1 text-sm leading-6">
              {message}
            </p>

            {expiryDate && (
              <p className="mt-2 text-sm font-semibold">
                {showTrialNotice ? "Trial ends" : "Expiry date"}:{" "}
                {expiryDate}
              </p>
            )}

            {!isExpired && (
              <p className="mt-2 text-xs opacity-80">
                {daysLeft} day{daysLeft === 1 ? "" : "s"} remaining
              </p>
            )}
          </div>
        </div>

        <Link
          href="/school-admin/billing/upgrade"
          className={`inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
            isExpired
              ? "bg-red-700 text-white hover:bg-red-800"
              : "bg-amber-700 text-white hover:bg-amber-800"
          }`}
        >
          {isExpired ? "Choose a plan" : "Upgrade subscription"}
        </Link>
      </div>
    </section>
  );
}
