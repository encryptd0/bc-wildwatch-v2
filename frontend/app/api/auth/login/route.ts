import { NextResponse } from "next/server";
import { beginTwoFactorLogin, completeTwoFactorLogin, validateCampusEmail } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    name?: string;
    challengeToken?: string;
    otpCode?: string;
  };

  const challengeToken = body.challengeToken?.trim();
  const otpCode = body.otpCode?.trim();

  if (challengeToken || otpCode) {
    if (!challengeToken || !otpCode) {
      return NextResponse.json({ error: "2FA challenge token and code are required." }, { status: 400 });
    }

    const user = await completeTwoFactorLogin(challengeToken, otpCode);
    if (!user) {
      return NextResponse.json({ error: "Invalid or expired 2FA code. Start sign-in again." }, { status: 401 });
    }

    return NextResponse.json({ user });
  }

  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();

  if (!email || !name) {
    return NextResponse.json({ error: "Name and campus email are required." }, { status: 400 });
  }

  if (!validateCampusEmail(email)) {
    return NextResponse.json({ error: "Use your campus-managed email address." }, { status: 400 });
  }

  const challenge = await beginTwoFactorLogin(name, email);
  return NextResponse.json(challenge);
}
