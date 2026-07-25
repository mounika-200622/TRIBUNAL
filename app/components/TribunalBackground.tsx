"use client";

import { useEffect, useState } from "react";

const GRID = 42;
const LANE_STEP = 4;
const COLOR_CLASSES = ["", "violet", "amber"];

type Traveler = {
  key: string;
  className: string;
  style: React.CSSProperties;
};

function buildTravelers(): Traveler[] {
  if (typeof window === "undefined") return [];
  const cols = Math.ceil(window.innerWidth / GRID);
  const rows = Math.ceil(window.innerHeight / GRID);
  const travelers: Traveler[] = [];
  let colorIndex = 0;

  for (let r = 2; r < rows; r += LANE_STEP) {
    const top = r * GRID;
    const reverse = (r / LANE_STEP) % 2 === 1;
    const duration = 10 + (r % 5) * 2;
    const colorClass = COLOR_CLASSES[colorIndex++ % COLOR_CLASSES.length];
    for (let k = 0; k < 2; k++) {
      travelers.push({
        key: `h-${r}-${k}`,
        className: `tribunal-traveler h ${reverse ? "reverse" : ""} ${colorClass}`.trim(),
        style: {
          top,
          animationDuration: `${duration}s`,
          animationDelay: `${-(k * duration) / 2}s`,
        },
      });
    }
  }

  for (let c = 2; c < cols; c += LANE_STEP) {
    const left = c * GRID;
    const reverse = (c / LANE_STEP) % 2 === 1;
    const duration = 11 + (c % 5) * 2;
    const colorClass = COLOR_CLASSES[colorIndex++ % COLOR_CLASSES.length];
    for (let k = 0; k < 2; k++) {
      travelers.push({
        key: `v-${c}-${k}`,
        className: `tribunal-traveler v ${reverse ? "reverse" : ""} ${colorClass}`.trim(),
        style: {
          left,
          animationDuration: `${duration}s`,
          animationDelay: `${-(k * duration) / 2}s`,
        },
      });
    }
  }

  return travelers;
}

/**
 * Fixed, full-viewport backdrop: circuit grid + drifting glow orbs +
 * scanline + traveling light particles. Renders behind whatever page
 * content sits on top of it (that content should use `relative z-10`).
 * Used by both Landing and TribunalView so the two pages share one
 * identical moving background.
 */
export function TribunalBackground() {
  const [travelers, setTravelers] = useState<Traveler[]>([]);

  useEffect(() => {
    setTravelers(buildTravelers());
    const onResize = () => setTravelers(buildTravelers());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <div className="tribunal-grid-bg" />
      <div className="tribunal-glow-orb o1" />
      <div className="tribunal-glow-orb o2" />
      <div className="tribunal-glow-orb o3" />
      <div className="tribunal-scanline" />
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {travelers.map((t) => (
          <div key={t.key} className={t.className} style={t.style} />
        ))}
      </div>
    </>
  );
}