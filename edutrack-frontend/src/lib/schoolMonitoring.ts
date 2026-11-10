import api from "./axios";

export type AdminStatus =
  | "active"
  | "inactive"
  | "disabled"
  | "never_logged_in";

export interface SchoolAdmin {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLogin: string | null;
  status: AdminStatus;
}

export interface MonitoredSchool {
  _id: string;
  name: string;
  slug: string;
  email: string;
  isActive: boolean;
  plan?: string;
  subscriptionStatus?: string;
  totalStudents: number;
  activeStudents: number;
  schoolAdmins: SchoolAdmin[];
  adminStatus: AdminStatus;
  lastAdminLogin: string | null;
}

export interface SchoolMonitoringData {
  summary: {
    totalSchools: number;
    totalStudents: number;
    activeSchools: number;
    inactiveSchools: number;
    neverLoggedInSchools: number;
  };
  schools: MonitoredSchool[];
}

export async function getSchoolMonitoring(): Promise<SchoolMonitoringData> {
  const response = await api.get("/super-admin/school-monitoring");
  return response.data.data;
}
