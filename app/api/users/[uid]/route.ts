import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    await supabaseAdmin.auth.admin.deleteUser(uid);
    await supabaseAdmin.from("users").delete().eq("id", uid);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
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
    if (body.departmentId !== undefined) update.department_id = body.departmentId || null;
    if (body.approved !== undefined) update.approved = body.approved;
    if (body.totpEnabled !== undefined) update.totp_enabled = body.totpEnabled;
    if (body.totpSecret !== undefined) update.totp_secret = body.totpSecret;
    await supabaseAdmin.from("users").update(update).eq("id", uid);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
