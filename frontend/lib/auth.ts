import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { SessionUser, UserRole } from "./types";

const COOKIE_NAME = "bcww_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const CAMPUS_DOMAIN = process.env.MICROSOFT_TENANT_DOMAIN ?? "student.belgiumcampus.ac.za";
const TWO_FACTOR_ISSUER = process.env.TWO_FACTOR_ISSUER ?? "BC WildWatch";
const TWO_FACTOR_FILE = path.join(process.cwd(), "data", "two-factor-users.json");
const TWO_FACTOR_CODE_DIGITS = 6;
const TWO_FACTOR_STEP_SECONDS = 30;
const LOGIN_CHALLENGE_TTL_SECONDS = 60 * 5;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

type TwoFactorUser = {
  email: string;
  secret: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type LoginChallenge = {
  name: string;
  email: string;
  setupRequired: boolean;
  iat: number;
  exp: number;
  nonce: string;
};

export type LoginChallengeResult = {
  requiresTwoFactor: true;
  challengeToken: string;
  setupRequired: boolean;
  setupKey?: string;
  setupUri?: string;
};

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

function signatureMatches(payload: string, signature: string): boolean {
  const expected = sign(payload);
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature, "utf-8"), Buffer.from(expected, "utf-8"));
}

function encodeSigned<T>(value: T): string {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSigned<T>(token: string): T | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!signatureMatches(payload, signature)) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as T;
  } catch {
    return null;
  }
}

function encode(user: SessionUser): string {
  return encodeSigned(user);
}

function decode(token: string): SessionUser | null {
  return decodeSigned<SessionUser>(token);
}

function toBase32(input: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function fromBase32(input: string): Buffer | null {
  const normalized = input.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  if (!normalized || /[^A-Z2-7]/.test(normalized)) return null;

  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of normalized) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) return null;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

function generateTwoFactorSecret(): string {
  return toBase32(crypto.randomBytes(20));
}

function createAuthenticatorUri(email: string, secret: string): string {
  const label = encodeURIComponent(`${TWO_FACTOR_ISSUER}:${email}`);
  const issuer = encodeURIComponent(TWO_FACTOR_ISSUER);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=${TWO_FACTOR_CODE_DIGITS}&period=${TWO_FACTOR_STEP_SECONDS}`;
}

function generateTotpCode(secret: string, counter: number): string | null {
  const key = fromBase32(secret);
  if (!key) return null;

  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const hash = crypto.createHmac("sha1", key).update(buffer).digest();
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  return (binary % 10 ** TWO_FACTOR_CODE_DIGITS).toString().padStart(TWO_FACTOR_CODE_DIGITS, "0");
}

function verifyTotpCode(secret: string, otpCode: string): boolean {
  const normalizedCode = otpCode.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalizedCode)) return false;

  const currentCounter = Math.floor(Date.now() / 1000 / TWO_FACTOR_STEP_SECONDS);
  for (const drift of [-1, 0, 1]) {
    const generated = generateTotpCode(secret, currentCounter + drift);
    if (generated && generated === normalizedCode) {
      return true;
    }
  }

  return false;
}

async function ensureTwoFactorFile() {
  try {
    await fs.access(TWO_FACTOR_FILE);
  } catch {
    await fs.mkdir(path.dirname(TWO_FACTOR_FILE), { recursive: true });
    await fs.writeFile(TWO_FACTOR_FILE, "[]", "utf-8");
  }
}

async function readTwoFactorUsers(): Promise<TwoFactorUser[]> {
  await ensureTwoFactorFile();
  const raw = await fs.readFile(TWO_FACTOR_FILE, "utf-8");

  try {
    return JSON.parse(raw) as TwoFactorUser[];
  } catch {
    return [];
  }
}

async function writeTwoFactorUsers(users: TwoFactorUser[]) {
  await fs.writeFile(TWO_FACTOR_FILE, JSON.stringify(users, null, 2), "utf-8");
}

async function getOrCreateTwoFactorUser(email: string): Promise<TwoFactorUser> {
  const users = await readTwoFactorUsers();
  const normalizedEmail = email.toLowerCase();
  const existing = users.find((item) => item.email === normalizedEmail);
  if (existing) return existing;

  const now = new Date().toISOString();
  const created: TwoFactorUser = {
    email: normalizedEmail,
    secret: generateTwoFactorSecret(),
    enabled: false,
    createdAt: now,
    updatedAt: now,
  };

  users.push(created);
  await writeTwoFactorUsers(users);
  return created;
}

async function markTwoFactorEnabled(email: string) {
  const users = await readTwoFactorUsers();
  const normalizedEmail = email.toLowerCase();
  const index = users.findIndex((item) => item.email === normalizedEmail);
  if (index === -1) return;

  users[index] = {
    ...users[index],
    enabled: true,
    updatedAt: new Date().toISOString(),
  };

  await writeTwoFactorUsers(users);
}

export function validateCampusEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${CAMPUS_DOMAIN.toLowerCase()}`);
}

export async function beginTwoFactorLogin(name: string, email: string): Promise<LoginChallengeResult> {
  const user = await getOrCreateTwoFactorUser(email);
  const now = Math.floor(Date.now() / 1000);
  const setupRequired = !user.enabled;

  const challenge: LoginChallenge = {
    name,
    email: email.toLowerCase(),
    setupRequired,
    iat: now,
    exp: now + LOGIN_CHALLENGE_TTL_SECONDS,
    nonce: crypto.randomUUID(),
  };

  return {
    requiresTwoFactor: true,
    challengeToken: encodeSigned(challenge),
    setupRequired,
    setupKey: setupRequired ? user.secret : undefined,
    setupUri: setupRequired ? createAuthenticatorUri(challenge.email, user.secret) : undefined,
  };
}

export async function completeTwoFactorLogin(challengeToken: string, otpCode: string): Promise<SessionUser | null> {
  const challenge = decodeSigned<LoginChallenge>(challengeToken);
  if (!challenge) return null;

  const now = Math.floor(Date.now() / 1000);
  if (challenge.exp < now) return null;

  const users = await readTwoFactorUsers();
  const record = users.find((item) => item.email === challenge.email.toLowerCase());
  if (!record) return null;

  if (!verifyTotpCode(record.secret, otpCode)) return null;
  if (!record.enabled) {
    await markTwoFactorEnabled(record.email);
  }

  return createSession(challenge.name, challenge.email);
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
