"use client";

import { useEffect } from "react";
import { ResolvedTenant } from "../../types/tenant-resolver";
import { getBrandColor, getBrandName, getBrandPageTitle } from "../../lib/tenant-branding";

type TenantFaviconAndTitleProps = {
  pageTitle: string;
  tenant?: ResolvedTenant | null;
};

export default function TenantFaviconAndTitle({
  pageTitle,
  tenant,
}: TenantFaviconAndTitleProps) {
  useEffect(() => {
    document.title = getBrandPageTitle(pageTitle, tenant);

    const themeColor = getBrandColor(tenant);

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", themeColor);

    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;

    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    if (tenant?.logoUrl) {
      favicon.href = tenant.logoUrl;
    } else {
      const brand = getBrandName(tenant);
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
          <rect width="100%" height="100%" rx="14" fill="${themeColor}" />
          <text x="50%" y="54%" text-anchor="middle" font-size="24" font-family="Arial" fill="white" font-weight="700">
            ${brand.slice(0, 2).toUpperCase()}
          </text>
        </svg>
      `;
      favicon.href = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  }, [pageTitle, tenant]);

  return null;
}