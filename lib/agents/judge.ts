import {
  FAST_MODEL,
  JUDGE_MODEL,
  JUDGE_ON_GROQ,
  groq,
  hasOpenAI,
  openai,
} from "../config";
import { cached, keyOf } from "../cache";
import type { Argument, Claim, FailureType, Source, VerdictKind } from "../types";

/**
 * The ruling. This is the one step worth paying a frontier model for: its
 * reasoning paragraph is the thing a human actually reads and judges us on.
 *
 * It does two things nothing upstream does — weighs a real contest between
 * opposed agents, and NAMES the failure mode. "False" is a bit; "fabricated
 * citation" is a diagnosis, and that distinction is the whole product.
 */

const SYSTEM = `You are the presiding judge of a fact-checking tribunal. Prosecutors attacked a claim through assigned lenses; the defense argued for it. You rule.

VERDICTS
- "supported": the evidence substantiates the claim as stated.
- "refuted": the evidence contradicts it, OR a cited source/study/statistic cannot be substantiated.
- "unverifiable": the retrieved evidence is genuinely insufficient either way. Use this honestly — do not refute a claim merely because sources are thin.

FAILURE TYPE — name the specific mode, not just "wrong":
- "fabricated_citation": a cited study, paper, author, or figure does not exist as described.
- "misattribution": real finding, wrong author / institution / source.
- "overgeneralization": a kernel of truth stretched past what the evidence supports (absolutes, wider population).
- "stale_fact": was true, is no longer.
- "conflated_entity": two similar entities, studies, or numbers merged.
- "unsupported_causal": correlation or sequence presented as causation.
- "none": use when the verdict is "supported", or when refuted for a reason none of the above fit.

WEIGHING
- A strong prosecutor argument grounded in a credible source outweighs a confident but unsourced one.
- Prosecutor unanimity is meaningful; a lone dissenter on a narrow lens is not fatal.
- Discount any argument citing sources that don't support what it claims they do.
- Judge the claim AS STATED. If it overstates a true underlying fact, that is overgeneralization, not support.

CONFIDENCE
Calibrated, 0 to 1. 0.9+ means you would be surprised to be wrong. If evidence is thin, confidence should be low even when your lean is clear. Do not inflate.

REASONING
2–4 sentences, plain language, for a non-expert. State what the evidence shows and why it settles the matter. Name the decisive source. No hedging boilerplate.

Return strict JSON only:
{"verdict":"supported|refuted|unverifiable","failureType":"...","confidence":0.0,"reasoning":"..."}`;

const VERDICTS = new Set<VerdictKind>(["supported", "refuted", "unverifiable"]);
const FAILURES = new Set<FailureType>([
  "fabricated_citation",
  "misattribution",
  "overgeneralization",
  "stale_fact",
  "conflated_entity",
  "unsupported_causal",
  "none",
]);

function transcript(claim: Claim, args: Argument[], sources: Source[]): string {
  const ev =
    sources.length === 0
      ? "(no sources retrieved — weigh this heavily toward unverifiable)"
      : sources
          .map(
            (s) =>
              `[${s.id}] ${s.domain} (credibility ${s.credibility}) — ${s.title}\n"${s.snippet}"`,
          )
          .join("\n\n");

  const pros = args
    .filter((a) => a.role === "prosecutor")
    .map(
      (a) =>
        `PROSECUTOR · ${a.lens} (strength ${a.strength}, cites ${a.sourceIds.join(", ") || "nothing"})\n${a.position}`,
    )
    .join("\n\n");

  const def = args
    .filter((a) => a.role === "defense")
    .map(
      (a) =>
        `DEFENSE (strength ${a.strength}, cites ${a.sourceIds.join(", ") || "nothing"})\n${a.position}`,
    )
    .join("\n\n");

  return `CLAIM UNDER TRIAL:\n"${claim.text}"\n\nEVIDENCE:\n${ev}\n\nARGUMENTS:\n${pros}\n\n${def}`;
}

export type Ruling = {
  verdict: VerdictKind;
  failureType: FailureType;
  confidence: number;
  reasoning: string;
};

export async function judgeClaim(claim: Claim, args: Argument[]): Promise<Ruling> {
  const useGroq = JUDGE_ON_GROQ || !hasOpenAI;
  const model = useGroq ? FAST_MODEL : JUDGE_MODEL;
  const key = keyOf("judge", model, claim.text, args.map((a) => a.id + a.position + a.strength));

  const out = await cached(key, async () => {
    const body = transcript(claim, args, claim.sources);
    try {
      if (useGroq) {
        const r = await groq().chat.completions.create({
          model: FAST_MODEL,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: body },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        });
        return JSON.parse(r.choices[0]?.message?.content ?? "{}");
      }

      // Low reasoning effort: a verdict on a laid-out contest is a judgement
      // call, not a derivation — and reasoning tokens are the hidden cost.
      const r = await openai().responses.create(
        {
          model: JUDGE_MODEL,
          instructions: SYSTEM,
          input: body,
          reasoning: { effort: "low" },
        },
        { timeout: 40_000 },
      );
      return JSON.parse((r.output_text ?? "{}").replace(/^```json\s*|```\s*$/g, ""));
    } catch (e) {
      console.error("judge failed:", e);
      return {};
    }
  });

  const verdict = VERDICTS.has(out.verdict) ? (out.verdict as VerdictKind) : "unverifiable";
  const failureType = FAILURES.has(out.failureType)
    ? (out.failureType as FailureType)
    : "none";

  return {
    verdict,
    // A "supported" ruling with a failure type attached is incoherent.
    failureType: verdict === "supported" ? "none" : failureType,
    confidence: Math.min(1, Math.max(0, Number(out.confidence ?? 0.5))),
    reasoning:
      (out.reasoning ?? "").trim() ||
      "The tribunal could not reach a clear ruling on the available evidence.",
  };
}

/**
 * Overall trust in the input, 0–100.
 *
 * Confidence-weighted so a hesitant refutation doesn't sink an answer as hard
 * as a certain one, and unverifiable claims sit mid-scale rather than counting
 * as either vindication or guilt.
 */
export function trustScore(claims: Claim[]): number {
  const settled = claims.filter((c) => c.verdict && c.confidence !== null);
  if (settled.length === 0) return 50;

  const total = settled.reduce((acc, c) => {
    const conf = c.confidence!;
    if (c.verdict === "supported") return acc + (0.5 + 0.5 * conf);
    if (c.verdict === "refuted") return acc + (0.5 - 0.5 * conf);
    return acc + 0.5;
  }, 0);

  return Math.round((total / settled.length) * 100);
}
