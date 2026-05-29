import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { data: existing } = await supabaseAdmin.from("users").select("id").eq("id", user.id).single();
  if (existing) return NextResponse.json({ error: "Account already registered" }, { status: 409 });

  await supabaseAdmin.from("users").insert({
    id: user.id,
    email: user.email ?? "",
    role: "staff",
    department_id: null,
    approved: false,
    self_registered: true,
    totp_enabled: false,
  });

  return NextResponse.json({ success: true });
}
