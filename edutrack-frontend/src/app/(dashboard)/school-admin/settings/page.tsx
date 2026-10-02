"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import SectionCard from "../../../../components/ui/SectionCard";
import PageLoader from "../../../../components/ui/PageLoader";
import EmptyState from "../../../../components/ui/EmptyState";
import SchoolProfileForm from "../../../../components/settings/SchoolProfileForm";
import SchoolProfilePreview from "../../../../components/settings/SchoolProfilePreview";

import {
  getSchoolProfile,
  updateSchoolProfile,
  uploadSchoolLogo,
} from "../../../../lib/settings";

import { SchoolProfileFormValues } from "../../../../types/settings";

import { useTenant } from "../../../../components/tenant/TenantProvider";
import { mapSchoolProfileToTenantPatch } from "../../../../lib/tenant-patch";
import api from "../../../../lib/axios";

const initialForm: SchoolProfileFormValues = {
  schoolName: "",
  email: "",
  phone: "",
  address: "",
  principalName: "",
  currentSession: "",
  currentTerm: "",

  logoFile: undefined,
  logoUrl: "",

  themeColor: "#06b6d4",
};

type PaystackBank = {
  name: string;
  code: string;
  slug?: string;
};

export default function SchoolAdminSettingsPage() {
  const { patchTenant } = useTenant();

  console.log("PATCH EXISTS", patchTenant);

  const [form, setForm] =
    useState<SchoolProfileFormValues>(initialForm);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // =========================================
  // PAYSTACK SETTINGS STATE
  // =========================================

  const [banks, setBanks] = useState<PaystackBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [connectingPaystack, setConnectingPaystack] = useState(false);
  const [paystackMessage, setPaystackMessage] = useState("");
  const [paystackConnected, setPaystackConnected] = useState(false);

  /* =========================================
     LOAD PROFILE
  ========================================= */
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

      console.log(
        "PATCH DATA",
        mapSchoolProfileToTenantPatch(profile)
      );

      patchTenant(
        mapSchoolProfileToTenantPatch(profile)
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message ||
            "Failed to load school profile."
        );
      } else {
        setPageError(
          "Failed to load school profile."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  /* =========================================
     LOAD PAYSTACK BANKS
  ========================================= */
  async function loadPaystackBanks() {
    try {
      setBanksLoading(true);
      setPaystackMessage("");

      const response = await api.get("/finance/paystack/banks");

      setBanks(response.data?.data || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPaystackMessage(
          err.response?.data?.message ||
            "Could not load banks."
        );
      } else {
        setPaystackMessage("Could not load banks.");
      }
    } finally {
      setBanksLoading(false);
    }
  }

  useEffect(() => {
    loadPaystackBanks();
  }, []);

  /* =========================================
     CONNECT PAYSTACK ACCOUNT
  ========================================= */
  async function handleConnectPaystack() {
    if (!bankCode) {
      setPaystackMessage("Please select your bank.");
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      setPaystackMessage(
        "Enter a valid 10-digit account number."
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

      setPaystackMessage(
        response.data?.message ||
          "School Paystack account connected successfully."
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPaystackMessage(
          err.response?.data?.message ||
            "Could not connect the Paystack account."
        );
      } else {
        setPaystackMessage(
          "Could not connect the Paystack account."
        );
      }
    } finally {
      setConnectingPaystack(false);
    }
  }

  /* =========================================
     UPDATE FORM (SAFE TYPING)
  ========================================= */
  function updateForm(
    field: keyof SchoolProfileFormValues,
    value: any
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  /* =========================================
     VALIDATION
  ========================================= */
  function validateForm() {
    if (!form.schoolName.trim())
      return "School name is required.";
    if (!form.email.trim())
      return "Email is required.";
    if (!form.phone.trim())
      return "Phone is required.";
    if (!form.principalName.trim())
      return "Principal name is required.";
    if (!form.currentSession.trim())
      return "Current session is required.";
    if (!form.currentTerm.trim())
      return "Current term is required.";

    return "";
  }

  /* =========================================
     SAVE PROFILE + LOGO
  ========================================= */
  async function handleSaveProfile() {
    const validationError = validateForm();

    if (validationError) {
      setActionMessage(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setActionMessage("");

      /* =========================================
         1. UPDATE PROFILE INFORMATION
         ========================================= */

      const profilePayload: SchoolProfileFormValues = {
        schoolName: form.schoolName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        principalName: form.principalName,
        currentSession: form.currentSession,
        currentTerm: form.currentTerm,

        /*
         * Keep the currently saved logo URL here.
         * The actual new file is uploaded separately
         * to Cloudinary below.
         */
        logoUrl: form.logoUrl,
        logoFile: undefined,

        themeColor: form.themeColor,
      };

      let updated =
        await updateSchoolProfile(
          profilePayload
        );

      /* =========================================
         2. UPLOAD NEW LOGO TO CLOUDINARY
         ========================================= */

      if (form.logoFile instanceof File) {
        const logoResult =
          await uploadSchoolLogo(
            form.logoFile
          );

        /*
         * The backend saves the Cloudinary URL
         * directly into the School document.
         *
         * Fetch the profile again so all frontend
         * state uses the persisted value.
         */
        updated =
          await getSchoolProfile();

        /*
         * Safety fallback:
         * If the GET response does not contain the
         * URL for any reason, use the upload result.
         */
        if (
          !updated.logoUrl &&
          logoResult.logoUrl
        ) {
          updated = {
            ...updated,
            logoUrl:
              logoResult.logoUrl,
          };
        }
      }

      /* =========================================
         3. UPDATE FORM STATE
      ========================================= */

      const nextForm: SchoolProfileFormValues = {
        schoolName:
          updated.schoolName || "",
        email:
          updated.email || "",
        phone:
          updated.phone || "",
        address:
          updated.address || "",
        principalName:
          updated.principalName || "",
        currentSession:
          updated.currentSession || "",
        currentTerm:
          updated.currentTerm || "",

        logoUrl:
          updated.logoUrl || "",
        logoFile: undefined,

        themeColor:
          updated.themeColor ||
          "#06b6d4",
      };

      setForm(nextForm);

      /* =========================================
         4. UPDATE TENANT BRANDING
      ========================================= */

      patchTenant(
        mapSchoolProfileToTenantPatch(
          updated
        )
      );

      setActionMessage(
        "School profile updated successfully."
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setActionMessage(
          err.response?.data?.message ||
            "Failed to update school profile."
        );
      } else {
        setActionMessage(
          "Failed to update school profile."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* =========================================
     UI STATES
  ========================================= */
  if (loading) return <PageLoader />;

  if (pageError) {
    return (
      <EmptyState
        title="Unable to load settings"
        description={pageError}
      />
    );
  }

  /* =========================================
     UI
  ========================================= */
  return (
    <div className="space-y-6">
      <SectionCard
        title="School Profile Settings"
        subtitle="Manage school identity, contact details, branding & academic defaults"
      >
        {actionMessage ? (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
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

          <SchoolProfilePreview values={form} />
        </div>
      </SectionCard>

      {/* =========================================
          SCHOOL FEE PAYMENT SETTINGS
      ========================================= */}
      <SectionCard
        title="School Fee Payment Settings"
        subtitle="Connect the school's settlement account to receive online school-fee payments"
      >
        <div className="max-w-2xl space-y-5">
          {paystackMessage ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              {paystackMessage}
            </div>
          ) : null}

          {paystackConnected ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="font-semibold text-emerald-300">
                Paystack account connected
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Online school-fee payments have been enabled for this school.
              </p>
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
                  onChange={(event) =>
                    setBankCode(event.target.value)
                  }
                  disabled={banksLoading || connectingPaystack}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                >
                  <option value="">
                    {banksLoading
                      ? "Loading banks..."
                      : "Select your bank"}
                  </option>

                  {banks.map((bank) => (
                    <option
                      key={bank.code}
                      value={bank.code}
                    >
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
                  onChange={(event) =>
                    setAccountNumber(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  disabled={connectingPaystack}
                  placeholder="Enter 10-digit account number"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Use the account where this school should receive its fee payments.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                EduTrack platform commission:{" "}
                <strong>0%</strong>. Paystack processing fees still apply.
              </div>

              <button
                type="button"
                onClick={handleConnectPaystack}
                disabled={
                  connectingPaystack ||
                  banksLoading ||
                  banks.length === 0 ||
                  !bankCode ||
                  accountNumber.length !== 10
                }
                className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {connectingPaystack
                  ? "Connecting account..."
                  : "Connect Paystack account"}
              </button>
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
