"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import SectionCard from "@/components/ui/SectionCard";
import Modal from "@/components/ui/Modal";
import PageLoader from "@/components/ui/PageLoader";
import EmptyState from "@/components/ui/EmptyState";
import FormInput from "@/components/ui/FormInput";
import TenantForm from "@/components/tenants/TenantForm";
import TenantsTable from "@/components/tenants/TenantsTable";
import {
  createTenant,
  deleteTenant,
  getTenants,
  updateTenant,
} from "@/lib/tenants";
import { Tenant, TenantFormValues } from "@/types/tenant";
import { Plus, Search } from "lucide-react";

const initialForm: TenantFormValues = {
  schoolName: "",
  slug: "",
  adminName: "",
  adminEmail: "",
  phone: "",
  address: "",
  plan: "starter",
  status: "active",
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

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<TenantFormValues>(initialForm);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  async function loadTenants() {
    try {
      setLoading(true);
      setPageError("");

      const data = await getTenants();
      setTenants(data.tenants);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message || "Failed to load tenants."
        );
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
        tenant.slug.toLowerCase().includes(query) ||
        (tenant.adminName || "").toLowerCase().includes(query)
      );
    });
  }, [tenants, search]);

  function updateForm(field: keyof TenantFormValues, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
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
      schoolName: tenant.schoolName || "",
      slug: tenant.slug || "",
      adminName: tenant.adminName || "",
      adminEmail: tenant.adminEmail || "",
      phone: tenant.phone || "",
      address: tenant.address || "",
      plan: tenant.plan || "starter",
      status: tenant.status || "active",
      expiryDate: tenant.expiryDate
        ? new Date(tenant.expiryDate).toISOString().slice(0, 10)
        : "",
    });
    setEditOpen(true);
  }

  function openDeleteModal(tenant: Tenant) {
    setSelectedTenant(tenant);
    setActionError("");
    setDeleteOpen(true);
  }

  function validateForm() {
    if (!form.schoolName.trim()) return "School name is required.";
    if (!form.slug.trim()) return "Slug is required.";
    if (!form.adminEmail.trim()) return "Admin email is required.";
    if (!form.plan.trim()) return "Plan is required.";
    if (!form.status.trim()) return "Status is required.";
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

      const created = await createTenant(form);

      setTenants((prev) => [created, ...prev]);
      setCreateOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to create tenant."
        );
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

      const updated = await updateTenant(selectedTenant._id, form);

      setTenants((prev) =>
        prev.map((item) => (item._id === selectedTenant._id ? updated : item))
      );

      setEditOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to update tenant."
        );
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

      setTenants((prev) =>
        prev.filter((item) => item._id !== selectedTenant._id)
      );

      setDeleteOpen(false);
      resetForm();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to delete tenant."
        );
      } else {
        setActionError("Failed to delete tenant.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load tenants"
        description={pageError}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <SectionCard
          title="Tenants"
          subtitle="Manage onboarded schools, plans, and subscription status"
          rightAction={
            <button
              type="button"
              onClick={openCreateModal}
              className="btn-primary"
            >
              <Plus size={16} className="mr-2" />
              Add Tenant
            </button>
          }
        >
          <div className="mb-5">
            <div className="relative max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-11 text-slate-400"
              />
              <div className="[&_input]:pl-11">
                <FormInput
                  label="Search Tenants"
                  name="search"
                  value={search}
                  placeholder="Search by school, email, slug..."
                  onChange={setSearch}
                />
              </div>
            </div>
          </div>

          <TenantsTable
            data={filteredTenants}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
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