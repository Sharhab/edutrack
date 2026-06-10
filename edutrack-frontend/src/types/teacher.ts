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
  lastName?: string;
  email?: string;
  phone?: string;

  employeeId: string;
  qualification?: string;

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
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;

  subjectIds: string[];
  classIds: string[];

  gender: "male" | "female";

  address: string;

  // 🔥 FIX HERE
  isActive: boolean;

  password: string;
}