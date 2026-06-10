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
} from "../../../../lib/settings";

import { SchoolProfileFormValues } from "../../../../types/settings";

import { useTenant } from "../../../../components/providers/TenantProvider";
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

      patchTenant(mapSchoolProfileToTenantPatch(profile));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPageError(
          err.response?.data?.message ||
            "Failed to load school profile."
        );
      } else {
        setPageError("Failed to load school profile.");
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
     SAVE (FILE + JSON SAFE)
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

      const formData = new FormData();

      formData.append("schoolName", form.schoolName);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      formData.append("principalName", form.principalName);
      formData.append("currentSession", form.currentSession);
      formData.append("currentTerm", form.currentTerm);
      formData.append("themeColor", form.themeColor);

      // ✅ FILE HANDLING FIXED
      if (form.logoFile instanceof File) {
        formData.append("logo", form.logoFile);
      }

      const updated = await updateSchoolProfile(formData);

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
      if (axios.isAxiosError(err)) {
        setActionMessage(
          err.response?.data?.message ||
            "Failed to update school profile."
        );
      } else {
        setActionMessage("Failed to update school profile.");
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