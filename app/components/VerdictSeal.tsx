"use client";

import { motion } from "motion/react";
import type { VerdictKind } from "@/lib/types";

/**
 * The seal doesn't fade in — it lands.
 *
 * Wind-up oversized and rotated, then a stiff spring slams it to rest. This is
 * the moment the whole product rests on, so it gets weight: a claim being struck
 * down should feel like something happened, not like a div appeared.
 *
 * A supported verdict runs the same choreography with a softer spring and no
 * strike-through, so the two outcomes are physically distinguishable rather than
 * just recoloured.
 */

const TONE: Record<VerdictKind, { ink: string; wash: string; label: string }> = {
  refuted: { ink: "#ff5a5f", wash: "#1a0e11", label: "REFUTED" },
  supported: { ink: "#1fc16b", wash: "#0d1a14", label: "SUPPORTED" },
  unverifiable: { ink: "#ffc83a", wash: "#1a1509", label: "UNVERIFIABLE" },
};

export function VerdictSeal({
  verdict,
  confidence,
  delay = 0,
}: {
  verdict: VerdictKind;
  confidence: number | null;
  delay?: number;
}) {
  const tone = TONE[verdict];
  const hard = verdict === "refuted";

  return (
    <motion.div
      className="relative grid h-[132px] w-[132px] shrink-0 place-items-center"
      initial={{ scale: 2.4, opacity: 0, rotate: hard ? -12 : -6 }}
      animate={{ scale: 1, opacity: 1, rotate: hard ? -4 : -2 }}
      transition={{
        type: "spring",
        // A refutation hits harder and rings slightly; a support settles.
        stiffness: hard ? 700 : 380,
        damping: hard ? 18 : 24,
        delay,
      }}
    >
      {/* impact rings — expand outward once, then stop */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full border"
        style={{ borderColor: tone.ink }}
        initial={{ scale: 0.9, opacity: 0.5 }}
        animate={{ scale: 1.55, opacity: 0 }}
        transition={{ duration: 0.7, delay: delay + 0.1, ease: "easeOut" }}
      />
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full border"
        style={{ borderColor: tone.ink }}
        initial={{ scale: 0.9, opacity: 0.35 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.9, delay: delay + 0.16, ease: "easeOut" }}
      />

      <div
        className="grid h-[118px] w-[118px] place-items-center rounded-full border-[3px] text-center"
        style={{ borderColor: tone.ink, background: tone.wash }}
      >
        <div>
          <p
            className="font-display text-[15px] font-extrabold leading-none tracking-[0.06em]"
            style={{ color: tone.ink }}
          >
            {tone.label}
          </p>
          <div
            className="mx-auto my-1.5 h-px w-12 opacity-50"
            style={{ background: tone.ink }}
          />
          <p className="font-display text-[22px] font-bold leading-none text-white">
            {confidence === null ? "—" : `${Math.round(confidence * 100)}%`}
          </p>
          <p className="mt-1 font-mono text-[7.5px] tracking-[0.22em] text-dim">
            CONFIDENCE
          </p>
        </div>
      </div>
    </motion.div>
  );
}
