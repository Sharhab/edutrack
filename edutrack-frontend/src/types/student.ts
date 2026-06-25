export interface Student {
  status: string;
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  admissionNumber: string;
  gender: "male" | "female";
  dateOfBirth?: string;
  classId?: string;
  className?: string;
  parentId?: string;
  parentName?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface StudentListResponse {
  students: Student[];
}


export interface StudentFormValues {
  firstName: string;
  middleName?: string;
  lastName: string;
  admissionNumber: string;
  gender: "male" | "female";
  dateOfBirth: string;
  classId: string;
  parentId: string;
  email: string;
  phone: string;
  address: string;
  status: string;

  entryType?: string;
  previousSchool?: string;

  stateOfOrigin?: string;
  lga?: string;

  emergencyName?: string;
  emergencyPhone?: string;

  bloodGroup?: string;
  genotype?: string;

  nin?: string;
  birthCertificateNo?: string;
}