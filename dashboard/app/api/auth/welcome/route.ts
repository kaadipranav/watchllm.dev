import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = body?.email;
  const name = body?.name;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    await sendWelcomeEmail(email, name || email.split("@")[0]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Welcome email failed", error);
    return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 });
  }
}