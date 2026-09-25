import api from "../lib/axios";

import {
  SchoolProfile,
  SchoolProfileResponse,
  SchoolProfileFormValues,
} from "../types/settings";

const SETTINGS_ENDPOINTS = {
  getProfile: "/settings/school-profile",
  updateProfile: "/settings/school-profile",
  uploadLogo: "/settings/school-profile/logo",
};

/* =========================================
   GET PROFILE
========================================= */

export async function getSchoolProfile(): Promise<SchoolProfile> {
  const { data } =
    await api.get<SchoolProfileResponse>(
      SETTINGS_ENDPOINTS.getProfile
    );

  return data.data.profile;
}

/* =========================================
   UPDATE PROFILE
========================================= */

export async function updateSchoolProfile(
  payload: SchoolProfileFormValues | FormData
): Promise<SchoolProfile> {
  const isFormData =
    payload instanceof FormData;

  const { data } =
    await api.put<SchoolProfileResponse>(
      SETTINGS_ENDPOINTS.updateProfile,
      payload,
      {
        headers: isFormData
          ? {
              "Content-Type": "multipart/form-data",
            }
          : {
              "Content-Type": "application/json",
            },
      }
    );

  return data.data.profile;
}

/* =========================================
   UPLOAD SCHOOL LOGO
========================================= */

export async function uploadSchoolLogo(
  file: File
): Promise<{ logoUrl: string }> {
  const formData = new FormData();

  formData.append("logo", file);

  const { data } =
    await api.post<{
      success: boolean;
      message: string;
      data: {
        logoUrl: string;
      };
    }>(
      SETTINGS_ENDPOINTS.uploadLogo,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

  return data.data;
}