"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StatCard from "../../../components/ui/statCard";
import SectionCard from "../../../components/ui/SectionCard";
import Modal from "../../../components/ui/Modal";
import PageLoader from "../../../components/ui/PageLoader";
import EmptyState from "../../../components/ui/EmptyState";
import SubscriptionForm from "../../../components/billing/SubscriptionForm";
import SubscriptionsTable from "../../../components/billing/SubscriptionsTable";
import PaymentsTable from "../../../components/billing/PaymentsTable";
import PayButton from "../../../components/billing/PayButton";
import {
  createSubscription,
  deleteSubscription,
  getPayments,
  getSubscriptions,
  updateSubscription,
} from "../../../lib/billing";
import { getTenants } from "../../../lib/tenants";
import { initializePaystackPayment } from "../../../lib/paystack";
import {
  BillingSummary,
  PaymentRecord,
  Subscription,
  SubscriptionFormValues,
} from "../../../types/billing";
import { Tenant } from "../../../types/tenant";

const initialForm: SubscriptionFormValues = {
  tenantId: "",
  plan: "starter",
  amount: "",
  status: "pending",
  billingCycle: "monthly",
  startDate: "",
  nextRenewalDate: "",
  expiryDate: "",
};

const emptySummary: BillingSummary = {
  totalRevenue: 0,
  activeSubscriptions: 0,
  expiredSubscriptions: 0,
  pendingPayments: 0,
};

export default function SuperAdminBillingPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [summary, setSummary] = useState<BillingSummary>(emptySummary);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [form, setForm] = useState<SubscriptionFormValues>(initialForm);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setPageError("");

      const [subscriptionsData, paymentsData, tenantsData] = await Promise.all([
        getSubscriptions(),
        getPayments(),
        getTenants(),
      ]);

      setSubscriptions(subscriptionsData.subscriptions);
      setSummary(subscriptionsData.summary);
      setPayments(paymentsData);
      setTenants(tenantsData.tenants);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message || "Failed to load billing module."
        );
      } else {
        setPageError("Failed to load billing module.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateForm(field: keyof SubscriptionFormValues, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setSelectedSubscription(null);
    setActionError("");
  }

  function openCreateModal() {
    resetForm();
    setCreateOpen(true);
  }

  function openEditModal(subscription: Subscription) {
    setSelectedSubscription(subscription);
    setActionError("");
    setForm({
      tenantId: subscription.tenantId || "",
      plan: subscription.plan || "starter",
      amount: String(subscription.amount ?? ""),
      status: subscription.status || "pending",
      billingCycle: subscription.billingCycle || "monthly",
      startDate: subscription.startDate
        ? new Date(subscription.startDate).toISOString().slice(0, 10)
        : "",
      nextRenewalDate: subscription.nextRenewalDate
        ? new Date(subscription.nextRenewalDate).toISOString().slice(0, 10)
        : "",
      expiryDate: subscription.expiryDate
        ? new Date(subscription.expiryDate).toISOString().slice(0, 10)
        : "",
    });
    setEditOpen(true);
  }

  function openDeleteModal(subscription: Subscription) {
    setSelectedSubscription(subscription);
    setActionError("");
    setDeleteOpen(true);
  }

  function validateForm() {
    if (!form.tenantId.trim()) return "Tenant is required.";
    if (!form.plan.trim()) return "Plan is required.";
    if (!form.amount.trim()) return "Amount is required.";
    if (!form.status.trim()) return "Status is required.";

    const amount = Number(form.amount);
    if (Number.isNaN(amount) || amount < 0) return "Amount must be valid.";

    return "";
  }

  async function handleCreateSubscription() {
    const validationError = validateForm();

    if (validationError) {
      setActionError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setActionError("");

      const created = await createSubscription(form);
      setSubscriptions((prev) => [created, ...prev]);
      setCreateOpen(false);
      resetForm();
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to create subscription."
        );
      } else {
        setActionError("Failed to create subscription.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubscription() {
    if (!selectedSubscription?._id) return;

    const validationError = validateForm();

    if (validationError) {
      setActionError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setActionError("");

      const updated = await updateSubscription(selectedSubscription._id, form);
      setSubscriptions((prev) =>
        prev.map((item) =>
          item._id === selectedSubscription._id ? updated : item
        )
      );
      setEditOpen(false);
      resetForm();
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to update subscription."
        );
      } else {
        setActionError("Failed to update subscription.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSubscription() {
    if (!selectedSubscription?._id) return;

    try {
      setSubmitting(true);
      setActionError("");

      await deleteSubscription(selectedSubscription._id);
      setSubscriptions((prev) =>
        prev.filter((item) => item._id !== selectedSubscription._id)
      );
      setDeleteOpen(false);
      resetForm();
      await loadData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to delete subscription."
        );
      } else {
        setActionError("Failed to delete subscription.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTenant = useMemo(() => {
    return tenants.find((tenant) => tenant._id === form.tenantId) || null;
  }, [tenants, form.tenantId]);

  async function handlePayWithPaystack() {
    const validationError = validateForm();

    if (validationError) {
      setActionError(validationError);
      return;
    }

    if (!selectedTenant?.adminEmail) {
      setActionError("Selected tenant must have an admin email.");
      return;
    }

    try {
      setPaying(true);
      setActionError("");

      const response = await initializePaystackPayment({
  schoolId: form.tenantId,
  plan: form.plan,
  amount: Number(form.amount),
  email: selectedTenant.adminEmail,
  billingCycle: form.billingCycle,
});
      if (response.authorizationUrl) {
        window.location.href = response.authorizationUrl;
        return;
      }

      setActionError("Paystack authorization URL was not returned.");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Failed to initialize payment."
        );
      } else {
        setActionError("Failed to initialize payment.");
      }
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <PageLoader />;

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load billing module"
        description={pageError}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={`₦${summary.totalRevenue.toLocaleString()}`}
          />
          <StatCard
            title="Active Subscriptions"
            value={summary.activeSubscriptions}
          />
          <StatCard
            title="Expired Subscriptions"
            value={summary.expiredSubscriptions}
          />
          <StatCard
            title="Pending Payments"
            value={summary.pendingPayments}
          />
        </div>

        <SectionCard
          title="Subscriptions"
          subtitle="Manage school plans, renewal dates, and subscription status"
          rightAction={
            <button
              type="button"
              onClick={openCreateModal}
              className="btn-primary"
            >
              Add Subscription
            </button>
          }
        >
          <SubscriptionsTable
            data={subscriptions}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          />
        </SectionCard>

        <SectionCard
          title="Payment History"
          subtitle="Recent payment transactions across school tenants"
        >
          <PaymentsTable data={payments} />
        </SectionCard>
      </div>

      <Modal
        open={createOpen}
        title="Add Subscription"
        description="Create a subscription for a school tenant"
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

        <div className="space-y-5">
          <SubscriptionForm
            values={form}
            tenants={tenants}
            onChange={updateForm}
            onSubmit={handleCreateSubscription}
            submitting={submitting}
            submitLabel="Create Subscription"
          />

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
            <p className="mb-3 text-sm text-cyan-100">
              Or initialize payment immediately with Paystack for this tenant.
            </p>

            <PayButton
              onClick={handlePayWithPaystack}
              loading={paying}
              disabled={!form.tenantId || !form.amount}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={editOpen}
        title="Edit Subscription"
        description="Update selected subscription information"
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

        <div className="space-y-5">
          <SubscriptionForm
            values={form}
            tenants={tenants}
            onChange={updateForm}
            onSubmit={handleEditSubscription}
            submitting={submitting}
            submitLabel="Save Changes"
          />

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
            <p className="mb-3 text-sm text-cyan-100">
              Re-initialize payment with Paystack for this subscription.
            </p>

            <PayButton
              onClick={handlePayWithPaystack}
              loading={paying}
              disabled={!form.tenantId || !form.amount}
              label="Pay / Re-pay with Paystack"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        title="Delete Subscription"
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
              Are you sure you want to delete subscription for{" "}
              <span className="font-semibold text-white">
                {selectedSubscription?.schoolName || "this tenant"}
              </span>
              ?
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDeleteSubscription}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
            >
              {submitting ? "Deleting..." : "Delete Subscription"}
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