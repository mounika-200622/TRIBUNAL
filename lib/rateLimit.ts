/**
 * Per-IP token bucket. The deployed URL carries real keys and every trial costs
 * a few cents of judge time, so this is the difference between "judges tried it"
 * and "someone drained the account".
 *
 * Module-level state, so on serverless this bounds abuse per instance rather
 * than globally. That is the tradeoff that keeps it free and dependency-free,
 * and it is enough at hackathon scale.
 */

const CAPACITY = Number(process.env.RATE_CAPACITY ?? 8);
const WINDOW_SEC = Number(process.env.RATE_WINDOW_SEC ?? 300);

type Bucket = { tokens: number; last: number };
const buckets = new Map<string, Bucket>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function allow(req: Request): { ok: boolean; retryAfterSec: number } {
  const key = clientIp(req);
  const now = Date.now();
  const refillPerSec = CAPACITY / WINDOW_SEC;

  const state = buckets.get(key) ?? { tokens: CAPACITY, last: now };
  const elapsed = Math.max(0, (now - state.last) / 1000);
  const tokens = Math.min(CAPACITY, state.tokens + elapsed * refillPerSec);

  if (tokens < 1) {
    buckets.set(key, { tokens, last: now });
    return { ok: false, retryAfterSec: Math.ceil((1 - tokens) / refillPerSec) };
  }

  buckets.set(key, { tokens: tokens - 1, last: now });
  return { ok: true, retryAfterSec: 0 };
}
