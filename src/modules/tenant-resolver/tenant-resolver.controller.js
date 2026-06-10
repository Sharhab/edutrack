import {
  getPublicTenantPage,
  resolveTenantByDomain,
  resolveTenantBySlug,
} from "./tenant-resolver.service.js";

export async function resolveTenantBySlugHandler(req, res) {
  const data = await resolveTenantBySlug(req.params.slug);

  res.json({
    success: true,
    message: "Tenant resolved successfully",
    data,
  });
}

export async function resolveTenantByDomainHandler(req, res) {
  const data = await resolveTenantByDomain(req.params.domain);

  res.json({
    success: true,
    message: "Tenant resolved successfully",
    data,
  });
}

export async function getPublicTenantPageHandler(req, res) {
  const data = await getPublicTenantPage(req.params.slug);

  res.json({
    success: true,
    message: "Tenant page fetched successfully",
    data,
  });
}