import { FAST_MODEL, MAX_CLAIMS, groq } from "../config";
import { cached, keyOf } from "../cache";
import type { Claim } from "../types";

/**
 * Break input text into atomic claims worth trying.
 *
 * The quality of everything downstream depends on this: a claim that bundles
 * three assertions can't get a clean verdict, and a claim that's pure opinion
 * wastes the whole fleet. So we ask for checkable, self-contained, factual
 * statements only — ranked by how much the overall text leans on them.
 */

const SYSTEM = `You decompose text into atomic factual claims for fact-checking.

Rules:
- Each claim must be ONE assertion, checkable on its own, understandable without the surrounding text (resolve pronouns and references).
- Quote or minimally paraphrase — do not editorialize or add detail that isn't there.
- Extract only VERIFIABLE factual claims. Skip opinions, predictions, value judgements, and hedged speculation.
- Prefer claims that are load-bearing: specific statistics, named studies, attributed quotes, dates, causal assertions.
- If the text cites a source, study, year, or figure, that is ALWAYS worth extracting — fabricated citations are the most common failure.
- Return at most ${MAX_CLAIMS}, most load-bearing first.

Return strict JSON only:
{"claims": [{"text": "the claim"}]}`;

export async function extractClaims(input: string): Promise<Claim[]> {
  const key = keyOf("extract", FAST_MODEL, MAX_CLAIMS, input);

  const texts = await cached(key, async () => {
    const r = await groq().chat.completions.create({
      model: FAST_MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: input },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = r.choices[0]?.message?.content ?? "{}";
    let parsed: { claims?: { text?: string }[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    return (parsed.claims ?? [])
      .map((c) => (c.text ?? "").trim())
      .filter((t) => t.length > 12)
      .slice(0, MAX_CLAIMS);
  });

  return texts.map((text, i) => ({
    id: `c${i + 1}`,
    text,
    status: "pending" as const,
    verdict: null,
    confidence: null,
    failureType: null,
    reasoning: null,
    disagreement: null,
    sources: [],
    arguments: [],
  }));
}
