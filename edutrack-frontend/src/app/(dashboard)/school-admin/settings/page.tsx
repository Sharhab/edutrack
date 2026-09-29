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

export default function SchoolAdminSettingsPage() {
  const { patchTenant } = useTenant();

  console.log("PATCH EXISTS", patchTenant);

  const [form, setForm] =
    useState<SchoolProfileFormValues>(initialForm);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

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
    </div>
  );
}