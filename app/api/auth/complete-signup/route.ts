import { NextRequest, NextResponse } from "next/server";
import { adminGetUser, dbAdminSelect, dbAdminInsert } from "@/lib/rest-admin";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await adminGetUser(token);
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const existing = await dbAdminSelect("users", { "id": `eq.${user.id}`, select: "id", limit: "1" });
  if (existing.length > 0) return NextResponse.json({ error: "Account already registered" }, { status: 409 });

  const body = await req.json().catch(() => ({})) as { departmentId?: string | null };

  await dbAdminInsert("users", {
    id: user.id,
    email: user.email ?? "",
    role: "staff",
    department_id: body.departmentId || null,
    approved: false,
    self_registered: true,
    totp_enabled: false,
  });

  return NextResponse.json({ success: true });
}
