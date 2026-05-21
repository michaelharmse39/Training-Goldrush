import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { authenticator } from "otplib";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code?.trim()) return NextResponse.json({ error: "Code is required" }, { status: 400 });

  const snap = await adminDb.collection("users").doc(uid).get();
  const secret = snap.data()?.totpSecret;
  if (!secret) return NextResponse.json({ error: "TOTP not configured for this account" }, { status: 400 });

  const valid = authenticator.verify({ token: code.trim(), secret });
  if (!valid) return NextResponse.json({ error: "Incorrect code. Check your authenticator app and try again." }, { status: 400 });

  return NextResponse.json({ success: true });
}
