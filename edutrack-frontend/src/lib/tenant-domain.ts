export function getHostFromWindow() {
  if (typeof window === "undefined") return "";
  return window.location.host || "";
}

export function getSubdomain(host: string) {
  const cleanHost = host.split(":")[0];

  if (
    !cleanHost ||
    cleanHost === "localhost" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)
  ) {
    return "";
  }

  const parts = cleanHost.split(".");

  if (parts.length < 3) return "";
  return parts[0];
}

export function getTenantSlugFromUrl(searchParams: URLSearchParams) {
  return searchParams.get("tenant") || searchParams.get("slug") || "";
}