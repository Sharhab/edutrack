
"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import ChangePasswordForm from "../../../../components/settings/ChangePasswordForm";
import SchoolProfileForm from "../../../../components/settings/SchoolProfileForm";
import SectionCard from "../../../../components/ui/SectionCard";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";

import {
  getSchoolProfile,
  updateSchoolProfile,
  uploadSchoolLogo,
  uploadPrincipalSignature,
  uploadSchoolStamp,
} from "../../../../lib/settings";

import type { SchoolProfileFormValues } from "../../../../types/settings";

import { useTenant } from "../../../../components/tenant/TenantProvider";
import { mapSchoolProfileToTenantPatch } from "../../../../lib/tenant-patch";
import api from "../../../../lib/axios";

type PaystackBank = {
  name: string;
  code: string;
  slug?: string;
};

const initialForm: SchoolProfileFormValues = {
  schoolName: "",
  email: "",
  phone: "",
  address: "",
  principalName: "",
  motto: "",
  principalSignature: "",
  schoolStamp: "",
  currentSession: "",
  currentTerm: "",
  logoFile: undefined,
  logoUrl: "",
  principalSignatureFile: undefined,
  schoolStampFile: undefined,
  themeColor: "#06b6d4",
};

export default function SchoolAdminSettingsPage() {
  const { patchTenant } = useTenant();

  const [form, setForm] =
    useState<SchoolProfileFormValues>(initialForm);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // Paystack settings
  const [banks, setBanks] = useState<PaystackBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [connectingPaystack, setConnectingPaystack] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [verifiedAccountName, setVerifiedAccountName] = useState("");
  const [paystackMessage, setPaystackMessage] = useState("");
  const [paystackConnected, setPaystackConnected] = useState(false);
  const [paystackVerified, setPaystackVerified] =
    useState<boolean | null>(null);
  const [verificationCheckedAt, setVerificationCheckedAt] =
    useState<string | null>(null);
  const [refreshingPaystackStatus, setRefreshingPaystackStatus] =
    useState(false);

  // Load school profile
  async function loadProfile() {
    try {
      setLoading(true);
      setPageError("");

      const profile = await getSchoolProfile();

      setForm({
        schoolName: profile.schoolName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        principalName: profile.principalName || "",
        currentSession: profile.currentSession || "",
        currentTerm: profile.currentTerm || "",
        logoUrl: profile.logoUrl || "",
        logoFile: undefined,
        themeColor: profile.themeColor || "#06b6d4",
      });

      patchTenant(mapSchoolProfileToTenantPatch(profile));
    } catch (err: unknown) {
      setPageError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              "Failed to load school profile."
          : "Failed to load school profile."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
    // Load the profile once when the page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load Paystack-supported banks
  async function loadPaystackBanks() {
    try {
      setBanksLoading(true);

      const response = await api.get("/finance/paystack/banks");
      const result = response.data?.data ?? response.data;

      setBanks(Array.isArray(result) ? result : []);
    } catch (err: unknown) {
      setPaystackMessage(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "Could not load banks."
          : "Could not load banks."
      );
    } finally {
      setBanksLoading(false);
    }
  }

  useEffect(() => {
    void loadPaystackBanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh the school's Paystack connection and verification status
  async function handleRefreshPaystackStatus() {
    try {
      setRefreshingPaystackStatus(true);

      const response = await api.get(
        "/finance/paystack/subaccount-status"
      );

      const status = response.data?.data ?? response.data;

      setPaystackConnected(Boolean(status?.connected));
      setPaystackVerified(
        typeof status?.isVerified === "boolean"
          ? status.isVerified
          : null
      );
      setVerificationCheckedAt(
        status?.verificationCheckedAt || null
      );

      setPaystackMessage(
        status?.connected
          ? "Paystack subaccount status refreshed."
          : "No Paystack subaccount is connected to this school."
      );
    } catch (err: unknown) {
      setPaystackMessage(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              "Could not refresh Paystack status."
          : "Could not refresh Paystack status."
      );
    } finally {
      setRefreshingPaystackStatus(false);
    }
  }

  useEffect(() => {
    void handleRefreshPaystackStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Verify the bank account with Paystack before connecting it
  async function handleVerifyPaystackAccount() {
    if (!bankCode) {
      setPaystackMessage("Please select your bank.");
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      setPaystackMessage("Enter a valid 10-digit account number.");
      return;
    }

    try {
      setVerifyingAccount(true);
      setPaystackMessage("");
      setVerifiedAccountName("");

      const response = await api.post(
        "/finance/paystack/resolve-account",
        {
          bankCode,
          accountNumber,
        }
      );

      const result = response.data?.data ?? response.data;
      const accountName = result?.accountName;

      if (!accountName) {
        setPaystackMessage(
          "Paystack could not return a verified account name. Please check the details."
        );
        return;
      }

      setVerifiedAccountName(accountName);
      setPaystackMessage(
        "Bank account verified. Confirm the account name before connecting."
      );
    } catch (err: unknown) {
      setVerifiedAccountName("");
      setPaystackMessage(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              "Could not verify this bank account."
          : "Could not verify this bank account."
      );
    } finally {
      setVerifyingAccount(false);
    }
  }

  // Connect the verified account
  async function handleConnectPaystack() {
    if (!bankCode) {
      setPaystackMessage("Please select your bank.");
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      setPaystackMessage("Enter a valid 10-digit account number.");
      return;
    }

    if (!verifiedAccountName) {
      setPaystackMessage(
        "Please verify the bank account before connecting."
      );
      return;
    }

    try {
      setConnectingPaystack(true);
      setPaystackMessage("");

      const response = await api.post(
        "/finance/paystack/connect",
        {
          bankCode,
          accountNumber,
        }
      );

      setPaystackConnected(true);
      setAccountNumber("");
      setVerifiedAccountName("");

      setPaystackMessage(
        response.data?.message ||
          "School Paystack account connected successfully."
      );

      await handleRefreshPaystackStatus();
    } catch (err: unknown) {
      setPaystackMessage(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              "Could not connect the Paystack account."
          : "Could not connect the Paystack account."
      );
    } finally {
      setConnectingPaystack(false);
    }
  }

  // Safely update a form field
  function updateForm(
    field: keyof SchoolProfileFormValues,
    value: SchoolProfileFormValues[keyof SchoolProfileFormValues]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // Validate required fields
  function validateForm(): string {
    if (!form.schoolName.trim()) {
      return "School name is required.";
    }

    if (!form.email.trim()) {
      return "Email is required.";
    }

    if (!form.phone.trim()) {
      return "Phone is required.";
    }

    if (!form.principalName.trim()) {
      return "Principal name is required.";
    }

    if (!form.currentSession.trim()) {
      return "Current session is required.";
    }

    if (!form.currentTerm.trim()) {
      return "Current term is required.";
    }

    return "";
  }

  // Save school profile and upload a new logo separately
  async function handleSaveProfile() {
    const validationError = validateForm();

    if (validationError) {
      setActionMessage(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setActionMessage("");

      const profilePayload: SchoolProfileFormValues = {
        schoolName: form.schoolName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        principalName: form.principalName,
        currentSession: form.currentSession,
        currentTerm: form.currentTerm,
        logoUrl: form.logoUrl,
        logoFile: undefined,
        themeColor: form.themeColor,
      };

      let updated = await updateSchoolProfile(profilePayload);

      if (form.logoFile instanceof File) {
        const logoResult = await uploadSchoolLogo(form.logoFile);

        updated = await getSchoolProfile();

        if (!updated.logoUrl && logoResult?.logoUrl) {
          updated = {
            ...updated,
            logoUrl: logoResult.logoUrl,
          };
        }
      }

      const nextForm: SchoolProfileFormValues = {
        schoolName: updated.schoolName || "",
        email: updated.email || "",
        phone: updated.phone || "",
        address: updated.address || "",
        principalName: updated.principalName || "",
        currentSession: updated.currentSession || "",
        currentTerm: updated.currentTerm || "",
        logoUrl: updated.logoUrl || "",
        logoFile: undefined,
        themeColor: updated.themeColor || "#06b6d4",
      };

      setForm(nextForm);
      patchTenant(mapSchoolProfileToTenantPatch(updated));

      setActionMessage("School profile updated successfully.");
    } catch (err: unknown) {
      setActionMessage(
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
              "Failed to update school profile."
          : "Failed to update school profile."
      );
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
        title="Unable to load settings"
        description={pageError}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="School Profile Settings"
        subtitle="Manage school identity, contact details, branding and academic defaults"
      >
        {actionMessage ? (
          <div
            role="status"
            className="mb-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"
          >
            {actionMessage}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <SchoolProfileForm
            values={form}
            onChange={updateForm}
            onSubmit={handleSaveProfile}
            submitting={submitting}
          />

          {/* Read-only profile preview */}
          <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                School Profile Preview
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Preview your school information and branding.
              </p>
            </div>

            <div
              className="rounded-2xl border border-white/10 bg-slate-950/60 p-6"
              style={{
                borderTopWidth: 4,
                borderTopColor: form.themeColor || "#06b6d4",
              }}
            >
              <div className="flex items-center gap-4">
                {form.logoFile || form.logoUrl ? (
                  <img
                    src={
                      form.logoFile
                        ? URL.createObjectURL(form.logoFile)
                        : form.logoUrl
                    }
                    alt="School logo"
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl"
                    style={{
                      backgroundColor: form.themeColor || "#06b6d4",
                    }}
                  >
                    🏫
                  </div>
                )}

                <div className="min-w-0">
                  <h4 className="break-words text-lg font-bold text-white">
                    {form.schoolName || "Your School Name"}
                  </h4>
                  <p className="mt-1 text-sm text-slate-400">
                    {form.principalName || "Principal name"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Email
                  </p>
                  <p className="break-words text-slate-200">
                    {form.email || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Phone
                  </p>
                  <p className="text-slate-200">
                    {form.phone || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Address
                  </p>
                  <p className="break-words text-slate-200">
                    {form.address || "Not provided"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Session
                    </p>
                    <p className="mt-1 text-slate-200">
                      {form.currentSession || "Not selected"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Term
                    </p>
                    <p className="mt-1 text-slate-200">
                      {form.currentTerm || "Not selected"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span
                className="h-8 w-8 rounded-lg border border-white/20"
                style={{
                  backgroundColor: form.themeColor || "#06b6d4",
                }}
              />
              <div>
                <p className="text-sm font-medium text-white">
                  School theme color
                </p>
                <p className="text-xs text-slate-400">
                  {form.themeColor || "#06b6d4"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </SectionCard>

      {/* School fee payment settings */}
      <SectionCard
        title="School Fee Payment Settings"
        subtitle="Connect the school's settlement account to receive online school-fee payments"
      >
        <div className="max-w-2xl space-y-5">
          {paystackMessage ? (
            <div
              role="status"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"
            >
              {paystackMessage}
            </div>
          ) : null}

          {paystackConnected ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="font-semibold text-emerald-300">
                  Paystack account connected
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Online school-fee payments are linked to this school's
                  Paystack subaccount.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-slate-300">
                    Paystack verification:
                  </span>

                  {paystackVerified === true ? (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-semibold text-emerald-300">
                      Verified
                    </span>
                  ) : paystackVerified === false ? (
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 font-semibold text-amber-300">
                      Not verified yet
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-slate-300">
                      Not checked
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Verification status comes from Paystack and may differ
                  from connection status.
                </p>

                {verificationCheckedAt ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Last checked:{" "}
                    {new Date(verificationCheckedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleRefreshPaystackStatus}
                disabled={refreshingPaystackStatus}
                className="rounded-xl border border-cyan-500/40 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {refreshingPaystackStatus
                  ? "Refreshing status..."
                  : "Refresh Paystack status"}
              </button>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="paystack-bank"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Settlement bank
                </label>

                <select
                  id="paystack-bank"
                  value={bankCode}
                  onChange={(event) => {
                    setBankCode(event.target.value);
                    setVerifiedAccountName("");
                    setPaystackMessage("");
                  }}
                  disabled={
                    banksLoading ||
                    connectingPaystack ||
                    verifyingAccount
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                >
                  <option value="">
                    {banksLoading ? "Loading banks..." : "Select your bank"}
                  </option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="paystack-account-number"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Account number
                </label>

                <input
                  id="paystack-account-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(event) => {
                    setAccountNumber(
                      event.target.value.replace(/\D/g, "").slice(0, 10)
                    );
                    setVerifiedAccountName("");
                    setPaystackMessage("");
                  }}
                  disabled={connectingPaystack || verifyingAccount}
                  placeholder="Enter 10-digit account number"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Use the account where this school should receive its
                  fee payments.
                </p>
              </div>

              {verifiedAccountName ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">
                    Verified account name
                  </p>
                  <p className="mt-1 text-base font-semibold text-white">
                    {verifiedAccountName}
                  </p>
                  <p className="mt-2 text-xs text-slate-300">
                    Confirm that this is the correct settlement account
                    before connecting.
                  </p>
                </div>
              ) : null}

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                EduTrack platform commission: <strong>0%</strong>.
                Paystack processing fees still apply.
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleVerifyPaystackAccount}
                  disabled={
                    verifyingAccount ||
                    connectingPaystack ||
                    banksLoading ||
                    !bankCode ||
                    accountNumber.length !== 10
                  }
                  className="rounded-xl border border-cyan-500/40 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifyingAccount
                    ? "Verifying account..."
                    : verifiedAccountName
                    ? "Verify again"
                    : "Verify account"}
                </button>

                <button
                  type="button"
                  onClick={handleConnectPaystack}
                  disabled={
                    connectingPaystack ||
                    verifyingAccount ||
                    banksLoading ||
                    !bankCode ||
                    accountNumber.length !== 10 ||
                    !verifiedAccountName
                  }
                  className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {connectingPaystack
                    ? "Connecting account..."
                    : "Connect Paystack account"}
                </button>
              </div>
            </>
          )}
        </div>
      </SectionCard>

      {/* Account security */}
      <SectionCard
        title="Account Security"
        subtitle="Protect your school administrator account"
      >
        <ChangePasswordForm />
      </SectionCard>
    </div>
  );
}

