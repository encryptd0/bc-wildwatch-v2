import { Severity } from "./types";

export function routeNotification(severity: Severity) {
  if (severity === "High") {
    return {
      notificationTarget: "security" as const,
      notificationChannel: "sms_or_whatsapp" as const,
      message: "High severity sighting sent to security guards via WhatsApp/SMS queue.",
    };
  }

  return {
    notificationTarget: "faculty" as const,
    notificationChannel: "faculty_queue" as const,
    message: "Low/Medium severity sighting sent to faculty queue.",
  };
}
