/**
 * Thin fetch client for the Barkpark content API.
 *
 * Routes (verified against the live instance):
 *   GET {BARKPARK_URL}/v1/data/query/production/<type>?field=value  → list
 *   GET {BARKPARK_URL}/v1/data/doc/production/<type>/<id>           → single doc
 *
 * Auth: `Authorization: Bearer <read-only workspace-bound token>`.
 * Without a token the client degrades to empty results with a loud warning,
 * so CI can build before the BARKPARK_READ_TOKEN secret exists.
 */

const BARKPARK_URL = (
  process.env.BARKPARK_URL ?? "https://jarl.barkpark.cloud"
).replace(/\/$/, "");
const READ_TOKEN = process.env.BARKPARK_READ_TOKEN;

export const REVALIDATE_SECONDS = 60;

let warned = false;
function warnMissingToken(): void {
  if (warned) return;
  warned = true;
  console.warn(
    "\n" +
      "╔══════════════════════════════════════════════════════════════════╗\n" +
      "║  BARKPARK_READ_TOKEN is not set — building with EMPTY content.   ║\n" +
      "║  Every list will be empty and every page will render bare.       ║\n" +
      "║  Set BARKPARK_READ_TOKEN in .env.local (or the CI secret).       ║\n" +
      "╚══════════════════════════════════════════════════════════════════╝\n",
  );
}

async function apiGet(path: string): Promise<unknown | null> {
  if (!READ_TOKEN) {
    warnMissingToken();
    return null;
  }
  const res = await fetch(`${BARKPARK_URL}${path}`, {
    headers: { Authorization: `Bearer ${READ_TOKEN}` },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error(`Barkpark API ${res.status} on ${path}`);
    return null;
  }
  return res.json();
}

/** List published documents of a type, optionally filtered by exact field values. */
export async function queryDocuments<T>(
  type: string,
  params?: Record<string, string>,
): Promise<T[]> {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  const json = (await apiGet(`/v1/data/query/production/${type}${qs}`)) as {
    result?: { documents?: T[] };
  } | null;
  return json?.result?.documents ?? [];
}

/** Fetch one published document by id. */
export async function getDocument<T>(
  type: string,
  id: string,
): Promise<T | null> {
  const json = (await apiGet(`/v1/data/doc/production/${type}/${id}`)) as {
    result?: T;
  } | null;
  return json?.result ?? null;
}
