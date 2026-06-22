import { SchoolProfileFormValues } from "../../types/settings";

type SchoolProfilePreviewProps = {
  values: SchoolProfileFormValues;
};

export default function SchoolProfilePreview({
  values,
}: SchoolProfilePreviewProps) {
  const logo = values.logoUrl || "";
  const initials = values.schoolName?.slice(0, 2).toUpperCase() || "SC";

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white">
        Profile Preview
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        Live preview of school branding and information.
      </p>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start gap-4">

          {/* LOGO BLOCK FIXED */}
          <div
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold text-white"
            style={{
              background: logo
                ? "transparent"
                : values.themeColor ||
                  "linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6)",
            }}
          >
            {logo ? (
              <img
                src={logo}
                alt="School Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>

          {/* INFO BLOCK FIXED ALIGNMENT */}
          <div>
            <h4 className="text-xl font-bold text-white">
              {values.schoolName || "School Name"}
            </h4>

            <p className="mt-1 text-sm text-slate-400">
              Principal: {values.principalName || "Not set"}
            </p>

            <p className="text-sm text-slate-400">
              Session: {values.currentSession || "-"} • Term:{" "}
              {values.currentTerm || "-"}
            </p>
          </div>
        </div>

        {/* CONTACT GRID */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Email
            </p>
            <p className="mt-2 text-sm text-white">
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