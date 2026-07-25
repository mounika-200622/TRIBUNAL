"use client";

import { motion } from "motion/react";
import type { Claim } from "@/lib/types";
import { FAILURE_LABELS } from "@/lib/types";
import { SourceChip } from "./SourceChip";
import { VerdictSeal } from "./VerdictSeal";

/**
 * A verdict landing, choreographed in four beats.
 *
 * 1 wind-up   the seal enters oversized and rotated
 * 2 impact    it slams to rest and the frame shakes
 * 3 strike    a line draws across the claim as it greys out (refuted only)
 * 4 burn-in   the failure mode appears last, then the ruling staggers beneath
 *
 * The beats are offset rather than simultaneous so the eye is led: what happened,
 * then what it means, then why. A supported verdict skips the strike-through and
 * the failure chip — so the two outcomes read as different events, not just
 * different colours.
 */

const TONE = {
  refuted: { ink: "#ff5a5f", edge: "rgba(255,90,95,.4)", wash: "rgba(42,15,19,.55)" },
  supported: { ink: "#1fc16b", edge: "rgba(31,193,107,.4)", wash: "rgba(13,26,20,.55)" },
  unverifiable: { ink: "#ffc83a", edge: "rgba(255,200,58,.4)", wash: "rgba(26,21,9,.55)" },
} as const;

export function VerdictCard({ claim }: { claim: Claim }) {
  if (!claim.verdict) return null;

  const tone = TONE[claim.verdict];
  const refuted = claim.verdict === "refuted";
  const prosecutors = claim.arguments.filter((a) => a.role === "prosecutor");
  const against = prosecutors.filter((a) => a.strength >= 0.5).length;
  const showFailure = claim.failureType && claim.failureType !== "none";

  return (
    <motion.article
      className="relative overflow-hidden rounded-xl border p-5"
      style={{ borderColor: tone.edge, background: tone.wash }}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        // Beat 2 — the frame absorbs the impact. Keyframes rather than a spring
        // so the shake resolves exactly and never wobbles on.
        x: refuted ? [0, -8, 7, -5, 3, -1, 0] : [0, -2, 1, 0],
      }}
      transition={{
        opacity: { duration: 0.25 },
        y: { duration: 0.25 },
        x: { delay: 0.12, duration: refuted ? 0.42 : 0.2, ease: "easeOut" },
      }}
    >
      <div className="flex flex-col-reverse items-start gap-5 sm:flex-row">
        <div className="min-w-0 flex-1">
          {/* the claim, struck through as the verdict lands */}
          <div className="relative">
            <motion.p
              className="font-display text-lg italic"
              initial={{ color: "#eceef2" }}
              animate={{ color: refuted ? "#8891a6" : "#eceef2" }}
              transition={{ delay: 0.2, duration: 0.35 }}
            >
              &ldquo;{claim.text}&rdquo;
            </motion.p>

            {refuted && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute left-0 top-1/2 h-[2px] w-full origin-left"
                style={{ background: tone.ink }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.18, duration: 0.22, ease: "easeOut" }}
              />
            )}
          </div>

          {/* beat 4 — failure mode burns in after the seal has landed */}
          {showFailure && (
            <motion.div
              className="mt-4 inline-flex flex-wrap items-center gap-2 rounded border px-3 py-1.5"
              style={{ borderColor: tone.ink, background: "rgba(0,0,0,.35)" }}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.42, duration: 0.3, ease: "easeOut" }}
            >
              <span
                className="font-mono text-[9px] font-bold tracking-[0.18em]"
                style={{ color: tone.ink }}
              >
                FAILURE MODE
              </span>
              <span className="font-display text-[13px] font-bold uppercase tracking-wide text-white">
                {FAILURE_LABELS[claim.failureType!]}
              </span>
            </motion.div>
          )}

          {/* the ruling and its detail, staggered in beneath */}
          <motion.div
            initial="hidden"
            animate="shown"
            variants={{
              shown: { transition: { staggerChildren: 0.06, delayChildren: 0.5 } },
            }}
          >
            {claim.reasoning && (
              <motion.p
                className="mt-4 border-t pt-4 text-sm text-paper"
                style={{ borderColor: "rgba(120,160,255,.15)" }}
                variants={{ hidden: { opacity: 0, y: 6 }, shown: { opacity: 1, y: 0 } }}
              >
                {claim.reasoning}
              </motion.p>
            )}

            {prosecutors.length > 0 && (
              <motion.p
                className="mt-3 font-mono text-[11px] tracking-wide text-dim"
                variants={{ hidden: { opacity: 0, y: 6 }, shown: { opacity: 1, y: 0 } }}
              >
                PANEL SPLIT {against}&ndash;{prosecutors.length - against}
                {claim.disagreement !== null &&
                  ` · DISAGREEMENT ${claim.disagreement.toFixed(2)}`}
              </motion.p>
            )}

            {claim.sources.length > 0 && (
              <motion.div
                className="mt-4 flex flex-wrap gap-2"
                variants={{ hidden: { opacity: 0, y: 6 }, shown: { opacity: 1, y: 0 } }}
              >
                {claim.sources.map((s) => (
                  <SourceChip key={s.id} source={s} />
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>

        <VerdictSeal verdict={claim.verdict} confidence={claim.confidence} delay={0.08} />
      </div>
    </motion.article>
  );
}
