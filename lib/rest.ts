/**
 * Direct PostgREST helpers — bypasses the Supabase JS client which hangs
 * with the sb_publishable_* key format.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const STORAGE_KEY =
  typeof window !== "undefined"
    ? `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`
    : "sb-auth-token";

function getToken(): string {
  if (typeof window === "undefined") return SUPABASE_ANON_KEY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as { access_token?: string };
      if (s?.access_token) return s.access_token;
    }
  } catch { /* ignore */ }
  return SUPABASE_ANON_KEY;
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${getToken()}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function checkOk(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string; msg?: string };
    throw new Error(body.message ?? body.msg ?? res.statusText);
  }
}

// Build a PostgREST URL with filters.
// filters: e.g. { "id": "eq.uuid", "order": "created_at.desc" }
function buildUrl(table: string, params: Record<string, string> = {}): string {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

export async function dbSelect<T = Record<string, unknown>>(
  table: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  if (!("select" in params)) params = { select: "*", ...params };
  const res = await fetch(buildUrl(table, params), { headers: headers() });
  await checkOk(res);
  return res.json() as Promise<T[]>;
}

export async function dbSelectOne<T = Record<string, unknown>>(
  table: string,
  params: Record<string, string> = {}
): Promise<T | null> {
  const rows = await dbSelect<T>(table, { limit: "1", ...params });
  return rows[0] ?? null;
}

export async function dbInsert<T = Record<string, unknown>>(
  table: string,
  body: unknown
): Promise<T> {
  const res = await fetch(buildUrl(table), {
    method: "POST",
    headers: headers({ "Prefer": "return=representation" }),
    body: JSON.stringify(body),
  });
  await checkOk(res);
  const rows = await res.json() as T[];
  return rows[0];
}

export async function dbUpdate(
  table: string,
  id: string,
  body: unknown
): Promise<void> {
  const res = await fetch(buildUrl(table, { "id": `eq.${id}` }), {
    method: "PATCH",
    headers: headers({ "Prefer": "return=minimal" }),
    body: JSON.stringify(body),
  });
  await checkOk(res);
}

export async function dbDelete(table: string, id: string): Promise<void> {
  const res = await fetch(buildUrl(table, { "id": `eq.${id}` }), {
    method: "DELETE",
    headers: headers(),
  });
  await checkOk(res);
}
