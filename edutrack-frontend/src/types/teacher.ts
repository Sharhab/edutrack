export interface TeacherUserRef {
  _id: string;
  role?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive?: boolean;
}

export interface TeacherClassRef {
  _id: string;
  name?: string;
  level?: string;
  arm?: string;
}

export interface TeacherSubjectRef {
  _id: string;
  name?: string;
}

export interface Teacher {
  _id: string;

  schoolId?: string;

  userId?: TeacherUserRef | null;

  firstName?: string;
  middleName?: string;
  lastName?: string;

  email?: string;
  phone?: string;

  employeeId: string;

  qualification?: string;
  designation?: string;

  dateOfBirth?: string;

  maritalStatus?: string;

  stateOfOrigin?: string;
  lga?: string;
  nationality?: string;

  employmentType?: string;
  employmentDate?: string;

  staffCategory?: string;

  emergencyName?: string;
  emergencyPhone?: string;

  bloodGroup?: string;
  genotype?: string;

  nin?: string;

  photo?: string;

  subjectIds: string[] | TeacherSubjectRef[];

  classIds: string[] | TeacherClassRef[];

  classNames?: string[];

  status?: "active" | "inactive";

  isActive?: boolean;

  gender?: "male" | "female";

  address?: string;

  createdAt?: string;
}

export interface TeacherFormValues {
  firstName: string;
  middleName?: string;
  lastName: string;

  email: string;
  phone: string;

  employeeId: string;

  qualification?: string;
  designation?: string;

  dateOfBirth?: string;

  employmentDate?: string;
  employmentType?: string;

  subjectIds: string[];
  classIds: string[];

  gender: "male" | "female";

  address: string;

  isActive: boolean;
  status?: "active" | "inactive";

  password: string;

  maritalStatus?: string;

  stateOfOrigin?: string;
  lga?: string;
  nationality?: string;

  staffCategory?: string;

  emergencyName?: string;
  emergencyPhone?: string;

  bloodGroup?: string;
  genotype?: string;

  nin?: string;

  photo?: string;
}