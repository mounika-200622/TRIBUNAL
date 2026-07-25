import { FAST_MODEL, groq } from "../config";
import { cached, keyOf } from "../cache";
import type { Claim, FailureType, VerdictKind } from "../types";
import type { Ruling } from "./judge";

/**
 * The two architectures we're claiming to beat. They exist so the ablation is an
 * honest comparison rather than a strawman:
 *
 *  - single:     one verifier reads the evidence and rules. What most people build.
 *  - sequential: a researcher summarises, then a separate checker reviews it.
 *                The standard "multi-agent" pattern in tutorials and demos.
 *
 * Every arm gets the SAME retrieved sources and the SAME model, so any
 * difference in accuracy is attributable to the reasoning structure alone.
 * Anything else and the result would be meaningless.
 */

const VERDICT_RULES = `Verdicts: "supported" | "refuted" | "unverifiable".
Failure types: "fabricated_citation" | "misattribution" | "overgeneralization" | "stale_fact" | "conflated_entity" | "unsupported_causal" | "common_misconception" | "none".
Use "none" only when supported.
Confidence 0..1, calibrated.

Return strict JSON only:
{"verdict":"...","failureType":"...","confidence":0.0,"reasoning":"2-3 sentences"}`;

const SINGLE = `You are a fact checker. Read the claim and the evidence, then rule on it.
${VERDICT_RULES}`;

const RESEARCHER = `You are a research agent. Summarise what the evidence says about the claim.
Be factual and thorough. State plainly whether the evidence appears to support or contradict it, and note anything you cannot confirm.`;

const CHECKER = `You are a verification agent. A researcher has summarised evidence about a claim.
Review their summary critically, then issue the final ruling.
${VERDICT_RULES}`;

function evidenceBlock(claim: Claim): string {
  if (claim.sources.length === 0) return "(no sources retrieved)";
  return claim.sources
    .map((s) => `[${s.id}] ${s.domain} (credibility ${s.credibility}) — ${s.title}\n"${s.snippet}"`)
    .join("\n\n");
}

const VERDICTS = new Set(["supported", "refuted", "unverifiable"]);

function coerce(out: Record<string, unknown>): Ruling {
  const verdict = VERDICTS.has(String(out.verdict))
    ? (out.verdict as VerdictKind)
    : "unverifiable";
  return {
    verdict,
    failureType: verdict === "supported" ? "none" : ((out.failureType as FailureType) ?? "none"),
    confidence: Math.min(1, Math.max(0, Number(out.confidence ?? 0.5))),
    reasoning: String(out.reasoning ?? "").trim() || "No reasoning returned.",
  };
}

async function chat(system: string, user: string, json = true) {
  const r = await groq().chat.completions.create({
    model: FAST_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    ...(json ? { response_format: { type: "json_object" as const } } : {}),
    temperature: 0.2,
  });
  return r.choices[0]?.message?.content ?? "";
}

/** ARM A — one verifier, one pass. */
export async function singleVerifier(claim: Claim): Promise<Ruling> {
  const key = keyOf("arm-single", FAST_MODEL, claim.text, claim.sources.map((s) => s.snippet));
  const out = await cached(key, async () => {
    try {
      const body = `CLAIM: "${claim.text}"\n\nEVIDENCE:\n${evidenceBlock(claim)}`;
      return JSON.parse(await chat(SINGLE, body));
    } catch {
      return {};
    }
  });
  return coerce(out);
}

/** ARM B — researcher then checker. The familiar tutorial pipeline. */
export async function sequentialPipeline(claim: Claim): Promise<Ruling> {
  const key = keyOf("arm-seq", FAST_MODEL, claim.text, claim.sources.map((s) => s.snippet));
  const out = await cached(key, async () => {
    try {
      const body = `CLAIM: "${claim.text}"\n\nEVIDENCE:\n${evidenceBlock(claim)}`;
      const research = await chat(RESEARCHER, body, false);
      const review = `CLAIM: "${claim.text}"\n\nEVIDENCE:\n${evidenceBlock(claim)}\n\nRESEARCHER'S SUMMARY:\n${research}`;
      return JSON.parse(await chat(CHECKER, review));
    } catch {
      return {};
    }
  });
  return coerce(out);
}
