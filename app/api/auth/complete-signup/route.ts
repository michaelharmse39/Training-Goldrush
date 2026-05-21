import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uid: string;
  let email: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Prevent overwriting existing accounts
  const existing = await adminDb.collection("users").doc(uid).get();
  if (existing.exists) {
    return NextResponse.json({ error: "Account already registered" }, { status: 409 });
  }

  await adminDb.collection("users").doc(uid).set({
    role: "staff",
    email,
    departmentId: "",
    approved: false,
    selfRegistered: true,
    totpEnabled: false,
  });

  return NextResponse.json({ success: true });
}
