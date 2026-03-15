import { NextResponse } from "next/server";
import { createSession, validateCampusEmail } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; name?: string };
  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();

  if (!email || !name) {
    return NextResponse.json({ error: "Name and campus email are required." }, { status: 400 });
  }

  if (!validateCampusEmail(email)) {
    return NextResponse.json({ error: "Use your campus Microsoft account email." }, { status: 400 });
  }

  const user = await createSession(name, email);
  return NextResponse.json({ user });
}
