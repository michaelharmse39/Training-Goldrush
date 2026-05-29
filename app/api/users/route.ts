import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { dbAdminSelect, dbAdminInsert } from "@/lib/rest-admin";

export async function GET() {
  try {
    const [{ data: { users: authUsers }, error: listError }, profiles] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      dbAdminSelect("users"),
    ]);
    if (listError) throw listError;

    const profileMap = new Map(profiles.map((p) => [p.id as string, p]));

    const users = authUsers.map((u) => {
      const p = profileMap.get(u.id) ?? {};
      return {
        uid: u.id,
        email: u.email ?? "",
        role: (p.role as string) ?? "staff",
        departmentId: (p.department_id as string) ?? "",
        approved: (p.approved as boolean) !== false,
        selfRegistered: (p.self_registered as boolean) ?? false,
        totpEnabled: (p.totp_enabled as boolean) ?? false,
        createdAt: u.created_at,
      };
    });

    return NextResponse.json(users);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, role, departmentId } = await request.json() as { email: string; role: string; departmentId?: string };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://training-register-mu.vercel.app";

    const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/update-password`,
    });
    if (inviteError) throw inviteError;

    await dbAdminInsert("users", {
      id: invited.user.id,
      email,
      role,
      department_id: departmentId || null,
      approved: true,
      self_registered: false,
      totp_enabled: false,
    });

    return NextResponse.json({
      uid: invited.user.id,
      email,
      role,
      departmentId: departmentId ?? "",
      approved: true,
      selfRegistered: false,
      totpEnabled: false,
      createdAt: invited.user.created_at,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
