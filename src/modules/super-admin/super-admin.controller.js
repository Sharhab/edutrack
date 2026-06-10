import { updateSchoolSchema } from "../schools/school.validation.js";
import { controlTenantSchema } from "./super-admin.validation.js";
import {
  controlTenant,
  deleteTenant,
  getSuperAdminDashboard,
  getTenantById,
  getTenants,
  updateTenant,
} from "./super-admin.service.js";

export async function superAdminDashboardHandler(req, res) {
  const data = await getSuperAdminDashboard();

  res.json({
    success: true,
    message: "Super admin dashboard fetched successfully",
    data,
  });
}

export async function listTenantsHandler(req, res) {
  const data = await getTenants();

  res.json({
    success: true,
    message: "Tenants fetched successfully",
    data,
  });
}

export async function getTenantHandler(req, res) {
  const data = await getTenantById(req.params.id);

  res.json({
    success: true,
    message: "Tenant fetched successfully",
    data,
  });
}

export async function updateTenantHandler(req, res) {
  const parsed = updateSchoolSchema.parse(req.body);
  const data = await updateTenant(req.params.id, parsed);

  res.json({
    success: true,
    message: "Tenant updated successfully",
    data,
  });
}

export async function deleteTenantHandler(req, res) {
  const data = await deleteTenant(req.params.id);

  res.json({
    success: true,
    message: "Tenant deleted successfully",
    data,
  });
}

export async function controlTenantHandler(req, res) {
  const parsed = controlTenantSchema.parse(req.body);
  const data = await controlTenant(req.params.id, parsed);

  res.json({
    success: true,
    message: "Tenant control updated successfully",
    data,
  });
}