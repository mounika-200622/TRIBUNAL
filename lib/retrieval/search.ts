import { SOURCES_PER_CLAIM, hasSearch } from "../config";
import { cached, keyOf } from "../cache";
import type { Source, Stance } from "../types";

/**
 * Evidence retrieval via Tavily.
 *
 * Stance is deliberately NOT decided here — a keyword heuristic would be a lie
 * dressed as data. Sources arrive neutral; the prosecutors and judge read the
 * snippets and decide what they actually show. Deterministic layer stays
 * deterministic, judgement stays with the models.
 */

type TavilyResult = {
  url?: string;
  title?: string;
  content?: string;
  score?: number;
};

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

/**
 * Domains we weight higher when the judge has to break a tie. Crude but honest,
 * and it's surfaced in the UI rather than hidden.
 */
const HIGH_TRUST = [
  ".gov", ".edu", "nature.com", "science.org", "nih.gov", "who.int",
  "pubmed", "arxiv.org", "reuters.com", "apnews.com", "bbc.co", "nasa.gov",
];

function credibilityOf(domain: string, score: number | undefined): number {
  const boost = HIGH_TRUST.some((d) => domain.includes(d)) ? 0.25 : 0;
  const base = typeof score === "number" ? Math.min(1, Math.max(0, score)) : 0.6;
  return Math.min(1, Number((base * 0.75 + boost + 0.15).toFixed(2)));
}

export async function searchEvidence(claim: string): Promise<Source[]> {
  if (!hasSearch) return [];

  const key = keyOf("search", SOURCES_PER_CLAIM, claim);

  return cached(key, async () => {
    let results: TavilyResult[] = [];
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: claim,
          max_results: SOURCES_PER_CLAIM,
          search_depth: "advanced",
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        console.error("tavily failed:", res.status);
        return [];
      }
      const json = (await res.json()) as { results?: TavilyResult[] };
      results = json.results ?? [];
    } catch (e) {
      console.error("tavily error:", e);
      return [];
    }

    return results
      .filter((r) => r.url && r.content)
      .map((r, i) => {
        const domain = domainOf(r.url!);
        return {
          id: `s${i + 1}`,
          url: r.url!,
          domain,
          title: (r.title ?? domain).slice(0, 140),
          snippet: r.content!.replace(/\s+/g, " ").slice(0, 320),
          // Neutral until an agent reads it and argues otherwise.
          stance: "neutral" as Stance,
          credibility: credibilityOf(domain, r.score),
        };
      });
  });
}
