"use client";

import { useEffect, useState } from "react";

/*
 * The animated backdrop behind the whole app: a faint circuit-board grid
 * with small lights running in fixed lanes (not randomly, so it reads as
 * organized data traffic rather than falling snow), plus a few soft glow
 * orbs and a slow scanline. Purely decorative — aria-hidden, no interaction.
 */

type Lane = {
  id: string;
  axis: "h" | "v";
  position: number;
  duration: number;
  delay: number;
  reverse: boolean;
  color: "cyan" | "accent" | "unverifiable";
};

const GRID = 42;
const LANE_STEP = 4; // only every 4th row/column is an active lane
const COLORS: Lane["color"][] = ["cyan", "accent", "unverifiable"];

export function GridBackground() {
  const [lanes, setLanes] = useState<Lane[]>([]);

  useEffect(() => {
    const cols = Math.ceil(window.innerWidth / GRID);
    const rows = Math.ceil(window.innerHeight / GRID);
    const next: Lane[] = [];
    let colorIndex = 0;

    for (let r = 2; r < rows; r += LANE_STEP) {
      const reverse = (r / LANE_STEP) % 2 === 1;
      const duration = 10 + (r % 5) * 2;
      const color = COLORS[colorIndex++ % COLORS.length];
      for (let k = 0; k < 2; k++) {
        next.push({
          id: `h-${r}-${k}`,
          axis: "h",
          position: r * GRID,
          duration,
          delay: -((k * duration) / 2),
          reverse,
          color,
        });
      }
    }

    for (let c = 2; c < cols; c += LANE_STEP) {
      const reverse = (c / LANE_STEP) % 2 === 1;
      const duration = 11 + (c % 5) * 2;
      const color = COLORS[colorIndex++ % COLORS.length];
      for (let k = 0; k < 2; k++) {
        next.push({
          id: `v-${c}-${k}`,
          axis: "v",
          position: c * GRID,
          duration,
          delay: -((k * duration) / 2),
          reverse,
          color,
        });
      }
    }

    setLanes(next);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="grid-bg absolute inset-0" />
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className="glow-orb glow-orb-3" />
      <div className="scanline" />
      {lanes.map((lane) => (
        <div
          key={lane.id}
          className={`traveler traveler-${lane.color} ${
            lane.axis === "h" ? "traveler-h" : "traveler-v"
          } ${lane.reverse ? "traveler-reverse" : ""}`}
          style={
            lane.axis === "h"
              ? {
                  top: lane.position,
                  animationDuration: `${lane.duration}s`,
                  animationDelay: `${lane.delay}s`,
                }
              : {
                  left: lane.position,
                  animationDuration: `${lane.duration}s`,
                  animationDelay: `${lane.delay}s`,
                }
          }
        />
      ))}
    </div>
  );
}