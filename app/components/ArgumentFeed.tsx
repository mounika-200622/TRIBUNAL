"use client";

import { VerdictCard } from "./VerdictCard";
import { useEffect, useRef } from "react";
import type { TribunalState } from "@/lib/reducer";
import { allArguments } from "@/lib/reducer";

export function ArgumentFeed({ state }: { state: TribunalState }) {
  const args = allArguments(state);
  const doneClaims = state.claims.filter((c) => c.status === "done");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [args.length]);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-wide text-dim">
        Argument feed
      </h2>

      {args.length === 0 && (
        <p className="text-sm text-dim">Waiting for the first argument…</p>
      )}

      {doneClaims.length > 0 && (
        <div className="mb-4 space-y-3">
          {doneClaims.map((c) => (
            <VerdictCard key={c.id} claim={c} />
          ))}
        </div>
      )}
      <ul className="space-y-3">
        {args.map((a, i) => (
          <li
            key={a.id}
            className={`tribunal-arg-card group relative overflow-hidden border p-4 transition-transform ${
              a.role === "prosecutor"
                ? "prosecutor border-[rgba(232,35,47,.35)] bg-gradient-to-b from-[rgba(46,20,24,.55)] to-[rgba(13,17,32,.75)]"
                : "defender border-[rgba(56,185,138,.35)] bg-gradient-to-b from-[rgba(15,38,29,.55)] to-[rgba(13,17,32,.75)]"
            }`}
          >

            <div className="relative flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                  a.role === "prosecutor"
                    ? "border-[rgba(232,35,47,.4)] text-refuted"
                    : "border-[rgba(56,185,138,.4)] text-supported"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 ${
                    a.role === "prosecutor" ? "bg-refuted" : "bg-supported"
                  }`}
                />
                {a.role === "prosecutor" ? "Prosecution" : "Defense"}
              </span>
              <span className="font-mono text-[10px] tracking-wide text-dim">
                ARG.{String(i + 1).padStart(2, "0")}
              </span>
            </div>

            <p
              className={`relative mt-3 font-mono text-xs uppercase tracking-wide ${
                a.role === "prosecutor" ? "text-refuted" : "text-supported"
              }`}
            >
              {a.lens}
            </p>
            <p className="relative mt-1 text-sm">{a.position}</p>
            <div className="relative mt-3 h-[2px] w-full overflow-hidden bg-[rgba(233,230,223,.14)]">
              <div
                className={`h-full ${
                  a.role === "prosecutor" ? "bg-refuted" : "bg-supported"
                }`}
                style={{ width: `${Math.round(a.strength * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div ref={endRef} />
    </div>
  );
}