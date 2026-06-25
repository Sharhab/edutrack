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
  // ================= PERSONAL INFO =================
  firstName: string;
  middleName: string;
  lastName: string;

  admissionNumber: string;
  gender: "male" | "female";
  dateOfBirth: string;

  // ================= ACADEMIC =================
  classId: string;
  entryType: "new" | "transfer" | "promotion" | "reentry";
  previousSchool: string;

  // ================= LOCATION =================
  stateOfOrigin: string;
  lga: string;

  // ================= PARENT / GUARDIAN =================
  parentId: string;
  emergencyName: string;
  emergencyPhone: string;

  // ================= CONTACT =================
  email: string;
  phone: string;
  address: string;

  // ================= HEALTH =================
  bloodGroup: string;
  genotype: string;

  // ================= STATUS =================
  status: "active" | "inactive" | "suspended" | "graduated";

  // ================= OPTIONAL SAFETY =================
  nin?: string;
  birthCertificateNo?: string;
}