export interface PopulatedSession {
  _id: string;
  name: string;
}

export interface PopulatedTerm {
  _id: string;
  name: string;
}

export interface PopulatedTeacher {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface ClassItem {
  _id: string;
  name: string;
  slug?: string;

  level?: string;

  arm?: string; // optional (not from backend yet)

  capacity?: number;
  isActive?: boolean;

  sessionId?: PopulatedSession | null;
  termId?: PopulatedTerm | null;
  classTeacherId?: PopulatedTeacher | null;

  createdAt?: string;
}

export interface ClassFormValues {
  name: string;
  level: string;
  arm: string;
  capacity: string;
  isActive: string;
}

export interface ClassPayload {
  name: string;
  level?: string;
  arm?: string;
  capacity?: number;
  isActive: boolean;
}
