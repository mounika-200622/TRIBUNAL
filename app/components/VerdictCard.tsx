"use client";

import type { Claim } from "@/lib/types";
import { FAILURE_LABELS } from "@/lib/types";
import { SourceChip } from "./SourceChip";

const VERDICT_STYLE: Record<string, string> = {
  supported: "bg-supported/15 text-supported border-supported",
  refuted: "bg-refuted/15 text-refuted border-refuted",
  unverifiable: "bg-unverifiable/15 text-unverifiable border-unverifiable",
};

const VERDICT_LABEL: Record<string, string> = {
  supported: "SUPPORTED",
  refuted: "REFUTED",
  unverifiable: "UNVERIFIABLE",
};

export function VerdictCard({ claim }: { claim: Claim }) {
  if (!claim.verdict) return null;

  const prosecutorArgs = claim.arguments.filter((a) => a.role === "prosecutor");
  const against = prosecutorArgs.filter((a) => a.strength >= 0.5).length;
  const forCount = prosecutorArgs.length - against;

  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <p className="font-display text-lg italic text-paper">&ldquo;{claim.text}&rdquo;</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-md border px-3 py-1 font-display text-sm font-extrabold tracking-wide ${VERDICT_STYLE[claim.verdict]}`}>
          {VERDICT_LABEL[claim.verdict]}
        </span>

        {claim.failureType && claim.failureType !== "none" && (
          <span className="rounded-md border border-refuted bg-refuted/15 px-3 py-1 font-mono text-xs font-bold uppercase text-refuted">
            {FAILURE_LABELS[claim.failureType]}
          </span>
        )}
      </div>

      {claim.confidence !== null && (
        <div className="mt-4">
          <p className="font-mono text-xs uppercase tracking-wide text-dim">
            Confidence — {Math.round(claim.confidence * 100)}%
          </p>
          <div className="mt-1 h-2 w-full overflow-hidden rounded bg-line">
            <div className="h-full bg-accent" style={{ width: `${Math.round(claim.confidence * 100)}%` }} />
          </div>
        </div>
      )}

      {prosecutorArgs.length > 0 && (
        <p className="mt-2 font-mono text-xs text-dim">
          Prosecutors split {against}–{forCount}
        </p>
      )}

      {claim.reasoning && (
        <p className="mt-4 border-t border-line pt-4 text-sm text-paper">{claim.reasoning}</p>
      )}

      {claim.sources.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {claim.sources.map((s) => (
            <SourceChip key={s.id} source={s} />
          ))}
        </div>
      )}
    </div>
  );
}