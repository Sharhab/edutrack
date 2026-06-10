"use client";

type TenantNameProps = {
  name?: string;
  className?: string;
};

export default function TenantName({
  name,
  className = "",
}: TenantNameProps) {
  if (!name) {
    return (
      <span className={`text-slate-400 ${className}`}>
        Unknown Tenant
      </span>
    );
  }

  return (
    <span className={`font-semibold text-white ${className}`}>
      {name}
    </span>
  );
}