import { PublicTenantAnnouncement } from "../../types/public-tenant";

type PublicTenantAnnouncementsProps = {
  items: PublicTenantAnnouncement[];
};

function formatDate(date?: string) {
  if (!date) return "No date";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Invalid date";

  return parsed.toLocaleDateString();
}

export default function PublicTenantAnnouncements({
  items = [],
}: PublicTenantAnnouncementsProps) {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
          Public Updates
        </p>

        <h2 className="mt-3 text-3xl font-bold text-white">
          Latest School Announcements
        </h2>

        <p className="mt-2 max-w-2xl text-slate-400">
          Important public updates and notices from the school.
        </p>
      </div>

      {(items?.length ?? 0) > 0 ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-slate-400">
                    {item.message}
                  </p>
                </div>

                <span className="text-xs text-slate-500">
                  {formatDate(item.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center">
          <h4 className="text-base font-semibold text-white">
            No public announcements yet
          </h4>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Public school notices will appear here when published.
          </p>
        </div>
      )}
    </section>
  );
}