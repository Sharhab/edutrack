import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage();

export function runWithTenantContext(tenant, callback) {
  return storage.run(tenant, callback);
}

export function getTenant() {
  return storage.getStore();
}