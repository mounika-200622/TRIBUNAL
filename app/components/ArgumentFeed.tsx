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
        {args.map((a) => (
          <li
            key={a.id}
            className={`rounded-md border-l-4 bg-panel p-3 ${
              a.role === "prosecutor" ? "border-refuted" : "border-supported"
            }`}
          >
            <p
              className={`font-mono text-xs uppercase tracking-wide ${
                a.role === "prosecutor" ? "text-refuted" : "text-supported"
              }`}
            >
              {a.lens}
            </p>
            <p className="mt-1 text-sm">{a.position}</p>
            <div className="mt-2 h-1 w-full overflow-hidden rounded bg-line">
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