export interface SchoolProfile {
  _id?: string;

  schoolName: string;
  email: string;
  phone: string;
  address: string;

  principalName: string;

  currentSession: string;
  currentTerm: string;

  logoUrl?: string;
  themeColor?: string;

  // Branding / tenant fields
  domain?: string;
  slug?: string;
  fullDomain?: string;
}

export interface SchoolProfileResponse {
  success: boolean;
  message?: string;
  data: {
    profile: SchoolProfile;
  };
}
export interface SchoolProfileFormValues {
  schoolName: string;
  email: string;
  phone: string;
  address: string;

  principalName: string;

  currentSession: string;
  currentTerm: string;

  logoFile?: File;
  logoUrl?: string;

  themeColor: string;

  domain?: string;
}