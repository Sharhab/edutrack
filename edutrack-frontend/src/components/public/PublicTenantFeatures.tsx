import { Bell, Lock, School, Users } from "lucide-react";

export default function PublicTenantFeatures() {
  const items = [
    {
      icon: <School size={22} />,
      title: "School Workspace",
      description:
        "A dedicated digital space for school operations and communication.",
    },
    {
      icon: <Users size={22} />,
      title: "Parent & Staff Access",
      description:
        "Parents, teachers, and school admins can access their dedicated dashboards.",
    },
    {
      icon: <Bell size={22} />,
      title: "Announcements",
      description:
        "Schools can share important notices and public updates efficiently.",
    },
    {
      icon: <Lock size={22} />,
      title: "Secure Login",
      description:
        "Tenant-aware login routes users into the correct school environment.",
    },
  ];

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
          Why EduTrack
        </p>
        <h2 className="mt-3 text-3xl font-bold text-white">
          Built for modern schools
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
              {item.icon}
            </div>
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}