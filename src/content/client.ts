/**
 * Thin fetch client for the Barkpark content API.
 *
 * Routes (verified against the live instance):
 *   GET {BARKPARK_URL}/v1/data/query/production/<type>?field=value  → list
 *   GET {BARKPARK_URL}/v1/data/doc/production/<type>/<id>           → single doc
 *
 * Auth: published reads are PUBLIC on the instance, so the client always
 * fetches — `Authorization: Bearer <BARKPARK_READ_TOKEN>` is attached only
 * when the token is set (it gates nothing on the read side today, but a
 * future private instance may need it).
 *
 * BUILD HONESTY (charter D11): a production build must NEVER go green while
 * prerendering an empty site. Any API failure — unreachable instance,
 * rejected token, unexpected status — THROWS in production, failing the
 * build/prerender with a clear error. Dev keeps the tolerant path with a
 * loud console warning so local work never blocks on the instance.
 * A 404 stays `null`: a genuinely missing document is content truth, not an
 * infrastructure failure, and the route turns it into a real 404 page.
 */

const BARKPARK_URL = (
  process.env.BARKPARK_URL ?? "https://jarl.barkpark.cloud"
).replace(/\/$/, "");
const READ_TOKEN = process.env.BARKPARK_READ_TOKEN;
const PRODUCTION = process.env.NODE_ENV === "production";

export const REVALIDATE_SECONDS = 60;

/** Fail loud in production; degrade loudly-but-tolerantly in dev. */
function fail(detail: string): null {
  const message =
    `Barkpark content API failure: ${detail}\n` +
    `  instance: ${BARKPARK_URL}\n` +
    `  token:    BARKPARK_READ_TOKEN ${READ_TOKEN ? "set" : "NOT set"}`;
  if (PRODUCTION) {
    throw new Error(
      `${message}\n` +
        "Refusing to prerender an empty site — fix BARKPARK_URL / " +
        "BARKPARK_READ_TOKEN or the instance, then rebuild.",
    );
  }
  console.warn(`[barkpark] ${message}\n  dev renders EMPTY content here.`);
  return null;
}

async function apiGet(path: string): Promise<unknown | null> {
  const headers: HeadersInit = READ_TOKEN
    ? { Authorization: `Bearer ${READ_TOKEN}` }
    : {};
  let res: Response;
  try {
    res = await fetch(`${BARKPARK_URL}${path}`, {
      headers,
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch (err) {
    return fail(`unreachable — ${String(err)} on ${path}`);
  }
  if (res.status === 404) return null;
  if (res.status === 401 || res.status === 403) {
    return fail(`HTTP ${res.status} on ${path} — the read token was rejected`);
  }
  if (!res.ok) {
    return fail(`HTTP ${res.status} on ${path}`);
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
