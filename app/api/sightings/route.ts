import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { routeNotification } from "@/lib/notifications";
import { addSighting, listSightings } from "@/lib/store";
import { PublicSighting, Severity, SightingCategory } from "@/lib/types";

function toPublicView(role: "student" | "faculty" | "admin", data: Awaited<ReturnType<typeof listSightings>>): PublicSighting[] {
  return data.map((item) => ({
    id: item.id,
    category: item.category,
    type: item.type,
    location: item.location,
    notes: item.notes,
    severity: item.severity,
    createdAt: item.createdAt,
    notificationTarget: item.notificationTarget,
    notificationChannel: item.notificationChannel,
    reporter: role === "student" ? "Anonymous Student" : `${item.reporterName} (${item.reporterEmail})`,
  }));
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await listSightings();
  return NextResponse.json({ sightings: toPublicView(user.role, data) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    category?: SightingCategory;
    type?: string;
    location?: string;
    notes?: string;
    severity?: Severity;
  };

  const category = body.category;
  const type = body.type?.trim();
  const location = body.location?.trim();
  const notes = body.notes?.trim() ?? "";
  const severity = body.severity;

  if (!category || !type || !location || !severity) {
    return NextResponse.json({ error: "Category, type, location, and severity are required." }, { status: 400 });
  }

  const notification = routeNotification(severity);

  await addSighting({
    id: crypto.randomUUID(),
    category,
    type,
    location,
    notes,
    severity,
    createdAt: new Date().toISOString(),
    reporterName: user.name,
    reporterEmail: user.email,
    notificationTarget: notification.notificationTarget,
    notificationChannel: notification.notificationChannel,
  });

  return NextResponse.json({ ok: true, message: notification.message });
}
