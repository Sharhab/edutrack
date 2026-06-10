import mongoose from "mongoose";
import { getTenant } from "../utils/tenantContext.js";

/**
 * AUTO TENANT SCOPING FOR ALL MODELS
 */
export function tenantPlugin(schema) {
  // Auto inject schoolId on save
  schema.pre("save", function (next) {
    const tenant = getTenant();

    if (tenant?.schoolId && !this.schoolId) {
      this.schoolId = tenant.schoolId;
    }

    next();
  });

  // Auto filter all queries
  function applyTenantFilter(next) {
    const tenant = getTenant();

    if (tenant?.schoolId) {
      this.setQuery({
        ...this.getQuery(),
        schoolId: tenant.schoolId,
      });
    }

    next();
  }

  schema.pre("find", applyTenantFilter);
  schema.pre("findOne", applyTenantFilter);
  schema.pre("updateOne", applyTenantFilter);
  schema.pre("deleteOne", applyTenantFilter);
}