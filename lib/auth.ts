import crypto from "node:crypto";
import { cookies } from "next/headers";
import { SessionUser, UserRole } from "./types";

const COOKIE_NAME = "bcww_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const CAMPUS_DOMAIN = process.env.MICROSOFT_TENANT_DOMAIN ?? "student.belgiumcampus.ac.za";

function getRole(email: string): UserRole {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  const facultyEmails = (process.env.FACULTY_EMAILS ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);

  const normalized = email.toLowerCase();
  if (adminEmails.includes(normalized)) return "admin";
  if (facultyEmails.includes(normalized)) return "faculty";
  return "student";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

function encode(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(token: string): SessionUser | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as SessionUser;
  } catch {
    return null;
  }
}

export function validateCampusEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${CAMPUS_DOMAIN.toLowerCase()}`);
}

export async function createSession(name: string, email: string) {
  const user: SessionUser = {
    name,
    email,
    role: getRole(email),
  };

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encode(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return user;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decode(token);
}
