"use client";
import type { Claim, Source, StreamEvent } from "@/lib/types";

function makeClaim(i: number): Claim {
  const sources: Source[] = Array.from({ length: 4 }, (_, j) => ({
    id: `c${i}-s${j}`,
    url: `https://example${j}.com/article`,
    domain: `example${j}.com`,
    title: "Sample source",
    snippet: "Sample snippet text.",
    stance: j % 3 === 0 ? "contradicts" : j % 3 === 1 ? "supports" : "neutral",
    credibility: 0.7,
  }));
  return {
    id: `c${i}`,
    text: `Stress test claim number ${i} for layout checking.`,
    status: "done",
    verdict: i % 3 === 0 ? "refuted" : i % 3 === 1 ? "supported" : "unverifiable",
    confidence: 0.6,
    failureType: "none",
    reasoning: "Stress test reasoning text.",
    disagreement: 0.3,
    sources,
    arguments: [],
  };
}

export const STRESS_EVENTS: StreamEvent[] = [
  { type: "claims", claims: Array.from({ length: 5 }, (_, i) => makeClaim(i + 1)) },
  { type: "done", trustScore: 55 },
];