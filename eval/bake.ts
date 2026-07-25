/**
 * Pre-bake demo trials into fixtures.
 *
 *   npx vite-node eval/bake.ts
 *
 * Writes lib/fixtures.ts — complete, real event logs captured from live runs.
 * The demo then replays a genuine trial instantly and deterministically, with
 * no API calls: no rate limit, no slow search, no chance of the model having an
 * off day while a judge is watching.
 *
 * These are not mocks. Every verdict, source and argument here was produced by
 * the real pipeline.
 */

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { extractClaims } from "../lib/agents/extract";
import { searchEvidence } from "../lib/retrieval/search";
import { disagreementOf, runPanel } from "../lib/agents/advocate";
import { judgeClaim, trustScore } from "../lib/agents/judge";
import type { Claim, StreamEvent } from "../lib/types";

const envPath = path.join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

/** The three trials the demo runs on. */
const DEMOS = [
  {
    id: "fabrication",
    label: "The killer — a fabricated citation",
    blurb: "An AI answer that invents a study and distorts a real one.",
    text: "Remote work is now clearly better for output. A 2019 Stanford study found that remote workers are 43% more productive than office workers, and a 2021 Harvard Medical School paper concluded that three cups of coffee daily reverses liver fibrosis.",
  },
  {
    id: "clean",
    label: "A clean answer",
    blurb: "Mostly true — proof the tribunal isn't just a cynic.",
    text: "Honey does not spoil because its low water content and acidity prevent microbial growth. Light takes about eight minutes to travel from the Sun to the Earth, and octopuses have three hearts.",
  },
  {
    id: "mixed",
    label: "A mixed answer",
    blurb: "True, stale, and mythical claims side by side.",
    text: "Bananas are slightly radioactive because they contain potassium-40. Pluto is the ninth planet in our solar system. Humans only use 10% of their brains.",
  },
];

/**
 * Run one trial, recording every event in the order the live route emits them.
 * Claims are processed sequentially here — the recording is about fidelity of
 * content, and the replay controls its own pacing.
 */
async function bake(text: string): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  const claims = await extractClaims(text);
  events.push({ type: "claims", claims });

  const settled: Claim[] = [];

  for (const claim of claims) {
    events.push({ type: "claim_status", claimId: claim.id, status: "retrieving" });

    const sources = (await searchEvidence(claim.text)).map((s) => ({
      ...s,
      id: `${claim.id}-${s.id}`,
    }));
    for (const source of sources) {
      events.push({ type: "source", claimId: claim.id, source });
    }

    const withSources: Claim = { ...claim, sources };

    events.push({ type: "claim_status", claimId: claim.id, status: "arguing" });
    const args = await runPanel(withSources);
    for (const argument of args) {
      events.push({ type: "argument", claimId: claim.id, argument });
    }

    events.push({ type: "claim_status", claimId: claim.id, status: "judging" });
    const ruling = await judgeClaim(withSources, args);
    const disagreement = disagreementOf(args);

    events.push({
      type: "verdict",
      claimId: claim.id,
      verdict: ruling.verdict,
      confidence: ruling.confidence,
      failureType: ruling.failureType,
      reasoning: ruling.reasoning,
      disagreement,
    });

    settled.push({
      ...withSources,
      status: "done",
      arguments: args,
      verdict: ruling.verdict,
      confidence: ruling.confidence,
      failureType: ruling.failureType,
      reasoning: ruling.reasoning,
      disagreement,
    });
  }

  events.push({ type: "done", trustScore: trustScore(settled) });
  return events;
}

async function main() {
  const baked: { id: string; label: string; blurb: string; text: string; events: StreamEvent[] }[] =
    [];

  for (const demo of DEMOS) {
    console.log(`\nBaking "${demo.id}" …`);
    try {
      const events = await bake(demo.text);
      const verdicts = events.filter((e) => e.type === "verdict");
      const done = events.find((e) => e.type === "done");
      baked.push({ ...demo, events });
      console.log(
        `  ${events.length} events · ${verdicts.length} verdicts · trust ${
          done && done.type === "done" ? done.trustScore : "?"
        }/100`,
      );
      for (const v of verdicts) {
        if (v.type === "verdict") {
          console.log(
            `    ${v.verdict.toUpperCase().padEnd(12)} ${Math.round(v.confidence * 100)}%  ${v.failureType}`,
          );
        }
      }
    } catch (e) {
      console.error(`  failed:`, (e as Error).message);
    }
  }

  const file = `import type { StreamEvent } from "./types";

/**
 * GENERATED by eval/bake.ts — do not edit by hand.
 *
 * Real event logs captured from live runs of the tribunal. Replaying these gives
 * a genuine trial instantly and deterministically: no API calls, no rate limit,
 * no slow retrieval while a judge is watching. Every verdict, source and
 * argument below was produced by the real pipeline.
 */

export type Fixture = {
  id: string;
  label: string;
  blurb: string;
  text: string;
  events: StreamEvent[];
};

export const FIXTURES: Fixture[] = ${JSON.stringify(baked, null, 2)};

export function fixtureById(id: string): Fixture | undefined {
  return FIXTURES.find((f) => f.id === id);
}

/**
 * Replay a recorded trial with lifelike pacing, so the interface animates the
 * same way it does on a live run. Returns a cancel function.
 */
export function replayFixture(
  fixture: Fixture,
  onEvent: (e: StreamEvent) => void,
  speed = 1,
): () => void {
  let cancelled = false;

  (async () => {
    for (const e of fixture.events) {
      const pause =
        e.type === "claims"
          ? 700
          : e.type === "claim_status"
            ? 420
            : e.type === "verdict"
              ? 900
              : 300 + Math.random() * 340;
      await new Promise((r) => setTimeout(r, pause / speed));
      if (cancelled) return;
      onEvent(e);
    }
  })();

  return () => {
    cancelled = true;
  };
}
`;

  writeFileSync(path.join(process.cwd(), "lib", "fixtures.ts"), file, "utf8");
  console.log(`\nWrote lib/fixtures.ts — ${baked.length} trials baked.`);
}

main();
