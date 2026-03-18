export type Severity = "Low" | "Medium" | "High";
export type SightingCategory = "Animal" | "Danger";
export type UserRole = "student" | "faculty" | "admin";

export interface SessionUser {
  name: string;
  email: string;
  role: UserRole;
}

export interface Sighting {
  id: string;
  category: SightingCategory;
  type: string;
  location: string;
  notes: string;
  severity: Severity;
  createdAt: string;
  reporterName: string;
  reporterEmail: string;
  notificationTarget: "security" | "faculty";
  notificationChannel: "sms_or_whatsapp" | "faculty_queue";
}

export interface PublicSighting extends Omit<Sighting, "reporterName" | "reporterEmail"> {
  reporter: string;
}
