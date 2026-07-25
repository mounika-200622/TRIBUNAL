/**
 * Ablation + calibration harness.
 *
 *   npx vite-node eval/run.ts
 *
 * Runs the gold set through three architectures — single verifier, sequential
 * researcher/checker, and our adversarial panel — holding the model and the
 * retrieved evidence constant so the only variable is reasoning structure.
 *
 * Writes eval/results.json for the PPT charts.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { DATASET, type EvalCase } from "./dataset";
import { searchEvidence } from "../lib/retrieval/search";
import { disagreementOf, runPanel } from "../lib/agents/advocate";
import { judgeClaim } from "../lib/agents/judge";
import { singleVerifier, sequentialPipeline } from "../lib/agents/baselines";
import type { Claim, FailureType, VerdictKind } from "../lib/types";

// Load .env.local by hand — this runs outside Next.
const envPath = path.join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}
// The whole eval runs on Groq, judge included: comparing architectures means
// holding the model fixed. It also makes a full sweep free.
process.env.JUDGE_ON_GROQ = "1";

type ArmName = "single" | "sequential" | "adversarial";

type Row = {
  id: string;
  claim: string;
  truth: VerdictKind;
  expectedFailure: FailureType | null;
  arms: Record<
    ArmName,
    {
      verdict: VerdictKind;
      failureType: FailureType;
      confidence: number;
      correct: boolean;
      failureCorrect: boolean | null;
      disagreement?: number;
    }
  >;
};

function blank(c: EvalCase): Claim {
  return {
    id: c.id,
    text: c.claim,
    status: "pending",
    verdict: null,
    confidence: null,
    failureType: null,
    reasoning: null,
    disagreement: null,
    sources: [],
    arguments: [],
  };
}

async function runCase(c: EvalCase): Promise<Row> {
  const sources = await searchEvidence(c.claim);
  const claim: Claim = { ...blank(c), sources };

  // All three arms see identical evidence.
  const [single, sequential] = await Promise.all([
    singleVerifier(claim),
    sequentialPipeline(claim),
  ]);

  const args = await runPanel(claim);
  const adversarial = await judgeClaim(claim, args);
  const disagreement = disagreementOf(args);

  const score = (r: { verdict: VerdictKind; failureType: FailureType; confidence: number }) => ({
    verdict: r.verdict,
    failureType: r.failureType,
    confidence: r.confidence,
    correct: r.verdict === c.truth,
    // Only meaningful when we expected a specific mode and the verdict was right.
    failureCorrect:
      c.failure !== null && r.verdict === c.truth ? r.failureType === c.failure : null,
  });

  return {
    id: c.id,
    claim: c.claim,
    truth: c.truth,
    expectedFailure: c.failure,
    arms: {
      single: score(single),
      sequential: score(sequential),
      adversarial: { ...score(adversarial), disagreement },
    },
  };
}

/** Reliability diagram input: accuracy within each confidence band. */
function calibration(rows: Row[], arm: ArmName) {
  const bins = [
    { lo: 0.5, hi: 0.7, label: "50–70%" },
    { lo: 0.7, hi: 0.8, label: "70–80%" },
    { lo: 0.8, hi: 0.9, label: "80–90%" },
    { lo: 0.9, hi: 1.01, label: "90–100%" },
  ];
  return bins.map((b) => {
    const inBin = rows.filter(
      (r) => r.arms[arm].confidence >= b.lo && r.arms[arm].confidence < b.hi,
    );
    const correct = inBin.filter((r) => r.arms[arm].correct).length;
    return {
      band: b.label,
      n: inBin.length,
      meanConfidence: inBin.length
        ? Number((inBin.reduce((a, r) => a + r.arms[arm].confidence, 0) / inBin.length).toFixed(3))
        : null,
      accuracy: inBin.length ? Number((correct / inBin.length).toFixed(3)) : null,
    };
  });
}

function summarise(rows: Row[], arm: ArmName) {
  const n = rows.length;
  const correct = rows.filter((r) => r.arms[arm].correct).length;

  const trueCases = rows.filter((r) => r.truth === "supported");
  const falseCases = rows.filter((r) => r.truth === "refuted");

  const failureJudged = rows.filter((r) => r.arms[arm].failureCorrect !== null);
  const failureRight = failureJudged.filter((r) => r.arms[arm].failureCorrect).length;

  // Over-refusal: calling a true claim false. The failure mode that makes a
  // fact checker useless, and the one the adversarial design most risks.
  const falsePositives = trueCases.filter((r) => r.arms[arm].verdict === "refuted").length;

  return {
    arm,
    n,
    accuracy: Number((correct / n).toFixed(3)),
    accuracyOnTrue: trueCases.length
      ? Number((trueCases.filter((r) => r.arms[arm].correct).length / trueCases.length).toFixed(3))
      : null,
    accuracyOnFalse: falseCases.length
      ? Number((falseCases.filter((r) => r.arms[arm].correct).length / falseCases.length).toFixed(3))
      : null,
    falsePositiveRate: trueCases.length
      ? Number((falsePositives / trueCases.length).toFixed(3))
      : null,
    failureTypeAccuracy: failureJudged.length
      ? Number((failureRight / failureJudged.length).toFixed(3))
      : null,
    calibration: calibration(rows, arm),
  };
}

async function main() {
  const cases = DATASET;
  console.log(`Running ${cases.length} cases × 3 architectures…\n`);

  const rows: Row[] = [];
  // Sequential over cases, parallel within — keeps us under Groq's rate limit.
  for (const [i, c] of cases.entries()) {
    try {
      const row = await runCase(c);
      rows.push(row);
      const mark = (ok: boolean) => (ok ? "✓" : "✗");
      console.log(
        `${String(i + 1).padStart(2)}/${cases.length} ${c.id.padEnd(4)} ` +
          `single ${mark(row.arms.single.correct)}  ` +
          `seq ${mark(row.arms.sequential.correct)}  ` +
          `adv ${mark(row.arms.adversarial.correct)}   ${c.claim.slice(0, 52)}`,
      );
    } catch (e) {
      console.error(`  ${c.id} failed:`, (e as Error).message);
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    note: "All arms share retrieval and model; only reasoning architecture varies.",
    arms: (["single", "sequential", "adversarial"] as ArmName[]).map((a) =>
      summarise(rows, a),
    ),
    rows,
  };

  mkdirSync(path.join(process.cwd(), "eval"), { recursive: true });
  writeFileSync(
    path.join(process.cwd(), "eval", "results.json"),
    JSON.stringify(summary, null, 2),
  );

  console.log("\n──────── RESULTS ────────");
  for (const s of summary.arms) {
    console.log(
      `${s.arm.padEnd(12)} acc ${(s.accuracy * 100).toFixed(1)}%  ` +
        `on-true ${((s.accuracyOnTrue ?? 0) * 100).toFixed(0)}%  ` +
        `on-false ${((s.accuracyOnFalse ?? 0) * 100).toFixed(0)}%  ` +
        `false-refute ${((s.falsePositiveRate ?? 0) * 100).toFixed(0)}%  ` +
        `failure-type ${((s.failureTypeAccuracy ?? 0) * 100).toFixed(0)}%`,
    );
  }
  console.log("\nWrote eval/results.json");
}

main();
