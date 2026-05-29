/**
 * Server-side REST helpers using the service role key directly.
 * Bypasses the Supabase JS admin client which hangs with sb_secret_* key format.
 * Only import this in API routes (server-side).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serviceHeaders = (extra: Record<string, string> = {}) => ({
  "apikey": ANON_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  ...extra,
});

async function checkOk(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string; msg?: string; error?: string };
    throw new Error(body.message ?? body.msg ?? body.error ?? res.statusText);
  }
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function adminGetUser(token: string): Promise<{ id: string; email: string } | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: string; email: string }>;
}

// ── Database helpers ──────────────────────────────────────────────────────────

export async function dbAdminSelect<T = Record<string, unknown>>(
  table: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  if (!("select" in params)) params = { select: "*", ...params };
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: serviceHeaders() });
  await checkOk(res);
  return res.json() as Promise<T[]>;
}

export async function dbAdminInsert(table: string, body: unknown): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: serviceHeaders({ "Prefer": "return=minimal" }),
    body: JSON.stringify(body),
  });
  await checkOk(res);
}

export async function dbAdminUpdate(table: string, id: string, body: unknown): Promise<void> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set("id", `eq.${id}`);
  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: serviceHeaders({ "Prefer": "return=minimal" }),
    body: JSON.stringify(body),
  });
  await checkOk(res);
}

export async function dbAdminDelete(table: string, id: string): Promise<void> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set("id", `eq.${id}`);
  const res = await fetch(url.toString(), {
    method: "DELETE",
    headers: serviceHeaders(),
  });
  await checkOk(res);
}
