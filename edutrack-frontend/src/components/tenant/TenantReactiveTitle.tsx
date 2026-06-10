"use client";

import { useTenant } from "../../components/providers/TenantProvider";
import TenantFaviconAndTitle from "../../components/tenant/TenantFaviconAndTitle";

type TenantReactiveTitleProps = {
  pageTitle: string;
};

export default function TenantReactiveTitle({
  pageTitle,
}: TenantReactiveTitleProps) {
  const { tenant } = useTenant();

  return <TenantFaviconAndTitle pageTitle={pageTitle} tenant={tenant} />;
}