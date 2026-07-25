/**
 * Turn eval results into slide-ready SVG charts.
 *
 *   npx vite-node eval/chart.ts
 *
 * Writes eval/charts/*.svg — drop straight into the deck. Hand-drawn SVG rather
 * than a plotting library: no dependency, exact control, and it scales cleanly
 * on a projector.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const INK = "#12141a";
const DIM = "#8b93a3";
const OURS = "#7b61ff";
const BASE = "#c7ccd6";
const GOOD = "#1fc16b";
const BAD = "#ff5a5f";

type Arm = {
  arm: string;
  accuracy: number;
  accuracyOnTrue: number | null;
  accuracyOnFalse: number | null;
  falsePositiveRate: number | null;
  failureTypeAccuracy: number | null;
  calibration: { band: string; n: number; meanConfidence: number | null; accuracy: number | null }[];
};

const results = JSON.parse(
  readFileSync(path.join(process.cwd(), "eval", "results.json"), "utf8"),
) as { arms: Arm[]; model: string };

const LABELS: Record<string, string> = {
  single: "Single verifier",
  sequential: "Sequential\n(researcher → checker)",
  adversarial: "Adversarial panel\n(ours)",
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

/** Grouped bars: overall accuracy, and accuracy split by claim truth. */
function accuracyChart(): string {
  const W = 880;
  const H = 460;
  const padL = 70;
  const padB = 96;
  const padT = 64;
  const plotW = W - padL - 40;
  const plotH = H - padT - padB;

  const groups = results.arms.map((a) => ({
    label: LABELS[a.arm] ?? a.arm,
    ours: a.arm === "adversarial",
    bars: [
      { key: "Overall", v: a.accuracy },
      { key: "On true claims", v: a.accuracyOnTrue ?? 0 },
      { key: "On false claims", v: a.accuracyOnFalse ?? 0 },
    ],
  }));

  const gw = plotW / groups.length;
  const bw = Math.min(52, (gw - 40) / 3);

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="system-ui,-apple-system,sans-serif">
<rect width="${W}" height="${H}" fill="#fff"/>
<text x="${padL}" y="34" font-size="20" font-weight="700" fill="${INK}">Verdict accuracy by reasoning architecture</text>
<text x="${padL}" y="54" font-size="12" fill="${DIM}">Same model, same retrieved evidence — only the reasoning structure differs. n = 28 claims.</text>`;

  // gridlines
  for (let p = 0; p <= 100; p += 25) {
    const y = padT + plotH - (p / 100) * plotH;
    s += `<line x1="${padL}" y1="${y}" x2="${padL + plotW}" y2="${y}" stroke="#e8eaee"/>
<text x="${padL - 10}" y="${y + 4}" font-size="11" fill="${DIM}" text-anchor="end">${p}%</text>`;
  }

  groups.forEach((g, gi) => {
    const gx = padL + gi * gw;
    g.bars.forEach((b, bi) => {
      const h = b.v * plotH;
      const x = gx + gw / 2 - (bw * 3 + 16) / 2 + bi * (bw + 8);
      const y = padT + plotH - h;
      // Ours is solid violet; baselines grey. Within a group, opacity separates
      // the three measures without introducing more colours.
      const fill = g.ours ? OURS : BASE;
      s += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${fill}" opacity="${1 - bi * 0.25}" rx="2"/>
<text x="${x + bw / 2}" y="${y - 7}" font-size="12" font-weight="700" fill="${INK}" text-anchor="middle">${Math.round(b.v * 100)}</text>`;
    });

    // group label, wrapped on \n
    (g.label.split("\n") as string[]).forEach((line, li) => {
      s += `<text x="${gx + gw / 2}" y="${padT + plotH + 24 + li * 15}" font-size="${li === 0 ? 13 : 11}" font-weight="${li === 0 ? 700 : 400}" fill="${li === 0 ? INK : DIM}" text-anchor="middle">${esc(line)}</text>`;
    });
  });

  // legend
  const lx = padL;
  const ly = H - 22;
  ["Overall", "On true claims", "On false claims"].forEach((k, i) => {
    s += `<rect x="${lx + i * 150}" y="${ly - 9}" width="11" height="11" fill="${OURS}" opacity="${1 - i * 0.25}" rx="2"/>
<text x="${lx + i * 150 + 17}" y="${ly}" font-size="11" fill="${DIM}">${k}</text>`;
  });

  return s + "</svg>";
}

/** Reliability diagram for our arm: does stated confidence match observed accuracy? */
function calibrationChart(): string {
  const arm = results.arms.find((a) => a.arm === "adversarial");
  if (!arm) return "";

  const W = 560;
  const H = 500;
  const pad = 74;
  const plot = W - pad * 2;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="system-ui,-apple-system,sans-serif">
<rect width="${W}" height="${H}" fill="#fff"/>
<text x="${pad}" y="34" font-size="19" font-weight="700" fill="${INK}">Is the confidence calibrated?</text>
<text x="${pad}" y="54" font-size="12" fill="${DIM}">Stated confidence vs observed accuracy. On the line = honest.</text>`;

  const x0 = pad;
  const y0 = 90;

  // perfect-calibration diagonal
  s += `<line x1="${x0}" y1="${y0 + plot}" x2="${x0 + plot}" y2="${y0}" stroke="${DIM}" stroke-dasharray="5 5"/>
<text x="${x0 + plot - 6}" y="${y0 + 16}" font-size="10" fill="${DIM}" text-anchor="end">perfect calibration</text>`;

  // axes box + ticks (0.5 → 1.0 on both axes)
  s += `<rect x="${x0}" y="${y0}" width="${plot}" height="${plot}" fill="none" stroke="#e8eaee"/>`;
  for (let i = 0; i <= 5; i++) {
    const f = i / 5;
    const v = 50 + f * 50;
    s += `<text x="${x0 + f * plot}" y="${y0 + plot + 18}" font-size="10" fill="${DIM}" text-anchor="middle">${v}%</text>
<text x="${x0 - 8}" y="${y0 + plot - f * plot + 4}" font-size="10" fill="${DIM}" text-anchor="end">${v}%</text>`;
  }

  const scale = (v: number) => Math.max(0, Math.min(1, (v - 0.5) / 0.5));

  const pts = arm.calibration.filter((b) => b.n > 0 && b.accuracy !== null);
  let poly = "";
  pts.forEach((b) => {
    const cx = x0 + scale(b.meanConfidence!) * plot;
    const cy = y0 + plot - scale(b.accuracy!) * plot;
    poly += `${cx},${cy} `;
    const r = 5 + Math.min(9, b.n);
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${OURS}" opacity="0.82"/>
<text x="${cx}" y="${cy - r - 6}" font-size="10" fill="${INK}" text-anchor="middle">n=${b.n}</text>`;
  });
  if (pts.length > 1) {
    s += `<polyline points="${poly.trim()}" fill="none" stroke="${OURS}" stroke-width="2"/>`;
  }

  s += `<text x="${x0 + plot / 2}" y="${H - 22}" font-size="11" fill="${DIM}" text-anchor="middle">stated confidence</text>
<text x="18" y="${y0 + plot / 2}" font-size="11" fill="${DIM}" text-anchor="middle" transform="rotate(-90 18 ${y0 + plot / 2})">observed accuracy</text>`;

  return s + "</svg>";
}

/** Did the tribunal name the right failure mode, not just spot a problem? */
function failureTypeChart(): string {
  const W = 620;
  const H = 300;
  const padL = 190;
  const padT = 84;
  const barH = 34;
  const plotW = W - padL - 70;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="system-ui,-apple-system,sans-serif">
<rect width="${W}" height="${H}" fill="#fff"/>
<text x="24" y="34" font-size="19" font-weight="700" fill="${INK}">Naming the right failure mode</text>
<text x="24" y="54" font-size="12" fill="${DIM}">Not just "wrong" — fabricated citation vs stale fact vs overgeneralization.</text>`;

  results.arms.forEach((a, i) => {
    const v = a.failureTypeAccuracy ?? 0;
    const y = padT + i * (barH + 20);
    const w = v * plotW;
    const ours = a.arm === "adversarial";
    s += `<text x="${padL - 14}" y="${y + barH / 2 + 4}" font-size="12" font-weight="${ours ? 700 : 400}" fill="${ours ? INK : DIM}" text-anchor="end">${esc((LABELS[a.arm] ?? a.arm).replace("\n", " "))}</text>
<rect x="${padL}" y="${y}" width="${plotW}" height="${barH}" fill="#f1f2f5" rx="3"/>
<rect x="${padL}" y="${y}" width="${w}" height="${barH}" fill="${ours ? OURS : BASE}" rx="3"/>
<text x="${padL + w + 10}" y="${y + barH / 2 + 4}" font-size="13" font-weight="700" fill="${INK}">${Math.round(v * 100)}%</text>`;
  });

  return s + "</svg>";
}

const dir = path.join(process.cwd(), "eval", "charts");
mkdirSync(dir, { recursive: true });

writeFileSync(path.join(dir, "accuracy.svg"), accuracyChart(), "utf8");
writeFileSync(path.join(dir, "calibration.svg"), calibrationChart(), "utf8");
writeFileSync(path.join(dir, "failure-types.svg"), failureTypeChart(), "utf8");

console.log("Wrote eval/charts/accuracy.svg, calibration.svg, failure-types.svg");
for (const a of results.arms) {
  console.log(
    `  ${a.arm.padEnd(12)} overall ${(a.accuracy * 100).toFixed(1)}%  ` +
      `true ${((a.accuracyOnTrue ?? 0) * 100).toFixed(0)}%  ` +
      `false ${((a.accuracyOnFalse ?? 0) * 100).toFixed(0)}%  ` +
      `failure-type ${((a.failureTypeAccuracy ?? 0) * 100).toFixed(0)}%`,
  );
}
