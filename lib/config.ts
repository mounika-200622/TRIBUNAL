import OpenAI from "openai";

/**
 * Two providers, one SDK. Groq is OpenAI-compatible, so the bulk agent work
 * runs there — free and ~10x faster, which is what lets the whole tribunal
 * resolve in seconds instead of half a minute. Only the judge, where the
 * reasoning quality actually shows, costs money.
 */

export const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
export const hasGroq = Boolean(process.env.GROQ_API_KEY);
export const hasSearch = Boolean(process.env.TAVILY_API_KEY);

/** Fast + free: extraction, prosecutors, defense. */
export const FAST_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

/** The ruling. Worth paying for — its reasoning is what a human reads. */
export const JUDGE_MODEL = process.env.JUDGE_MODEL ?? "gpt-5.6";

/** Guardrail: a pasted essay must not become a 40-call bill. */
export const MAX_CLAIMS = Number(process.env.MAX_CLAIMS ?? 4);

/** Sources fetched per claim. */
export const SOURCES_PER_CLAIM = Number(process.env.SOURCES_PER_CLAIM ?? 4);

let groqClient: OpenAI | null = null;
let openaiClient: OpenAI | null = null;

export function groq(): OpenAI {
  if (!groqClient) {
    groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return groqClient;
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
