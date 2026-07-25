import OpenAI from "openai";

/**
 * Two providers, one SDK. Groq is OpenAI-compatible, so the bulk agent work
 * runs there — free and ~10x faster, which is what lets the whole tribunal
 * resolve in seconds instead of half a minute. Only the judge, where the
 * reasoning quality actually shows, costs money.
 */

/**
 * Every Groq key configured, in order. Quotas are per-key as well as per-model,
 * so a second key is a second daily budget — set GROQ_API_KEY_2, _3, … to raise
 * the ceiling. Judges hammering the live demo shouldn't be able to exhaust us.
 */
export const GROQ_KEYS: string[] = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter((k): k is string => Boolean(k));

export const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
export const hasGroq = GROQ_KEYS.length > 0;
export const hasSearch = Boolean(process.env.TAVILY_API_KEY);

/** Fast + free: extraction, prosecutors, defense. */
export const FAST_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

/**
 * Failover chain. Groq's token limits are per-model, so an exhausted quota on
 * one model says nothing about the next — and a rate limit must never be able
 * to kill a live demo. Ordered by capability: we drop tiers only as needed.
 */
export const FAST_MODEL_CHAIN = [
  FAST_MODEL,
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "llama-3.1-8b-instant",
];

/** The ruling. Worth paying for — its reasoning is what a human reads. */
export const JUDGE_MODEL = process.env.JUDGE_MODEL ?? "gpt-5.6";

/** Guardrail: a pasted essay must not become a 40-call bill. */
export const MAX_CLAIMS = Number(process.env.MAX_CLAIMS ?? 4);

/** Sources fetched per claim. */
export const SOURCES_PER_CLAIM = Number(process.env.SOURCES_PER_CLAIM ?? 4);

const groqClients = new Map<string, OpenAI>();
let openaiClient: OpenAI | null = null;

function groqFor(key: string): OpenAI {
  let c = groqClients.get(key);
  if (!c) {
    c = new OpenAI({ apiKey: key, baseURL: "https://api.groq.com/openai/v1" });
    groqClients.set(key, c);
  }
  return c;
}

/** First configured key. Kept for callers that don't need rotation. */
export function groq(): OpenAI {
  return groqFor(GROQ_KEYS[0] ?? "");
}

export function openai(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * If OpenAI credit runs out mid-event, flipping this to true routes the judge
 * to Groq as well. Whole pipeline becomes free; ruling prose gets a little
 * blunter. This is the escape hatch, and it is one env var.
 */
export const JUDGE_ON_GROQ = process.env.JUDGE_ON_GROQ === "1";

function isQuotaError(e: unknown): boolean {
  const err = e as { status?: number; code?: string; error?: { code?: string } };
  return (
    err?.status === 429 ||
    err?.code === "rate_limit_exceeded" ||
    err?.error?.code === "rate_limit_exceeded"
  );
}

/**
 * Run a Groq chat completion, walking the model chain when a quota is hit.
 *
 * Returns the content plus the model that actually served it, so callers can
 * surface degradation honestly rather than silently pretending nothing changed.
 */
export async function groqChat(
  system: string,
  user: string,
  opts: { json?: boolean; temperature?: number } = {},
): Promise<{ content: string; model: string }> {
  const { json = true, temperature = 0.2 } = opts;
  let lastError: unknown;

  // Exhaust the preferred model across every key before dropping a tier — a
  // quota is per key AND per model, so a second key restores the best model
  // rather than forcing us onto a weaker one.
  for (const model of FAST_MODEL_CHAIN) {
    for (const [i, key] of GROQ_KEYS.entries()) {
      try {
        const r = await groqFor(key).chat.completions.create({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          ...(json ? { response_format: { type: "json_object" as const } } : {}),
          temperature,
        });
        return { content: r.choices[0]?.message?.content ?? "", model };
      } catch (e) {
        lastError = e;
        if (!isQuotaError(e)) throw e;
        console.warn(`[groq] ${model} exhausted on key ${i + 1} — rotating`);
      }
    }
  }

  throw lastError ?? new Error("every Groq key and model is exhausted");
}
