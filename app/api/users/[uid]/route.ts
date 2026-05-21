import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    await adminAuth.deleteUser(uid);
    await adminDb.collection("users").doc(uid).delete();
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (body.role !== undefined) update.role = body.role;
    if (body.departmentId !== undefined) update.departmentId = body.departmentId;
    if (body.approved !== undefined) update.approved = body.approved;
    if (body.totpEnabled !== undefined) update.totpEnabled = body.totpEnabled;
    if (body.totpSecret !== undefined) update.totpSecret = body.totpSecret;
    await adminDb.collection("users").doc(uid).set(update, { merge: true });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
