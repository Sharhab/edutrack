import Link from "next/link";

type TenantBlockedStateProps = {
  title: string;
  description: string;
};

export default function TenantBlockedState({
  title,
  description,
}: TenantBlockedStateProps) {
  return (
    <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-400/20 bg-red-500/10 p-8 text-center">
      <h2 className="text-3xl font-bold text-white">{title}</h2>
      <p className="mt-4 text-slate-200">{description}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-secondary">
          Back Home
        </Link>

        <Link href="/onboarding" className="btn-primary">
          Start New School
        </Link>
      </div>
    </div>
  );
}