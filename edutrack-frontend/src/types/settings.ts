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
}

export interface SchoolProfileResponse {
  success: boolean;
  message: string;
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

  logoFile?: File;   // ✅ NEW
  logoUrl?: string;   // backend saved URL

  themeColor: string;
}