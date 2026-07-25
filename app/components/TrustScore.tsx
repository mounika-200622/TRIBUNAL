"use client";

import { useEffect, useRef, useState } from "react";
import type { TribunalState } from "@/lib/reducer";
import { counts } from "@/lib/reducer";

const CX = 220;
const CY = 220;
const R_ARC = 196;
const CIRCUMFERENCE = 2 * Math.PI * R_ARC;
const R_TICK_OUTER = 214;
const R_TICK_MINOR = 206;
const R_TICK_MAJOR = 200;
const R_MARKER_PCT = (204 / 440) * 100; // percent of the 440 box, same radius family as the ticks

function tier(score: number) {
  if (score < 40) return "tier-low";
  if (score < 70) return "tier-mid";
  return "tier-high";
}

function tierColor(score: number) {
  if (score < 40) return "#ff5470";
  if (score < 70) return "#ffb020";
  return "#2be6a6";
}

function verdictParts(score: number): { prefix: string; accent: string; suffix: string } {
  if (score >= 80) return { prefix: "This answer is ", accent: "highly reliable", suffix: "." };
  if (score >= 55) return { prefix: "This answer is ", accent: "mostly reliable", suffix: "." };
  if (score >= 30)
    return { prefix: "This answer is ", accent: "mixed", suffix: " — verify before trusting it." };
  return { prefix: "This answer is ", accent: "mostly unreliable", suffix: "." };
}

const VERDICT_COLOR: Record<string, string> = {
  supported: "#2be6a6",
  refuted: "#ff5470",
  unverifiable: "#ffb020",
};

export function TrustScore({ state }: { state: TribunalState }) {
  const c = counts(state);
  const score = state.trustScore ?? 0;
  const [animScore, setAnimScore] = useState(0);
  const [arcOffset, setArcOffset] = useState(CIRCUMFERENCE);
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [sessionId] = useState(() => Math.floor(1000 + Math.random() * 9000));

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setArcOffset(CIRCUMFERENCE * (1 - score / 100));
    });

    if (score <= 0) {
      setAnimScore(0);
      return () => cancelAnimationFrame(raf);
    }
    let val = 0;
    const iv = setInterval(() => {
      val++;
      setAnimScore(val);
      if (val >= score) clearInterval(iv);
    }, 1400 / score);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(iv);
    };
  }, [score]);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#080b14",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = "tribunal-verdict.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      alert("Couldn't generate the image. Try a screenshot instead.");
    } finally {
      setDownloading(false);
    }
  };

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 60 - Math.PI / 2;
    const major = i % 5 === 0;
    const rInner = major ? R_TICK_MAJOR : R_TICK_MINOR;
    return {
      key: i,
      major,
      x1: CX + Math.cos(angle) * R_TICK_OUTER,
      y1: CY + Math.sin(angle) * R_TICK_OUTER,
      x2: CX + Math.cos(angle) * rInner,
      y2: CY + Math.sin(angle) * rInner,
    };
  });

  const markers = state.claims
    .filter((claim) => claim.verdict)
    .map((claim, i, arr) => {
      const angle = (Math.PI * 2 * i) / arr.length - Math.PI / 2;
      return {
        key: claim.id,
        color: VERDICT_COLOR[claim.verdict as string] ?? "#7c88a8",
        top: 50 + R_MARKER_PCT * Math.sin(angle),
        left: 50 + R_MARKER_PCT * Math.cos(angle),
      };
    });

  const verdict = verdictParts(score);

  return (
    <div ref={cardRef} className="tv-stage">
      <div className="tv-seal">
        <div className="tv-seal-ring">
          <svg viewBox="0 0 440 440">
            <g>
              {ticks.map((t) => (
                <line
                  key={t.key}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  className={`tv-tick ${t.major ? "major" : ""}`}
                />
              ))}
            </g>
            <circle className="tv-arc-track" cx={CX} cy={CY} r={R_ARC} />
            <circle className="tv-arc-track" cx={CX} cy={CY} r={178} />
            <circle className="tv-arc-track" cx={CX} cy={CY} r={160} />
            <circle
              className="tv-arc-progress"
              cx={CX}
              cy={CY}
              r={R_ARC}
              stroke={tierColor(score)}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={arcOffset}
              style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)" }}
            />
          </svg>
        </div>

        {markers.map((m) => (
          <div
            key={m.key}
            className="tv-orbit-marker"
            style={{ color: m.color, top: `${m.top}%`, left: `${m.left}%` }}
          >
            <div className="tv-core" />
          </div>
        ))}

        <div className="tv-core-readout">
          <span className="tv-core-label">Trust Score</span>
          <span className={`tv-core-score ${tier(score)}`}>{animScore}</span>
          <span className="tv-core-max">/ 100</span>
        </div>
      </div>

      <div className="tv-verdict-line">
        <h2>
          {verdict.prefix}
          <em className="tv-accent">{verdict.accent}</em>
          {verdict.suffix}
        </h2>
      </div>

      <div className="tv-chip-row">
        <div className="tv-chip supported">
          <span className="tv-swatch" />
          {c.supported} <b>Supported</b>
        </div>
        <div className="tv-chip refuted">
          <span className="tv-swatch" />
          {c.refuted} <b>Refuted</b>
        </div>
        <div className="tv-chip unverifiable">
          <span className="tv-swatch" />
          {c.unverifiable} <b>Unverifiable</b>
        </div>
      </div>

      <div className="tv-actions">
        <button onClick={handleShare} disabled={downloading} className="tv-ghost-btn primary">
          ↗ {downloading ? "Generating…" : "Share verdict"}
        </button>
        <button onClick={() => window.location.reload()} className="tv-ghost-btn">
          ↺ Re-run
        </button>
      </div>

      <div className="tv-stamp">Verified by Tribunal · session #{sessionId}</div>
    </div>
  );
}