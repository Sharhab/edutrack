
export interface SchoolProfile {
  _id?: string;

  schoolName: string;
  email: string;
  phone: string;
  address: string;
  principalName: string;

  motto?: string;
  principalSignature?: string;
  schoolStamp?: string;

  currentSession: string;
  currentTerm: string;

  logoUrl?: string;
  themeColor?: string;

  domain?: string;
  slug?: string;
  fullDomain?: string;
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

  motto: string;
  principalSignature?: string;
  schoolStamp?: string;

  currentSession: string;
  currentTerm: string;

  logoFile?: File;
  logoUrl?: string;

  principalSignatureFile?: File;
  schoolStampFile?: File;

  themeColor: string;
  domain?: string;
}
