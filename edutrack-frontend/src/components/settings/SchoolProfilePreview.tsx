import { SchoolProfileFormValues } from "../../types/settings";

type SchoolProfilePreviewProps = {
  values: SchoolProfileFormValues;
};

export default function SchoolProfilePreview({
  values,
}: SchoolProfilePreviewProps) {
  const initials =
    values.schoolName
      ?.split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "SC";

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white">
        Profile Preview
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        Live preview of school branding and information.
      </p>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        {/* HEADER */}
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold text-white"
            style={{
              background:
                values.themeColor ||
                "#06b6d4",
            }}
          >
            {values.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={values.logoUrl}
                alt="School Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="truncate text-xl font-bold text-white">
              {values.schoolName ||
                "School Name"}
            </h4>

            <p className="mt-1 text-sm text-slate-400">
              Principal:
              <span className="ml-1 text-slate-300">
                {values.principalName ||
                  "-"}
              </span>
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                {values.currentSession ||
                  "No Session"}
              </span>

              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
                {values.currentTerm ||
                  "No Term"}
              </span>
            </div>
          </div>
        </div>

        {/* DETAILS */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Email
            </p>

            <p className="mt-2 break-words text-sm text-white">
              {values.email || "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Phone
            </p>

            <p className="mt-2 text-sm text-white">
              {values.phone || "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Address
            </p>

            <p className="mt-2 text-sm text-white">
              {values.address || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}