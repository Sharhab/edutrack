"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SectionCard from "../../../../components/ui/SectionCard";
import Modal from "../../../../components/ui/Modal";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import FormInput from "../../../../components/ui/FormInput";
import TenantForm from "../../../../components/tenants/TenantForm";
import TenantsTable from "../../../../components/tenants/TenantsTable";
import TenantControlForm from "../../../../components/tenants/TenantControlForm";
import {
  controlTenant,
  createTenant,
  deleteTenant,
  getTenants,
  updateTenant,
} from "../../../../lib/tenants";
import {
  Tenant,
  TenantControlPayload,
  TenantFormValues,
} from "../../../../types/tenant";
import { Plus, Search } from "lucide-react";

const initialForm: TenantFormValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  plan: "starter", // ✅ OK
  status: "active",
  expiryDate: "",
  adminFirstName: "",
  adminLastName: "",
  adminEmail: "",
  adminPassword: "",
  slug: "",
};

const initialControlForm: TenantControlPayload = {
  status: "active",
  subscriptionStatus: "active",
  expiryDate: "",
};

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [controlOpen, setControlOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<TenantFormValues>(initialForm);
  const [controlForm, setControlForm] =
    useState<TenantControlPayload>(initialControlForm);

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  async function loadTenants() {
    try {
      setLoading(true);
      setPageError("");

      const data = await getTenants();
      setTenants(data.tenants);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(err.response?.data?.message || "Failed to load tenants.");
      } else {
        setPageError("Failed to load tenants.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  const filteredTenants = useMemo(() => {
    if (!search.trim()) return tenants;

    const query = search.toLowerCase();

    return tenants.filter((tenant) => {
      return (
        tenant.schoolName.toLowerCase().includes(query) ||
        tenant.adminEmail.toLowerCase().includes(query) ||
        tenant.slug.toLowerCase().includes(query)
      );
    });
  }, [tenants, search]);

  function updateForm(field: keyof TenantFormValues, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateControlForm(field: keyof TenantControlPayload, value: string) {
    setControlForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setSelectedTenant(null);
    setActionError("");
  }

  function resetControlForm() {
    setControlForm(initialControlForm);
    setSelectedTenant(null);
    setActionError("");
  }

  function openCreateModal() {
    resetForm();
    setCreateOpen(true);
  }

  function openEditModal(tenant: Tenant) {
    setSelectedTenant(tenant);
    setActionError("");
    setForm({
      name: tenant.schoolName || "",
      email: tenant.adminEmail || "",
      phone: tenant.phone || "",
      address: tenant.address || "",
      plan: tenant.plan || "starter",
      status: tenant.status || "active",
      expiryDate: tenant.expiryDate
        ? new Date(tenant.expiryDate).toISOString().slice(0, 10)
        : "",
      adminFirstName: "",
      adminLastName: "",
      adminEmail: tenant.adminEmail || "",
      adminPassword: "",
      slug: tenant.slug || "",
    });
    setEditOpen(true);
  }

  function openDeleteModal(tenant: Tenant) {
    setSelectedTenant(tenant);
    setActionError("");
    setDeleteOpen(true);
  }

  function openControlModal(tenant: Tenant) {
    setSelectedTenant(tenant);
    setActionError("");
    setControlForm({
      status: tenant.status || "active",
      subscriptionStatus: tenant.subscriptionStatus || "active",
      expiryDate: tenant.expiryDate
        ? new Date(tenant.expiryDate).toISOString().slice(0, 10)
        : "",
    });
    setControlOpen(true);
  }

  function validateForm() {
    if (!form.name.trim()) return "School name is required.";
    if (!form.email.trim()) return "School email is required.";
    if (!form.adminFirstName.trim()) return "Admin first name is required.";
    if (!form.adminLastName.trim()) return "Admin last name is required.";
    if (!form.adminEmail.trim()) return "Admin email is required.";
    if (!selectedTenant && !form.adminPassword.trim()) {
      return "Admin password is required.";
    }
    if (!form.plan.trim()) return "Plan is required.";
    if (!form.status.trim()) return "Status is required.";
    if (form.slug && !form.slug.trim()) return "Slug cannot be empty.";
    return "";
  }

  async function handleCreateTenant() {
    const validationError = validateForm();
    if (validationError) {
      setActionError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setActionError("");
      await createTenant(form);
      setCreateOpen(false);
      resetForm();
      await loadTenants();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(err.response?.data?.message || "Failed to create tenant.");
      } else {
        setActionError("Failed to create tenant.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditTenant() {
    if (!selectedTenant?._id) return;

    const validationError = validateForm();
    if (validationError) {
      setActionError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setActionError("");
      await updateTenant(selectedTenant._id, form);
      setEditOpen(false);
      resetForm();
      await loadTenants();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(err.response?.data?.message || "Failed to update tenant.");
      } else {
        setActionError("Failed to update tenant.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTenant() {
    if (!selectedTenant?._id) return;

    try {
      setSubmitting(true);
      setActionError("");
      await deleteTenant(selectedTenant._id);
      setDeleteOpen(false);
      resetForm();
      await loadTenants();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(err.response?.data?.message || "Failed to delete tenant.");
      } else {
        setActionError("Failed to delete tenant.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleControlTenant() {
    if (!selectedTenant?._id) return;

    try {
      setSubmitting(true);
      setActionError("");
      await controlTenant(selectedTenant._id, controlForm);
      setControlOpen(false);
      resetControlForm();
      await loadTenants();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to apply tenant controls."
        );
      } else {
        setActionError("Failed to apply tenant controls.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoader />;

  if (pageError) {
    return <EmptyState title="Unable to load tenants" description={pageError} />;
  }

  return (
    <>
      <div className="space-y-6">
        <SectionCard
          title="Tenants"
          subtitle="Manage onboarded schools, plans, access, and subscription controls"
        >
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-md">
              <label className="mb-2 block text-sm text-slate-300">
                Search Tenants
              </label>
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by school, email, slug..."
                  className="input pl-11"
                />
              </div>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={openCreateModal}
                className="btn-primary inline-flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Create Tenant
              </button>
            </div>
          </div>

          <TenantsTable
            data={filteredTenants}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            onControl={openControlModal}
          />
        </SectionCard>
      </div>

      <Modal
        open={createOpen}
        title="Add Tenant"
        description="Create a new school tenant"
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
      >
        {actionError ? (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </div>
        ) : null}

        <TenantForm
          values={form}
          onChange={updateForm}
          onSubmit={handleCreateTenant}
          submitting={submitting}
          submitLabel="Create Tenant"
        />
      </Modal>

      <Modal
        open={editOpen}
        title="Edit Tenant"
        description="Update selected school tenant information"
        onClose={() => {
          setEditOpen(false);
          resetForm();
        }}
      >
        {actionError ? (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </div>
        ) : null}

        <TenantForm
          values={form}
          onChange={updateForm}
          onSubmit={handleEditTenant}
          submitting={submitting}
          submitLabel="Save Changes"
        />
      </Modal>

      <Modal
        open={controlOpen}
        title="Tenant Controls"
        description="Activate, deactivate, extend expiry, and change subscription status"
        onClose={() => {
          setControlOpen(false);
          resetControlForm();
        }}
      >
        {actionError ? (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </div>
        ) : null}

        {selectedTenant ? (
          <TenantControlForm
            tenant={selectedTenant}
            values={controlForm}
            onChange={updateControlForm}
            onSubmit={handleControlTenant}
            submitting={submitting}
          />
        ) : null}
      </Modal>

      <Modal
        open={deleteOpen}
        title="Delete Tenant"
        description="This action cannot be undone"
        onClose={() => {
          setDeleteOpen(false);
          resetForm();
        }}
      >
        {actionError ? (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </div>
        ) : null}

        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-300">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {selectedTenant?.schoolName}
              </span>
              ?
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDeleteTenant}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
            >
              {submitting ? "Deleting..." : "Delete Tenant"}
            </button>

            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false);
                resetForm();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}