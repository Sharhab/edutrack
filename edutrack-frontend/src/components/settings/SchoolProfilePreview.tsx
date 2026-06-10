import { SchoolProfileFormValues } from "../../types/settings";

type SchoolProfilePreviewProps = {
  values: SchoolProfileFormValues;
};

export default function SchoolProfilePreview({
  values,
}: SchoolProfilePreviewProps) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white">Profile Preview</h3>
      <p className="mt-2 text-sm text-slate-400">
        Live preview of school branding and information.
      </p>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold text-white"
            style={{
              background: values.themeColor || "linear-gradient(to right, #06b6d4, #3b82f6, #8b5cf6)",
            }}
          >
            {values.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={values.logoUrl}
                alt="School Logo"
                className="h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              "SC"
            )}
          </div>

          <div>
            <h4 className="text-xl font-bold text-white">
              {values.schoolName || "School Name"}
            </h4>
            <p className="mt-1 text-sm text-slate-400">
              Principal: {values.principalName || "-"}
            </p>
            <p className="text-sm text-slate-400">
              Session: {values.currentSession || "-"} • {values.currentTerm || "-"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-2 text-sm text-white">{values.email || "-"}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Phone</p>
            <p className="mt-2 text-sm text-white">{values.phone || "-"}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Address</p>
            <p className="mt-2 text-sm text-white">{values.address || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}